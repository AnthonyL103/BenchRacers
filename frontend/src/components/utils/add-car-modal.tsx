"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "../ui/button"
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
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "../ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { set } from "date-fns"
import { color } from "framer-motion"

// Types for mods
interface Mod {
  id: number;
  brand: string;
  cost: number;
  description: string;
  category: string;
  link: string;
}

interface PhotoItem {
  file: File;
  preview: string;
  isMainPhoto: boolean;
}



interface AddCarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCarModal({ open, onOpenChange }: AddCarModalProps) {
  const { user } = useUser();
  const { addCar } = useGarage();

  const [activeTab, setActiveTab] = useState("basic")
  const [activeModTab, setActiveModTab] = useState("exterior")

  const [vin, setVin] = useState("")
  const [isLookingUpVin, setIsLookingUpVin] = useState(false)
  const [vinLookupSuccess, setVinLookupSuccess] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreview, setPhotoPreview] = useState<string[]>([])
  const [description, setDescription] = useState("")
  
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  
  // Preset mods state
  const [Mods, setMods] = useState<Mod[]>([])

  
  // Available mods from the database
  const [availableMods, setAvailableMods] = useState<Mod[]>([])

  
  // Search states
  const [ModSearch, setModSearch] = useState("")

  
  // Dropdown states
  const [openMods, setOpenMods] = useState(false)

  
  // Loading states
  const [isLoadingMods, setIsLoadingMods] = useState(false)
    
  
  const [totalCost, setTotalCost] = useState(0)
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Ref for file input
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
    make: "",
    model: "",
    color: "",
    year: "",
    trim: "",
    engine: "",
    transmission: "",
    category:"",
    drivetrain: "",
  })

  // Fetch available mods when the component mounts
  useEffect(() => {
    fetchAvailableMods();
  }, []);
  
  // Calculate total cost when mods change
  useEffect(() => {
    const total = [
      ...Mods
    ].reduce((sum, mod) => sum + mod.cost, 0);
    
    setTotalCost(total);
  }, [Mods]);

    const fetchAvailableMods = async () => {
    try {
        const token = localStorage.getItem('token');
        
        // Fetch mods
        setIsLoadingMods(true);
        const modsResponse = await axios.get('https://api.benchracershq.com/api/garage/mods', {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }   
        });
        
        // Handle the data based on structure (whether it's flat or grouped)
        if (Array.isArray(modsResponse.data.mods)) {
        // If backend returns flat array (with the fix above)
        setAvailableMods(modsResponse.data.mods);
        } else {
        // If backend still returns grouped object format
        // Convert grouped object to flat array
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

    // 3. Add GroupBy functionality if still needed for display purposes
    // This allows you to maintain a flat array for selection but group for UI
    

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }
  
  const updateSearchTerm = (category: string, value: string) => {
    setModsSearchState(prev => ({
        ...prev,
        [category]: value
    }));
  };
  
  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

// Helper function to update a single category's dropdown state
  const updateOpenState = (category: string, isOpen: boolean) => {
    setOpenModsState(prev => ({
        ...prev,
        [category]: isOpen
    }));
  };
  
  const getFilteredModsByCategory = (category: string) => {
    // First filter by category
    const modsByCategory = availableMods.filter(mod => 
        mod.category.toLowerCase() === category.toLowerCase()
    );
    
    // If no search term, return all mods for this category
    if (!modsSearchState[category as keyof typeof modsSearchState].trim()) {
        return modsByCategory;
    }
    
    // Further filter by search term
    const searchLower = modsSearchState[category as keyof typeof modsSearchState].toLowerCase();
    return modsByCategory.filter(mod => 
        mod.brand.toLowerCase().includes(searchLower) ||
        mod.description.toLowerCase().includes(searchLower)
    ); 
  };

  // Add a mod to selected mods
  const addMod = (mod: Mod) => {
  if (!Mods.some(m => m.id === mod.id)) {
    setMods([...Mods, mod]);
  }
  // Close the dropdown for the current category
  updateOpenState(mod.category.toLowerCase(), false);
};
  
  // Remove a mod from selected mods
  const removeMod = (id: number) => {
    setMods(Mods.filter(mod => mod.id !== id));
  };
  
  // Create a reusable mod selection UI for each category
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
                            className="py-2"
                        >
                            <div className="flex-1">
                            <p className="font-medium">{mod.brand}</p>
                            <p className="text-sm text-gray-400">{mod.description}</p>
                            <p className="text-sm text-green-500">${mod.cost.toLocaleString()}</p>
                            </div>
                            <Check
                            className={`h-4 w-4 ${
                                Mods.some(m => m.id === mod.id) ? "opacity-100" : "opacity-0"
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
  
  
  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  // Handle file selection
const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  // Calculate how many more photos we can add
  const remainingSlots = 6 - photos.length;
  
  if (remainingSlots <= 0) {
    alert("You can upload a maximum of 6 images");
    return;
  }

  // Limit to remaining slots
  const newFiles = Array.from(files).slice(0, remainingSlots);
  
  // Add new photos to the existing ones
  setPhotos(prevPhotos => [
    ...prevPhotos,
    ...newFiles.map((file: File) => ({
      file,
      preview: URL.createObjectURL(file),
      isMainPhoto: prevPhotos.length === 0 // First photo is main if there are no existing photos
    }))
  ]);
  
  // Reset the file input
  e.target.value = '';
};

const removePhoto = (index: number) => {
  setPhotos(prevPhotos => {
    // Create a copy of the photos array
    const newPhotos = [...prevPhotos];
    
    // Check if we're removing the main photo
    const isRemovingMainPhoto = newPhotos[index].isMainPhoto;
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(newPhotos[index].preview);
    
    // Remove the photo at the specified index
    newPhotos.splice(index, 1);
    
    // If we removed the main photo and there are other photos remaining,
    // set the first one as the new main photo
    if (isRemovingMainPhoto && newPhotos.length > 0) {
      newPhotos[0].isMainPhoto = true;
    }
    
    return newPhotos;
  });
};

  const lookupVin = () => {
    if (!vin || vin.length !== 17) {
      return
    }

    setIsLookingUpVin(true)

    // Simulate API call to lookup VIN
    setTimeout(() => {
      // Mock data - in a real app, this would come from a VIN decoder API
      setCarDetails({
        make: "Toyota",
        model: "Supra",
        color: "Red",
        year: "2020",
        trim: "GR",
        engine: "3.0L Inline-6 Turbo",
        category:"Sport",
        transmission: "8-Speed Automatic",
        drivetrain: "RWD",
      })
      setVinLookupSuccess(true)
      setIsLookingUpVin(false)
      setActiveTab("photos")
    }, 1500)
  }
  
  const setMainPhoto = (index: number) => {
  setPhotos(prevPhotos => 
    prevPhotos.map((photo, i) => ({
      ...photo,
      isMainPhoto: i === index
    }))
  );
  };
  // Upload image to S3
  const uploadToS3 = async (file: File): Promise<string> => {
    try {
      // First request a presigned URL from your backend
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
      
      // Upload directly to S3 using the presigned URL
      await axios.put(url, file, {
        headers: {
          'Content-Type': file.type
        },
        onUploadProgress: (progressEvent) => {
          // Update progress for this specific file
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        }
      });
      
      // Return the S3 object key to be stored in your database
      return key;
      
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw new Error("Failed to upload image");
    }
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!carDetails.make) newErrors.make = "Car make is required";
    if (!carDetails.model) newErrors.model = "Car model is required";
    if (!carDetails.category) newErrors.category = "Category is required";
    if (photos.length === 0) newErrors.photos = "At least one photo is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Show errors and don't proceed
      return;
    }

    setIsSubmitting(true);
    
    try {
    // Upload all images to S3
    const uploadedPhotos: { s3Key: string; isMainPhoto: boolean }[] = [];
    
    for (const photo of photos) {
      setUploadProgress(0);
      const key = await uploadToS3(photo.file);
      uploadedPhotos.push({
        s3Key: key,
        isMainPhoto: photo.isMainPhoto
      });
    }
      
      // Prepare the car entry data
      // Replace this part in the handleSubmit function:
        const entryData = {
            userEmail: user?.userEmail || "",
            carName: `${carDetails.year} ${carDetails.make} ${carDetails.model} ${carDetails.trim}`.trim(),
            carMake: carDetails.make,
            carModel: carDetails.model,
            carYear: carDetails.year,
            carColor: carDetails.color, // You might want to add this field to your form
            carTrim: carDetails.trim,
            description,
            totalMods: Mods.length,
            totalCost,
            category: carDetails.category,
            region: user?.region || "",
            engine: carDetails.engine,
            transmission: carDetails.transmission,
            drivetrain: carDetails.drivetrain,
            // Change these lines to use undefined instead of null
            horsepower: undefined, // Changed from null to undefined
            torque: undefined,     // Changed from null to undefined
            
            // Associated data
            photos: uploadedPhotos,
            tags: selectedTags,
            mods: Mods.map(mod => mod.id),
        
        };
      
      // Send to backend via your addCar function
      await addCar(entryData);
      
      // Success - close modal and reset form
      resetForm();
      onOpenChange(false);
      
    } catch (error) {
      console.error("Error submitting car:", error);
      setErrors({
        submit: "Failed to submit car. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Reset form after submission or when closing modal
  const resetForm = () => {
    setVin("");
    setVinLookupSuccess(false);
    setSelectedTags([]);
    setPhotoFiles([]);
    // Revoke object URLs to prevent memory leaks
    photoPreview.forEach(url => URL.revokeObjectURL(url));
    setPhotoPreview([]);
    setDescription("");
    setMods([]);
    setTotalCost(0);
    setErrors({});
    setCarDetails({
      make: "",
      model: "",
      color:"",
      year: "",
      trim: "",
      engine: "",
      transmission: "",
      category: "",
      drivetrain: "",
    });
    setActiveTab("basic");
    setActiveModTab("exterior");
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm(); // Reset form when closing
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Add New Car</DialogTitle>
          <DialogDescription>Enter your car details and modifications to showcase your build</DialogDescription>
        </DialogHeader>

        {/* Hidden file input for photos */}
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
              <div>
                <Label htmlFor="vin" className="text-white">VIN (Vehicle Identification Number)</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    id="vin"
                    placeholder="e.g. JT2BK3BA3M0123456"
                    value={vin}
                    onChange={(e) => setVin(e.target.value)}
                    maxLength={17}
                  />
                  <Button
                    type="button"
                    onClick={lookupVin}
                    disabled={vin.length !== 17 || isLookingUpVin}
                    className="flex-shrink-0"
                  >
                    {isLookingUpVin ? (
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
                <p className="text-xs text-gray-500 mt-1">
                  Enter your 17-digit VIN to automatically populate car details
                </p>
              </div>

              {vinLookupSuccess && (
                <Alert className="bg-green-900/20 border-green-900 text-green-400">
                  <AlertDescription>VIN lookup successful! Car details have been populated.</AlertDescription>
                </Alert>
              )}

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
                      <SelectItem value="Exotic">Exotic Car</SelectItem>
                      <SelectItem value="Sport">Sports Car</SelectItem>
                      <SelectItem value="Off-Road">Off Road Car</SelectItem>
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
                  <Label htmlFor="engine" className="text-white">Engine</Label>
                  <Input
                    id="engine"
                    placeholder="e.g. 3.0L Inline-6 Turbo"
                    value={carDetails.engine}
                    onChange={(e) => setCarDetails({ ...carDetails, engine: e.target.value })}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="color" className="text-white">Color</Label>
                  <Input
                    id="color"
                    placeholder="Red"
                    value={carDetails.color}
                    onChange={(e) => setCarDetails({ ...carDetails, color: e.target.value })}
                    className={errors.color ? "border-red-500" : ""}
                  />
                  {errors.color && <p className="text-xs text-red-500">{errors.color}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Next: Add Photos
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="photos" className="space-y-6 py-4">
            <div>
              <Label className="block mb-4 text-white">Car Photos</Label>
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
                    <X className="h-4 w-4 bg-red-500 hover:bg-red-400" />
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
               Upload up to 6 high-quality photos of your car. First photo will be the main image.
             </p>
           </div>

           <DialogFooter>
             <Button variant="outline" onClick={() => setActiveTab("basic")}>
               Back
             </Button>
             <Button onClick={() => setActiveTab("mods")}>
               Next: Add Modifications
             </Button>
           </DialogFooter>
         </TabsContent>

         <TabsContent value="mods" className="space-y-6 py-4">
           {/* Mod Category Tabs */}
           <DialogHeader>
                    <DialogTitle className="text-xl text-white">Modifications</DialogTitle>
                    <DialogDescription>Add modifications to your car</DialogDescription>
                </DialogHeader>
            <Tabs value={activeModTab} onValueChange={setActiveModTab} className="mt-4">
            <TabsList className="grid grid-cols-6">
                <TabsTrigger value="exterior">Exterior</TabsTrigger>
                <TabsTrigger value="interior">Interior</TabsTrigger>
                <TabsTrigger value="drivetrain">Drivetrain</TabsTrigger>
                <TabsTrigger value="wheels">Wheels</TabsTrigger>
                <TabsTrigger value="suspension">Suspension</TabsTrigger>
                <TabsTrigger value="brakes">Brakes</TabsTrigger>
            </TabsList>

            {/* Exterior Mods Tab */}
            <TabsContent value="exterior" className="space-y-4 py-4">
                {renderModSelectionForCategory("exterior")}
            </TabsContent>

            {/* Interior Mods Tab */}
            <TabsContent value="interior" className="space-y-4 py-4">
                {renderModSelectionForCategory("interior")}
            </TabsContent>

            {/* Drivetrain Mods Tab */}
            <TabsContent value="drivetrain" className="space-y-4 py-4">
                {renderModSelectionForCategory("drivetrain")}
            </TabsContent>

            {/* Wheels Mods Tab */}
            <TabsContent value="wheels" className="space-y-4 py-4">
                {renderModSelectionForCategory("wheels")}
            </TabsContent>

            {/* Suspension Mods Tab */}
            <TabsContent value="suspension" className="space-y-4 py-4">
                {renderModSelectionForCategory("suspension")}
            </TabsContent>

            {/* Brakes Mods Tab */}
            <TabsContent value="brakes" className="space-y-4 py-4">
                {renderModSelectionForCategory("brakes")}
            </TabsContent>
            </Tabs>
            
            <div>
                
                
                {/* Selected mods container */}
                <div className="mt-4 mb-6">
                    <Label className="block mb-2 text-white">Selected Modifications</Label>
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-800/50 rounded-md min-h-[60px]">
                    {Mods.length > 0 ? (
                        Mods.map(mod => (
                        <Badge 
                            key={mod.id} 
                            variant="secondary" 
                            className="flex items-center gap-1 p-2 h-auto"
                        >
                            <span className="font-medium">{mod.brand}</span>
                            <span className="text-xs text-gray-400 mx-1">|</span>
                            <span className="text-xs text-gray-400">{mod.description.slice(0, 20)}{mod.description.length > 20 ? '...' : ''}</span>
                            <span className="text-xs text-green-500 mx-1">${mod.cost.toLocaleString()}</span>
                            <button onClick={() => removeMod(mod.id)} className="ml-1">
                            <X className="h-3 w-3" />
                            </button>
                        </Badge>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 p-2">No modifications selected yet</p>
                    )}
                    </div>
                </div>
            </div>
            
             <DialogFooter>
              <Button variant="outline" onClick={() => setActiveTab("photos")}>
                Back
              </Button>
              <Button onClick={() => setActiveTab("details")}>
                Next: Add Details
              </Button>
            </DialogFooter>
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
               ].map(
                 (tag) =>
                   !selectedTags.includes(tag) && (
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
                   ),
               )}
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
                   Submit Build
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