"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "../ui/button"
import { ModsTabContent } from "./modsTabcontent";
import { Mod } from "../contexts/garagecontext";
import { PhotoItem } from "../contexts/garagecontext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { Camera, Loader2, Plus, Search, X, Upload, ChevronsUpDown, Check, AlertTriangle, Info } from "lucide-react"
import { Alert, AlertDescription } from "../ui/alert"
import { useGarage } from "../contexts/garagecontext"
import { useUser } from "../contexts/usercontext"
import { VinLookup } from "./vinLookup";
import axios from "axios"


interface AddCarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCarModal({ open, onOpenChange }: AddCarModalProps) {
  const { user } = useUser();
  const { addCar } = useGarage();

  const [activeTab, setActiveTab] = useState("basic")

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [photoPreview, setPhotoPreview] = useState<string[]>([])
  const [description, setDescription] = useState("")
  
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  
  const [Mods, setMods] = useState<Mod[]>([])

  
  const [availableMods, setAvailableMods] = useState<Mod[]>([])

  
  const [isLoadingMods, setIsLoadingMods] = useState(false)
    
  
  const [totalCost, setTotalCost] = useState(0)
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [showError, setShowError] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  

  const [carDetails, setCarDetails] = useState({
    make: "",
    model: "",
    color: "",
    year: "",
    trim: "",
    engine: "",
    basecost: "",
    transmission: "",
    category:"",
    horsepower:"",
    torque:"",
    drivetrain: "",
  })

  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => {
        setShowError(false);
        setErrorMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  const showErrorMessage = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
  };

  useEffect(() => {
    fetchAvailableMods();
  }, []);
  
  useEffect(() => {
  const modsCost = Mods.reduce((sum, mod) => sum + (mod.cost || 0), 0);
  const total = parseFloat(carDetails.basecost) + modsCost;
  
  setTotalCost(total);
}, [Mods, carDetails.basecost]); 
  

const fetchAvailableMods = async () => {
        
    try {
        
        const token = localStorage.getItem('token');
        
        setIsLoadingMods(true);
        const modsResponse = await axios.get('https://api.benchracershq.com/api/garage/mods', {
        
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
        
        });
        
        console.log("Available mods fetched:", modsResponse.data);
        
        
        if (Array.isArray(modsResponse.data.mods)) {
        setAvailableMods(modsResponse.data.mods);
        } else {

        const flatMods = Object.entries(modsResponse.data.mods as Record<string, any[]>).flatMap(([category, mods]) => 
            mods.map(mod => ({...mod, category}))
        );
        setAvailableMods(flatMods);
        }
        
        
        setIsLoadingMods(false);
    } catch (error) {
        console.error("Error fetching available mods:", error);
        setErrors(prev => ({ ...prev, mods: "Failed to load available modifications" }));
    }
    };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }
  
  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }


const getModIdentifier = (mod: Mod): string => {

  if (mod.id) {
    return `id-${mod.id}`;
  }
  if (mod.modID) {
    return `modID-${mod.modID}`;
  }
  
  const brand = mod.brand || 'unknown';
  const category = mod.category || 'unknown';
  const cost = mod.cost || 0;
  const type = mod.type || 'no-type';
  const partNumber = mod.partNumber || 'no-part';
  const description = (mod.description || '').substring(0, 20);
  
  const identifier = `custom-${brand}-${category}-${type}-${partNumber}-${cost}-${description}`.toLowerCase().replace(/\s+/g, '-');
  return identifier;
};

const addMod = (modToAdd: Mod) => {
  
  const newModIdentifier = getModIdentifier(modToAdd);
  const isAlreadySelected = Mods.some(mod => getModIdentifier(mod) === newModIdentifier);
  
  if (!isAlreadySelected) {
    setMods(prevMods => [...prevMods, modToAdd]);
  }
};

const removeMod = (modToRemove: Mod) => {
  
  const modToRemoveIdentifier = getModIdentifier(modToRemove);
  
  setMods(prevMods => 
    prevMods.filter(mod => getModIdentifier(mod) !== modToRemoveIdentifier)
  );
};
  
  
const triggerFileInput = () => {
    fileInputRef.current?.click();
  };


const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  
  const remainingSlots = 6 - photos.length;
  
  if (remainingSlots <= 0) {
    showErrorMessage("You can upload a maximum of 6 images. Remove some photos first to add new ones.");
    return;
  }

  const newFiles = Array.from(files).slice(0, remainingSlots);
  
  setPhotos(prevPhotos => [
    ...prevPhotos,
    ...newFiles.map((file: File) => ({
      file,
      preview: URL.createObjectURL(file),
      isMainPhoto: prevPhotos.length === 0 
    }))
  ]);
  
  e.target.value = '';
};

const removePhoto = (index: number) => {
  setPhotos(prevPhotos => {
    const newPhotos = [...prevPhotos];
    
    const isRemovingMainPhoto = newPhotos[index].isMainPhoto;
    
    URL.revokeObjectURL(newPhotos[index].preview);
    
    newPhotos.splice(index, 1);
    
 
    if (isRemovingMainPhoto && newPhotos.length > 0) {
      newPhotos[0].isMainPhoto = true;
    }
    
    return newPhotos;
  });
};

  const setMainPhoto = (index: number) => {
  setPhotos(prevPhotos => 
    prevPhotos.map((photo, i) => ({
      ...photo,
      isMainPhoto: i === index
    }))
  );
  };
  
  const uploadToS3 = async (file: File): Promise<string> => {
    try {
      const presignedUrlResponse = await axios.get('https://api.benchracershq.com/api/garage/s3/presigned-url', {
        params: { 
          fileName: file.name,
          fileType: file.type
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const { url, key } = presignedUrlResponse.data;
      
      await axios.put(url, file, {
        headers: {
          'Content-Type': file.type
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        }
      });
      
      return key;
      
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw new Error("Failed to upload image");
    }
  };

  // Validation functions
  const validateBasicInfo = (): string | null => {
    if (!carDetails.make.trim()) return "Make is required to identify your car";
    if (!carDetails.model.trim()) return "Model is required to complete basic information";
    if (!carDetails.category) return "Category helps others find cars like yours - please select one";
    if (!carDetails.color.trim()) return "Color is required to showcase your car properly";
    return null;
  };

  const validatePhotos = (): string | null => {
    if (photos.length === 0) {
      return "At least one photo is required to showcase your car";
    }
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!carDetails.make) newErrors.make = "Car make is required";
    if (!carDetails.model) newErrors.model = "Car model is required";
    if (!carDetails.category) newErrors.category = "Category is required";
    if (!carDetails.color) newErrors.color = "Color is required";
    if (photos.length === 0) newErrors.photos = "At least one photo is required";

    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Tab change handler with validation
  const handleTabChange = (newTab: string) => {
    // Validate current tab before allowing navigation
    if (activeTab === "basic") {
      const error = validateBasicInfo();
      if (error) {
        showErrorMessage(error);
        return;
      }
    } else if (activeTab === "photos") {
      const error = validatePhotos();
      if (error && newTab !== "basic") { // Allow going back to basic
        showErrorMessage(error);
        return;
      }
    }
    
    setActiveTab(newTab);
  };

  const handleNextFromBasic = () => {
    const error = validateBasicInfo();
    if (error) {
      showErrorMessage(error);
      return;
    }
    setActiveTab("photos");
  };

  const handleNextFromPhotos = () => {
    const error = validatePhotos();
    if (error) {
      showErrorMessage(error);
      return;
    }
    setActiveTab("mods");
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showErrorMessage("Please complete all required fields before submitting");
      return;
    }

    setIsSubmitting(true);
    
    try {
    const uploadedPhotos: { s3Key: string; isMainPhoto: boolean }[] = [];
    
    for (const photo of photos) {
      setUploadProgress(0);
      const key = await uploadToS3(photo.file);
      uploadedPhotos.push({
        s3Key: key,
        isMainPhoto: photo.isMainPhoto
      });
    }
      
     
        const entryData = {
            userEmail: user?.userEmail || "",
            carName: `${carDetails.year} ${carDetails.make} ${carDetails.model} ${carDetails.trim}`.trim(),
            carMake: carDetails.make,
            carModel: carDetails.model,
            carYear: carDetails.year,
            carColor: carDetails.color, 
            carTrim: carDetails.trim,
            description,
            totalMods: Mods.length,
            totalCost,
            category: carDetails.category,
            region: user?.region || "",
            engine: carDetails.engine,
            basecost: carDetails.basecost || undefined, 
            transmission: carDetails.transmission,
            drivetrain: carDetails.drivetrain,
            horsepower: parseInt(carDetails.horsepower) || undefined,
            torque: parseInt(carDetails.torque) || undefined,
            
            photos: uploadedPhotos,
            tags: selectedTags,
            mods: Mods,
        
        };
      
      await addCar(entryData);
      
      resetForm();
      onOpenChange(false);
      
    } catch (error) {
      console.error("Error submitting car:", error);
      showErrorMessage("Failed to submit car. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const resetForm = () => {
    setSelectedTags([]);
    photoPreview.forEach(url => URL.revokeObjectURL(url));
    setPhotoPreview([]);
    setDescription("");
    setMods([]);
    setTotalCost(0);
    setErrors({});
    setShowError(false);
    setErrorMessage("");
    setCarDetails({
      make: "",
      model: "",
      color:"",
      basecost: "",
      year: "",
      trim: "",
      engine: "",
      transmission: "",
      category: "",
      horsepower: "",
      torque: "",
      drivetrain: "",
    });
    setActiveTab("basic");
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        // Reset error states when closing
        setShowError(false);
        setErrorMessage("");
        setErrors({});
        resetForm();
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Add New Car</DialogTitle>
          <DialogDescription>Enter your car details and modifications to showcase your build</DialogDescription>
        </DialogHeader>

        {/* Error Message */}
        {showError && (
          <div className={`bg-red-900/30 border border-red-700 rounded-lg p-3 flex items-start gap-3 transition-all duration-300 ${showError ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'}`}>
            <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 text-sm font-medium">Please complete this step</p>
              <p className="text-red-300 text-sm">{errorMessage}</p>
            </div>
            <button
              onClick={() => setShowError(false)}
              className="text-red-400 hover:text-red-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          multiple
          className="hidden"
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="basic" className="relative">
              Basic Info
              {!carDetails.make || !carDetails.model || !carDetails.category || !carDetails.color ? (
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></div>
              ) : (
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></div>
              )}
            </TabsTrigger>
            <TabsTrigger value="photos" className="relative">
              Photos
              {photos.length === 0 ? (
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></div>
              ) : (
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></div>
              )}
            </TabsTrigger>
            <TabsTrigger value="mods" className="relative">
              Modifications
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></div>
            </TabsTrigger>
            <TabsTrigger value="details" className="relative">
              Details
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-6 py-4">
            <div className="bg-blue-950/30 border border-blue-700 rounded-lg p-3 flex items-start gap-3 mb-4">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-blue-400 text-sm font-medium">Required Information</p>
                <p className="text-blue-300 text-xs">Make, Model, Category, and Color are required to proceed. Other fields help showcase your car better.</p>
              </div>
            </div>

            <div className="space-y-4">
                <VinLookup
                onDataFound={(vinData) => {
                    setCarDetails(prev => ({
                    ...prev,
                    make: vinData.make || prev.make,
                    model: vinData.model || prev.model,
                    year: vinData.year || prev.year,
                    trim: vinData.trim || prev.trim,
                    engine: vinData.engine || prev.engine,
                    color: vinData.color || prev.color, // Will be empty, user inputs manually
                    transmission: vinData.transmission || prev.transmission,
                    drivetrain: vinData.drivetrain || prev.drivetrain
                    // category remains unchanged - user must select manually
                    }));
                }}
                onSuccess={() => {
                    // Don't auto-advance since user still needs to select category and enter color
                    // setActiveTab("photos"); // Remove this line
                }}
                disabled={isSubmitting}
                />

                {/* Car Details Form - Fields will be populated by VIN lookup */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="make" className="text-white flex items-center gap-1">
                      Make <span className="text-red-400">*</span>
                    </Label>
                    <Input
                    id="make"
                    placeholder="e.g. Toyota"
                    value={carDetails.make}
                    onChange={(e) => setCarDetails({ ...carDetails, make: e.target.value })}
                    className={!carDetails.make.trim() ? "border-red-500" : "border-green-500"}
                    />
                    {errors.make && <p className="text-xs text-red-500">{errors.make}</p>}
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="model" className="text-white flex items-center gap-1">
                      Model <span className="text-red-400">*</span>
                    </Label>
                    <Input
                    id="model"
                    placeholder="e.g. Supra"
                    value={carDetails.model}
                    onChange={(e) => setCarDetails({ ...carDetails, model: e.target.value })}
                    className={!carDetails.model.trim() ? "border-red-500" : "border-green-500"}
                    />
                    {errors.model && <p className="text-xs text-red-500">{errors.model}</p>}
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="Category" className="text-white flex items-center gap-1">
                      Category <span className="text-red-400">*</span>
                    </Label>
                    <Select
                    value={carDetails.category}
                    onValueChange={(value) => setCarDetails({ ...carDetails, category: value })}
                    >
                    <SelectTrigger 
                      id="category" 
                      className={!carDetails.category ? "border-red-500" : "border-green-500"}
                    >
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Track">Track</SelectItem>
                        <SelectItem value="Drag">Drag</SelectItem>
                        <SelectItem value="Drift">Drift</SelectItem>
                        <SelectItem value="Street">Street</SelectItem>
                        <SelectItem value="Sleeper">Sleeper</SelectItem>
                        <SelectItem value="Off-Road">Trail</SelectItem>
                        <SelectItem value="Off-Road">Overland</SelectItem>
                        <SelectItem value="Off-Road">Crawler</SelectItem>
                        <SelectItem value="Off-Road">Desert</SelectItem>
                        <SelectItem value="Vintage">Vintage</SelectItem>
                        <SelectItem value="Restomod">Restomod</SelectItem>
                        <SelectItem value="Hotrod">Hotrod</SelectItem>
                        <SelectItem value="Lowrider">Lowrider</SelectItem>
                    </SelectContent>
                    </Select>
                    {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="year" className="text-white">Year</Label>
                    <Input
                    id="year"
                    placeholder="e.g. 2020"
                    value={carDetails.year}
                    onChange={(e) => setCarDetails({ ...carDetails, year: e.target.value })}
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="trim" className="text-white">Trim</Label>
                    <Input
                    id="trim"
                    placeholder="e.g. GR"
                    value={carDetails.trim}
                    onChange={(e) => setCarDetails({ ...carDetails, trim: e.target.value })}
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="color" className="text-white flex items-center gap-1">
                      Color <span className="text-red-400">*</span>
                    </Label>
                    <Input
                    id="color"
                    placeholder="e.g. Midnight Black"
                    value={carDetails.color}
                    onChange={(e) => setCarDetails({ ...carDetails, color: e.target.value })}
                    className={!carDetails.color.trim() ? "border-red-500" : "border-green-500"}
                    />
                    {errors.color && <p className="text-xs text-red-500">{errors.color}</p>}
                    <p className="text-xs text-gray-500">VIN doesn't contain color - please enter manually</p>
                </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="engine" className="text-white">Engine</Label>
                        <Input
                            id="engine"
                            placeholder="e.g. 3.0L Inline-6 Turbo"
                            value={carDetails.engine}
                            onChange={(e) => setCarDetails({ ...carDetails, engine: e.target.value })}
                        />
                    </div>
                    
                    {/*<div className="space-y-2">
                    <Label htmlFor="basecost" className="text-white">Base Cost</Label>
                        <Input
                            id="basecost"
                            placeholder="50,000"
                            value={carDetails.basecost}
                            type="number"
                            onChange={(e) => setCarDetails({ ...carDetails, basecost: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="horsepower" className="text-white">Horsepower</Label>
                            <Input
                                id="horsepower"
                                type="number"
                                placeholder="e.g. 400"
                                value={carDetails.horsepower}
                                onChange={(e) => setCarDetails({ ...carDetails, horsepower: e.target.value })}
                        />
                        </div>
                    <div className="space-y-2">
                        <Label htmlFor="torque" className="text-white">Torque</Label>
                        <Input
                            id="Torque"
                            type="number"
                            placeholder="e.g. 350"
                            value={carDetails.torque}
                            onChange={(e) => setCarDetails({ ...carDetails, torque: e.target.value })}
                        />
                     </div>*/}
                    

                
                <div className="space-y-2">
                            <Label htmlFor="transmission" className="text-white">Transmission</Label>
                            <Select
                                value={carDetails.transmission}
                                onValueChange={(value) => setCarDetails({ ...carDetails, transmission: value })}
                            >
                                <SelectTrigger id="transmission">
                                <SelectValue placeholder="Select transmission" />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="Manual">Manual</SelectItem>
                                <SelectItem value="Automatic">Automatic</SelectItem>
                                <SelectItem value="DCT">Dual-Clutch (DCT)</SelectItem>
                                <SelectItem value="CVT">CVT</SelectItem>
                                </SelectContent>
                            </Select>
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="drivetrain" className="text-white">Drivetrain</Label>
                            <Select
                                value={carDetails.drivetrain}
                                onValueChange={(value) => setCarDetails({ ...carDetails, drivetrain: value })}
                            >
                                <SelectTrigger id="drivetrain">
                                <SelectValue placeholder="Select drivetrain" />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="FWD">Front-Wheel Drive (FWD)</SelectItem>
                                <SelectItem value="RWD">Rear-Wheel Drive (RWD)</SelectItem>
                                <SelectItem value="AWD">All-Wheel Drive (AWD)</SelectItem>
                                <SelectItem value="4WD">Four-Wheel Drive (4WD)</SelectItem>
                                </SelectContent>
                            </Select>
                            </div>
                        </div>
                    </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleNextFromBasic}>
                Next: Photos
              </Button>
           </DialogFooter>
            </TabsContent>


          <TabsContent value="photos" className="space-y-6 py-4">
            <div className="bg-blue-950/30 border border-blue-700 rounded-lg p-3 flex items-start gap-3 mb-4">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-blue-400 text-sm font-medium">Photo Requirements</p>
                <p className="text-blue-300 text-xs">At least one photo is required. Upload up to 6 high-quality images to showcase your car.</p>
              </div>
            </div>

            <div>
              <Label className="block mb-4 text-white flex items-center gap-1">
                Car Photos <span className="text-red-400">*</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-gray-800">
                    <img
                    src={photo.preview}
                    alt={`Car photo ${index + 1}`}
                    className="object-cover w-full h-full"
                    />
                    <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80"
                    >
                    <X className="h-4 w-4 text-red-500 hover:text-red-400" />
                    </button>
                    
                    {photo.isMainPhoto && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Main Photo
                    </div>
                    )}
                    {!photo.isMainPhoto && (
                    <button
                        onClick={() => setMainPhoto(index)}
                        className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
                    >
                        Set as Main
                    </button>
                    )}
                </div>
                ))}

                {photos.length < 6 && (
                    <button
                    onClick={triggerFileInput}
                    className={`aspect-square rounded-md border-2 border-dashed ${
                        errors.photos ? "border-red-500" : "border-gray-700"
                    } flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-gray-800/50 transition-colors`}
                    >
                    <Camera className="h-6 w-6 text-gray-400" />
                    <span className="text-sm text-gray-400">Add Photo</span>
                    </button>
                )}
                </div>
             {errors.photos && <p className="text-xs text-red-500 mt-1">{errors.photos}</p>}
             <p className="text-xs text-gray-500">
               Upload up to 6 high-quality photos of your car. First photo will be the main image.
             </p>
           </div>

           <DialogFooter>
             <Button variant="outline" onClick={() => setActiveTab("basic")}>
               Back
             </Button>
             <Button onClick={handleNextFromPhotos}>
               Next: Modifications
             </Button>
           </DialogFooter>
         </TabsContent>

         <TabsContent value="mods" className="space-y-6 py-4">
            <ModsTabContent 
                availableMods={availableMods}
                selectedMods={Mods}
                onAddMod={addMod}
                onRemoveMod={removeMod}
                isLoadingMods={isLoadingMods}
                setActiveTab={setActiveTab}
                baseCost={parseFloat(carDetails.basecost) || 0}
            />
        </TabsContent>

         <TabsContent value="details" className="space-y-6 py-4">
            <div className="bg-blue-950/30 border border-blue-700 rounded-lg p-3 flex items-start gap-3 mb-4">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-blue-400 text-sm font-medium">Final Details</p>
                <p className="text-blue-300 text-xs">Add tags and a description to help others discover and learn about your build.</p>
              </div>
            </div>

           <div>
             <Label htmlFor="tags" className="block mb-2 text-white">
               Tags
             </Label>
             <div className="flex flex-wrap gap-2 mb-4">
               {selectedTags.map((tag) => (
                 <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                   {tag}
                   <button onClick={() => removeTag(tag)}>
                     <X className="h-3 w-3" />
                   </button>
                 </Badge>
               ))}
               {selectedTags.length === 0 && <p className="text-sm text-gray-500">No tags selected yet</p>}
             </div>
             <div className="flex gap-2 flex-wrap">
               {[
                 "JDM",
                 "European",
                 "American",
                 "Muscle",
                 "Tuner",
                 "Track",
                 "Show",
                 "Drift",
                 "Stanced",
                 "Classic",
                 "Modified",
                 "Turbo",
                 "Supercharged",
                 "NA",
                 "AWD",
                 "RWD",
               ].map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return !isSelected ? (
                     <Button
                       key={tag}
                       variant="outline"
                       size="sm"
                       onClick={() => addTag(tag)}
                       className="flex items-center gap-1"
                     >
                       <Plus className="h-3 w-3" />
                       {tag}
                     </Button>
                   ) : null;
                })}
             </div>
           </div>

           <div className="space-y-2">
             <Label htmlFor="description" className="text-white">Description</Label>
             <Textarea
               id="description"
               placeholder="Tell us about your build journey, inspiration, and future plans..."
               className="min-h-[150px]"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
             />
           </div>

           {errors.submit && (
             <Alert className="bg-red-900/20 border-red-900 text-red-400">
               <AlertDescription>{errors.submit}</AlertDescription>
             </Alert>
           )}

           <DialogFooter>
             <Button variant="outline" onClick={() => setActiveTab("mods")}>
               Back
             </Button>
             <Button 
               onClick={handleSubmit}
               disabled={isSubmitting}
               className="gap-2"
             >
               {isSubmitting ? (
                 <>
                   <Loader2 className="h-4 w-4 animate-spin" />
                   {uploadProgress > 0 && uploadProgress < 100 
                     ? `Uploading... ${uploadProgress}%` 
                     : 'Submitting...'}
                 </>
               ) : (
                 <>
                   <Upload className="h-4 w-4" />
                   Add Build
                 </>
               )}
             </Button>
           </DialogFooter>
         </TabsContent>
       </Tabs>
     </DialogContent>
   </Dialog>
 )
}