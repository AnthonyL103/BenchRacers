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

export function VinLookup({ onDataFound, onSuccess, disabled = false }: VinLookupProps) {
  const [vin, setVin] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

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
      console.log("🔍 Looking up VIN via backend:", vin);
      
      // Call your backend API instead of NHTSA directly
      const response = await fetch(`https://api.benchracershq.com/api/garage/vinlookup/${vin}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("📡 Backend API Response:", data);
      
      if (!data.success) {
        throw new Error(data.message || "VIN lookup failed");
      }
      
      if (!data.data) {
        throw new Error("No vehicle data returned");
      }

      console.log("✅ VIN Data received:", data.data);

      setLookupStatus("success");
      onDataFound(data.data);
      onSuccess?.();
        
    } catch (error) {
      console.error("🔥 VIN lookup error:", error);
      
      let errorMessage = "Failed to lookup VIN. Please enter details manually.";
      
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("unauthorized")) {
          errorMessage = "Authentication required. Please log in and try again.";
        } else if (error.message.includes("Network") || error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setErrorMessage(errorMessage);
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
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              inputMode="text"
              pattern="[A-Z0-9]*"
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