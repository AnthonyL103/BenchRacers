"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "../ui/button"
import { ModsTabContent } from "./modsTabcontent";

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
import { Camera, Loader2, Plus, Search, X, Upload, ChevronsUpDown, Check } from "lucide-react"
import { Alert, AlertDescription } from "../ui/alert"
import { useGarage } from "../contexts/garagecontext"
import { useUser } from "../contexts/usercontext"
import axios from "axios"
import { getS3ImageUrl } from "../utils/s3helper"

import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "../ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

interface Mod {
  id: number;
  brand: string;
  cost: number;
  description: string;
  category: string;
  link: string;
}

interface CarCreate {
  entryID?: number; 
  userEmail: string;
  carName: string;
  carMake: string;
  carModel: string;
  carYear?: string;
  carColor?: string;
  carTrim?: string;
  description?: string;
  totalMods: number;
  totalCost: number;
  category: string;
  region: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  horsepower?: number;
  torque?: number;
  photos: { s3Key: string; isMainPhoto: boolean }[];
  tags: string[];
  mods: number[];
}

interface EditCarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: any; 
}

export function EditCarModal({ open, onOpenChange, car }: EditCarModalProps) {
  const { user } = useUser();
  const { updateCar } = useGarage();

  const [activeTab, setActiveTab] = useState("basic")
  const [activeModTab, setActiveModTab] = useState("exterior")


  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreview, setPhotoPreview] = useState<string[]>([])
  const [description, setDescription] = useState("")
  
  
  const [existingPhotos, setExistingPhotos] = useState<any[]>([])
  
  const [mods, setMods] = useState<Mod[]>([])
  
  const [availableMods, setAvailableMods] = useState<Mod[]>([])
  
  const [isLoadingMods, setIsLoadingMods] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [modsSearchState, setModsSearchState] = useState({
    exterior: "",
    interior: "",
    drivetrain: "",
    wheels: "", 
    suspension: "",
    brakes: ""
  })  

  const [openModsState, setOpenModsState] = useState({
    exterior: false,
    interior: false,
    drivetrain: false,
    wheels: false,
    suspension: false,
    brakes: false
  })

  const [carDetails, setCarDetails] = useState({
    entryID: car.entryID || "", 
    make: "",
    model: "",
    year: "",
    color: "",
    trim: "",
    engine: "",
    transmission: "",
    category: "",
    horsepower: "",
    torque: "",
    drivetrain: "",
  })
  
  const [totalCost, setTotalCost] = useState(0)

  useEffect(() => {
    if (car && open) {
      const tags = Array.isArray(car.tags) 
        ? car.tags.map((tag: any) => typeof tag === 'string' ? tag : tag.tagName) 
        : [];
      
      setSelectedTags(tags);
      
      if (car.photos && Array.isArray(car.photos)) {
        setExistingPhotos(car.photos);
        const keys = car.photos.map((p: any) => p.s3Key);
        setPhotoPreview(keys);
      } else if (car.allPhotoKeys && Array.isArray(car.allPhotoKeys)) {
        setPhotoPreview(car.allPhotoKeys);
        const photoObjects = car.allPhotoKeys.map((key: string, index: number) => ({
          s3Key: key,
          isMainPhoto: index === 0 
        }));
        setExistingPhotos(photoObjects);
      }
      
      setDescription(car.description || "");
      
      setCarDetails({
        entryID: car.entryID || "",
        make: car.carMake || "",
        model: car.carModel || "",
        year: car.carYear || "",
        color: car.carColor || "",
        trim: car.carTrim || "",
        engine: car.engine || "",
        transmission: car.transmission || "",
        category: car.category || "",
        horsepower: car.horsepower || "",
        torque: car.torque || "",
        drivetrain: car.drivetrain || "",
      });
      
      if (car.mods && Array.isArray(car.mods)) {
        const formattedMods = car.mods.map((mod: any) => ({
            id: mod.modID || mod.id, 
            brand: mod.brand,
            cost: mod.cost,
            description: mod.description,
            category: mod.category,
            link: mod.link
        }));
  
        setMods(formattedMods);
}
    }
  }, [car, open]);

  useEffect(() => {
    fetchAvailableMods();
  }, []);
  
  useEffect(() => {
    const total = mods.reduce((sum, mod) => sum + mod.cost, 0);
    setTotalCost(total);
  }, [mods]);

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

  const updateSearchTerm = (category: string, value: string) => {
    setModsSearchState(prev => ({
      ...prev,
      [category]: value
    }));
  };
  
  const updateOpenState = (category: string, isOpen: boolean) => {
    setOpenModsState(prev => ({
      ...prev,
      [category]: isOpen
    }));
  };

  const addTag = (tag: string) => {
  if (!selectedTags.includes(tag)) {
    setSelectedTags([...selectedTags, tag]);
  } else {
    
    console.log(`Tag "${tag}" is already added`);
  }
};

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };
  
  const getFilteredModsByCategory = (category: string) => {
    const modsByCategory = availableMods.filter(mod => 
      mod.category.toLowerCase() === category.toLowerCase()
    );
    
    if (!modsSearchState[category as keyof typeof modsSearchState].trim()) {
      return modsByCategory;
    }
    
    const searchLower = modsSearchState[category as keyof typeof modsSearchState].toLowerCase();
    return modsByCategory.filter(mod => 
      mod.brand.toLowerCase().includes(searchLower) ||
      mod.description.toLowerCase().includes(searchLower)
    ); 
  };

  
 const addMod = (mod: Mod) => {
  if (!mods.some(m => m.id === mod.id)) {
    setMods([...mods, mod]);
  } else {
    alert(`${mod.brand} is already added to your build`);
  }
  
  updateOpenState(mod.category.toLowerCase(), false);
};
  
  const removeMod = (id: number) => {
    setMods(mods.filter(mod => mod.id !== id));
  };
  
  const renderModSelectionForCategory = (category: string) => {
    const filteredMods = getFilteredModsByCategory(category);
    const isOpen = openModsState[category as keyof typeof openModsState];
    const searchTerm = modsSearchState[category as keyof typeof modsSearchState];
    
    return (
      <div className="space-y-4">
        <Popover 
          open={isOpen} 
          onOpenChange={(open) => updateOpenState(category, open)}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className="w-full justify-between"
            >
              Add {category.charAt(0).toUpperCase() + category.slice(1)} Modification
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput 
                value={searchTerm} 
                onValueChange={(value) => updateSearchTerm(category, value)} 
                placeholder={`Search ${category} mods...`} 
              />
              <CommandList>
                <CommandEmpty>No {category} mods found matching "{searchTerm}"</CommandEmpty>
                {isLoadingMods ? (
                  <div className="py-6 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">Loading modifications...</p>
                  </div>
                ) : (
                  <CommandGroup>
                    {filteredMods.length === 0 ? (
                      <div className="px-2 py-4 text-center text-sm text-gray-500">
                        No {category} modifications available
                      </div>
                    ) : (
                      filteredMods.map((mod) => (
                            <CommandItem
                            key={mod.id}
                            value={mod.id.toString()}
                            onSelect={() => addMod(mod)}
                            className={`py-2 ${mods.some(m => m.id === mod.id) ? 'opacity-50' : ''}`}
                            disabled={mods.some(m => m.id === mod.id)}
                            >
                            <div className="flex-1">
                                <p className="font-medium">{mod.brand}</p>
                                <p className="text-sm text-gray-400">{mod.description}</p>
                                <p className="text-sm text-green-500">${mod.cost.toLocaleString()}</p>
                            </div>
                            <Check
                                className={`h-4 w-4 ${
                                mods.some(m => m.id === mod.id) ? "opacity-100" : "opacity-0"
                                }`}
                            />
                            </CommandItem>
                      ))
                    )}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
  
    const remainingSlots = 6 - (photoFiles.length + existingPhotos.length);
    
    if (remainingSlots <= 0) {
      alert("You can upload a maximum of 6 images");
      return;
    }
  
    const newFiles = Array.from(files).slice(0, remainingSlots);
  
    setPhotoFiles(prevFiles => [...prevFiles, ...newFiles]);
  
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPhotoPreview(prevPreviews => [...prevPreviews, ...newPreviews]);
    
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    if (index < existingPhotos.length) {
      const newExistingPhotos = [...existingPhotos];
      newExistingPhotos.splice(index, 1);
      setExistingPhotos(newExistingPhotos);
      
      const newPreviews = [...photoPreview];
      newPreviews.splice(index, 1);
      setPhotoPreview(newPreviews);
    } else {
      const fileIndex = index - existingPhotos.length;
      
      const newFiles = [...photoFiles];
      newFiles.splice(fileIndex, 1);
      setPhotoFiles(newFiles);
      
      const newPreviews = [...photoPreview];
      newPreviews.splice(index, 1);
      URL.revokeObjectURL(photoPreview[index]);
      setPhotoPreview(newPreviews);
    }
  };

  const setMainPhoto = (index: number) => {
    if (index < existingPhotos.length) {
      const newExistingPhotos = existingPhotos.map((photo, i) => ({
        ...photo,
        isMainPhoto: i === index
      }));
      setExistingPhotos(newExistingPhotos);
    } else {
      
      alert("New photos will be set as main when you save changes.");
    }
  };

  const uploadToS3 = async (file: File): Promise<string> => {
    try {      const presignedUrlResponse = await axios.get('https://api.benchracershq.com/api/garage/s3/presigned-url', {
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!carDetails.make) newErrors.make = "Car make is required";
    if (!carDetails.model) newErrors.model = "Car model is required";
    if (!carDetails.category) newErrors.category = "Category is required";
    if (existingPhotos.length === 0 && photoFiles.length === 0) {
      newErrors.photos = "At least one photo is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const uploadedPhotos: { s3Key: string; isMainPhoto: boolean }[] = [];
      
      for (let i = 0; i < photoFiles.length; i++) {
        setUploadProgress(0);
        const key = await uploadToS3(photoFiles[i]);
        uploadedPhotos.push({
          s3Key: key,
          isMainPhoto: false 
        });
      }
      
      let allPhotos = [
        ...existingPhotos,
        ...uploadedPhotos
      ];
      
      if (allPhotos.length > 0 && !allPhotos.some(p => p.isMainPhoto)) {
        allPhotos[0].isMainPhoto = true;
      }
      
      const entryData: CarCreate = {
        entryID: carDetails.entryID || undefined,
        userEmail: user?.userEmail || "",
        carName: `${carDetails.year} ${carDetails.make} ${carDetails.model} ${carDetails.trim}`.trim(),
        carMake: carDetails.make,
        carModel: carDetails.model,
        carYear: carDetails.year || undefined,
        carColor: carDetails.color || undefined,
        carTrim: carDetails.trim || undefined,
        description: description || undefined,
        totalMods: mods.length,
        totalCost,
        category: carDetails.category,
        region: user?.region || "",
        engine: carDetails.engine || undefined,
        transmission: carDetails.transmission || undefined,
        drivetrain: carDetails.drivetrain || undefined,
        horsepower: carDetails.horsepower ? parseInt(carDetails.horsepower) : undefined,
        torque: carDetails.torque ? parseInt(carDetails.torque) : undefined,
        
        photos: allPhotos,
        tags: selectedTags,
        mods: mods.map(mod => mod.id),
      };
      
      await updateCar(entryData.entryID ?? 0, entryData);
      
      onOpenChange(false);
      
    } catch (error) {
      console.error("Error updating car:", error);
      setErrors({
        submit: "Failed to update car. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Edit Car</DialogTitle>
          <DialogDescription>Update your car details and modifications</DialogDescription>
        </DialogHeader>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          multiple
          className="hidden"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="photos">
              Photos
            </TabsTrigger>
            <TabsTrigger value="mods">
              Modifications
            </TabsTrigger>
            <TabsTrigger value="details">
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make" className="text-white">Make</Label>
                  <Input
                    id="make"
                    placeholder="e.g. Toyota"
                    value={carDetails.make}
                    onChange={(e) => setCarDetails({ ...carDetails, make: e.target.value })}
                    className={errors.make ? "border-red-500" : ""}
                  />
                  {errors.make && <p className="text-xs text-red-500">{errors.make}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-white">Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g. Supra"
                    value={carDetails.model}
                    onChange={(e) => setCarDetails({ ...carDetails, model: e.target.value })}
                    className={errors.model ? "border-red-500" : ""}
                  />
                  {errors.model && <p className="text-xs text-red-500">{errors.model}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="Category" className="text-white">Category</Label>
                  <Select
                    value={carDetails.category}
                    onValueChange={(value) => setCarDetails({ ...carDetails, category: value })}
                  >
                    <SelectTrigger id="category" className={errors.category ? "border-red-500" : ""}>
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
                  <Label htmlFor="color" className="text-white">Color</Label>
                  <Input
                    id="color"
                    placeholder="Red"
                    value={carDetails.color}
                    onChange={(e) => setCarDetails({ ...carDetails, color: e.target.value })}
                  />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>
                    </div>
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
              <Button onClick={() => setActiveTab("photos")}>
                Next: Photos
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="photos" className="space-y-6 py-4">
            <div>
                <Label className="block mb-4 text-white">Car Photos</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {photoPreview.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-gray-800">
                    <img
                        src={index < existingPhotos.length 
                        ? getS3ImageUrl(existingPhotos[index].s3Key)
                        : photo // This is already a blob URL for new files
                        }
                        alt={`${car.carName} - Photo ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80"
                    >
                        <X className="h-4 w-4 text-red-500 hover:text-red-400" />
                    </button>
                    
                    {index < existingPhotos.length && existingPhotos[index].isMainPhoto && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Main Photo
                        </div>
                    )}
                    
                    {index < existingPhotos.length && !existingPhotos[index].isMainPhoto && (
                        <button
                        onClick={() => setMainPhoto(index)}
                        className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
                        >
                        Set as Main
                        </button>
                    )}
                    </div>
                ))}

                {photoPreview.length < 6 && (
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
                Upload up to 6 high-quality photos of your car. You can set which photo is the main image.
                </p>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => setActiveTab("basic")}>
                Back
                </Button>
                <Button onClick={() => setActiveTab("mods")}>
                Next: Modifications
                </Button>
            </DialogFooter>
            </TabsContent>
            
        <TabsContent value="mods" className="space-y-6 py-4">
                    <ModsTabContent 
                        availableMods={availableMods}
                        selectedMods={mods}
                        onAddMod={addMod}
                        onRemoveMod={removeMod}
                        isLoadingMods={isLoadingMods}
                        setActiveTab={setActiveTab}
                    />
        </TabsContent>
        

          <TabsContent value="details" className="space-y-6 py-4">
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
                      : 'Updating...'}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Update Build
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}