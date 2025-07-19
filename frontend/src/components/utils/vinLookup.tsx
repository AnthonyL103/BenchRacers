"use client"

import React, { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Alert, AlertDescription } from "../ui/alert"
import { Loader2, Search, CheckCircle, AlertCircle } from "lucide-react"

interface CarDetails {
  make: string;
  model: string;
  year: string;
  trim: string;
  engine: string;
  color: string;
  transmission: string;
  drivetrain: string;
}

interface VinLookupProps {
  onDataFound: (carDetails: Partial<CarDetails>) => void;
  onSuccess?: () => void;
  disabled?: boolean;
}

interface VinResult {
  Variable: string;
  Value: string;
  ValueId: string;
}

export function VinLookup({ onDataFound, onSuccess, disabled = false }: VinLookupProps) {
  const [vin, setVin] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Helper function to find value by variable name
  const findValue = (results: VinResult[], variableName: string): string => {
    const result = results.find((item: VinResult) => 
      item.Variable?.toLowerCase().includes(variableName.toLowerCase())
    );
    return result?.Value || "";
  };

  // Helper function to map body class to category
  const getCategoryFromBodyClass = (bodyClass: string): string => {
    if (!bodyClass) return "";
    
    const bodyClassLower = bodyClass.toLowerCase();
    
    if (bodyClassLower.includes("truck") || bodyClassLower.includes("pickup")) return "Off-Road";
    if (bodyClassLower.includes("suv") || bodyClassLower.includes("sport utility")) return "Off-Road";
    if (bodyClassLower.includes("coupe") || bodyClassLower.includes("convertible")) return "Street";
    if (bodyClassLower.includes("sedan") || bodyClassLower.includes("hatchback")) return "Street";
    if (bodyClassLower.includes("wagon")) return "Street";
    if (bodyClassLower.includes("roadster") || bodyClassLower.includes("sports")) return "Street";
    
    return "Street"; // Default
  };

  // Extract color from various VIN fields (limited info available)
  const extractColor = (results: VinResult[]): string => {
    // VIN doesn't contain color information
    // This would need to come from additional APIs or user input
    return "";
  };

  // Extract comprehensive trim information
  const extractTrim = (results: VinResult[]): string => {
    const trim = findValue(results, "Trim");
    const series = findValue(results, "Series");
    const trim2 = findValue(results, "Trim2");
    
    // Combine available trim information
    const trimParts = [trim, series, trim2].filter(Boolean);
    return trimParts.join(" ") || "";
  };

  // Format engine information
  const formatEngine = (results: VinResult[]): string => {
    const cylinders = findValue(results, "Engine Number of Cylinders");
    const configuration = findValue(results, "Engine Configuration");
    const fuelType = findValue(results, "Fuel Type Primary");
    const displacement = findValue(results, "Displacement (L)");
    const engineModel = findValue(results, "Engine Model");
    const turbocharger = findValue(results, "Turbocharger");
    
    let engine = "";
    
    if (displacement) {
      engine += `${displacement}L `;
    }
    
    if (cylinders && configuration) {
      engine += `${configuration}${cylinders} `;
    } else if (cylinders) {
      engine += `${cylinders}-Cylinder `;
    }
    
    if (turbocharger && turbocharger.toLowerCase() === "yes") {
      engine += "Turbo ";
    }
    
    if (fuelType && fuelType.toLowerCase() !== "gasoline") {
      engine += `${fuelType} `;
    }
    
    if (engineModel) {
      engine += `(${engineModel})`;
    }
    
    return engine.trim() || engineModel || "";
  };

  // Format transmission information comprehensively
  const formatTransmission = (results: VinResult[]): string => {
    const transmissionStyle = findValue(results, "Transmission Style");
    const transmissionSpeeds = findValue(results, "Transmission Speeds");
    const transmissionDescriptor = findValue(results, "Transmission Descriptor");
    
    let transmission = "";
    
    if (transmissionSpeeds) {
      transmission += `${transmissionSpeeds}-Speed `;
    }
    
    if (transmissionStyle) {
      // Clean up the transmission style
      let style = transmissionStyle;
      if (style.toLowerCase().includes("manual")) {
        transmission += "Manual";
      } else if (style.toLowerCase().includes("automatic")) {
        transmission += "Automatic";
      } else if (style.toLowerCase().includes("cvt")) {
        transmission += "CVT";
      } else if (style.toLowerCase().includes("dct") || style.toLowerCase().includes("dual")) {
        transmission += "Dual-Clutch";
      } else {
        transmission += style;
      }
    }
    
    if (transmissionDescriptor && transmissionDescriptor !== transmissionStyle) {
      transmission += ` (${transmissionDescriptor})`;
    }
    
    return transmission.trim() || transmissionStyle || "";
  };

  // Format drivetrain
  const formatDrivetrain = (driveType: string): string => {
    const driveTypeLower = driveType.toLowerCase();
    
    if (driveTypeLower.includes("front")) return "FWD";
    if (driveTypeLower.includes("rear")) return "RWD";
    if (driveTypeLower.includes("all") || driveTypeLower.includes("awd")) return "AWD";
    if (driveTypeLower.includes("4wd") || driveTypeLower.includes("four")) return "4WD";
    
    return driveType || "";
  };

  const lookupVin = async () => {
    if (!vin || vin.length !== 17) {
      setErrorMessage("Please enter a valid 17-character VIN");
      setLookupStatus("error");
      return;
    }

    setIsLookingUp(true);
    setLookupStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
      
      if (!response.ok) {
        throw new Error("Failed to connect to VIN database");
      }

      const data = await response.json();
      
      if (data.Results && data.Results.length > 0) {
        // Check if VIN is valid by looking for error messages
        const errorResult = data.Results.find((item: VinResult) => 
          item.Variable === "Error Code" && item.Value !== "0"
        );
        
        if (errorResult) {
          throw new Error("Invalid VIN number");
        }

        // Extract vehicle data
        const make = findValue(data.Results, "Make");
        const model = findValue(data.Results, "Model");
        const year = findValue(data.Results, "Model Year");
        
        // Check if we got essential data
        if (!make || !model || !year) {
          throw new Error("Incomplete vehicle data found for this VIN");
        }

        const vinData: Partial<CarDetails> = {
          make,
          model,
          year,
          trim: extractTrim(data.Results),
          engine: formatEngine(data.Results),
          color: extractColor(data.Results), // Will be empty, user needs to input manually
          transmission: findValue(data.Results, "Transmission Style") || findValue(data.Results, "Transmission Speeds"),
          drivetrain: formatDrivetrain(findValue(data.Results, "Drive Type"))
        };
        
        console.log("VIN Data:", vinData);

        // Clean up empty values
        Object.keys(vinData).forEach(key => {
          if (!vinData[key as keyof CarDetails]) {
            delete vinData[key as keyof CarDetails];
          }
        });

        setLookupStatus("success");
        onDataFound(vinData);
        onSuccess?.();
        
      } else {
        throw new Error("No data found for this VIN");
      }
    } catch (error) {
      console.error("VIN lookup error:", error);
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : "Failed to lookup VIN. Please enter details manually."
      );
      setLookupStatus("error");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleVinChange = (value: string) => {
    // Only allow alphanumeric characters and convert to uppercase
    const cleanVin = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    setVin(cleanVin);
    
    // Reset status when user starts typing
    if (lookupStatus !== "idle") {
      setLookupStatus("idle");
      setErrorMessage("");
    }
  };

  const getStatusIcon = () => {
    switch (lookupStatus) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="vin" className="text-white">
          VIN (Vehicle Identification Number)
        </Label>
        <div className="flex gap-2 mt-1.5">
          <div className="relative flex-1">
            <Input
              id="vin"
              placeholder="e.g. 1HGBH41JXMN109186"
              value={vin}
              onChange={(e) => handleVinChange(e.target.value)}
              maxLength={17}
              disabled={disabled || isLookingUp}
              className={`pr-10 ${
                lookupStatus === "success" 
                  ? "border-green-500" 
                  : lookupStatus === "error" 
                    ? "border-red-500" 
                    : ""
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getStatusIcon()}
            </div>
          </div>
          <Button
            type="button"
            onClick={lookupVin}
            disabled={vin.length !== 17 || isLookingUp || disabled}
            className="flex-shrink-0"
          >
            {isLookingUp ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Looking up...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Lookup
              </>
            )}
          </Button>
        </div>
        
        <div className="mt-2 space-y-2">
          <p className="text-xs text-gray-500">
            Enter your 17-character VIN to automatically populate car details
          </p>
          <p className="text-xs text-gray-400">
            Note: Color information is not available from VIN and must be entered manually
          </p>
          
          {/* Character counter */}
          <p className="text-xs text-gray-400">
            {vin.length}/17 characters
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {lookupStatus === "success" && (
        <Alert className="bg-green-900/20 border-green-900 text-green-400">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            VIN lookup successful! Car details have been populated below. Please enter the color manually.
          </AlertDescription>
        </Alert>
      )}

      {lookupStatus === "error" && errorMessage && (
        <Alert className="bg-red-900/20 border-red-900 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}