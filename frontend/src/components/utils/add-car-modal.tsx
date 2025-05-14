"use client"

import { useState, useRef, useEffect } from "react"
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

// Types for mods
interface Mod {
  id: number;
  brand: string;
  cost: number;
  description: string;
  link: string;
}

interface AddCarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCarModal({ open, onOpenChange }: AddCarModalProps) {
  const { user } = useUser();
  const { addCar } = useGarage();

  const [activeTab, setActiveTab] = useState("basic")
  const [vin, setVin] = useState("")
  const [isLookingUpVin, setIsLookingUpVin] = useState(false)
  const [vinLookupSuccess, setVinLookupSuccess] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreview, setPhotoPreview] = useState<string[]>([])
  const [description, setDescription] = useState("")
  
  // Preset mods state
  const [engineMods, setEngineMods] = useState<Mod[]>([])
  const [interiorMods, setInteriorMods] = useState<Mod[]>([])
  const [exteriorMods, setExteriorMods] = useState<Mod[]>([])
  
  // Available mods from the database
  const [availableEngineMods, setAvailableEngineMods] = useState<Mod[]>([])
  const [availableInteriorMods, setAvailableInteriorMods] = useState<Mod[]>([])
  const [availableExteriorMods, setAvailableExteriorMods] = useState<Mod[]>([])
  
  // Search states
  const [engineModSearch, setEngineModSearch] = useState("")
  const [interiorModSearch, setInteriorModSearch] = useState("")
  const [exteriorModSearch, setExteriorModSearch] = useState("")
  
  // Dropdown states
  const [openEngineMods, setOpenEngineMods] = useState(false)
  const [openInteriorMods, setOpenInteriorMods] = useState(false)
  const [openExteriorMods, setOpenExteriorMods] = useState(false)
  
  // Loading states
  const [isLoadingEngineMods, setIsLoadingEngineMods] = useState(false)
  const [isLoadingInteriorMods, setIsLoadingInteriorMods] = useState(false)
  const [isLoadingExteriorMods, setIsLoadingExteriorMods] = useState(false)
  
  const [totalCost, setTotalCost] = useState(0)
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [carDetails, setCarDetails] = useState({
    make: "",
    model: "",
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
      ...engineMods,
      ...interiorMods,
      ...exteriorMods
    ].reduce((sum, mod) => sum + mod.cost, 0);
    
    setTotalCost(total);
  }, [engineMods, interiorMods, exteriorMods]);

  // Fetch available mods from the backend
  const fetchAvailableMods = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch engine mods
      setIsLoadingEngineMods(true);
      const engineModsResponse = await axios.get('https://api.benchracershq.com/api/garage/mods/engine', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableEngineMods(engineModsResponse.data.mods || []);
      setIsLoadingEngineMods(false);
      
      // Fetch interior mods
      setIsLoadingInteriorMods(true);
      const interiorModsResponse = await axios.get('https://api.benchracershq.com/api/garage/mods/interior', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableInteriorMods(interiorModsResponse.data.mods || []);
      setIsLoadingInteriorMods(false);
      
      // Fetch exterior mods
      setIsLoadingExteriorMods(true);
      const exteriorModsResponse = await axios.get('https://api.benchracershq.com/api/garage/mods/exterior', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableExteriorMods(exteriorModsResponse.data.mods || []);
      setIsLoadingExteriorMods(false);
      
    } catch (error) {
      console.error("Error fetching available mods:", error);
      setErrors(prev => ({ ...prev, mods: "Failed to load available modifications" }));
    }
  };

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  // Add a mod to selected mods
  const addEngineMod = (mod: Mod) => {
    if (!engineMods.some(m => m.id === mod.id)) {
      setEngineMods([...engineMods, mod]);
    }
    setOpenEngineMods(false);
  };
  
  const addInteriorMod = (mod: Mod) => {
    if (!interiorMods.some(m => m.id === mod.id)) {
      setInteriorMods([...interiorMods, mod]);
    }
    setOpenInteriorMods(false);
  };
  
  const addExteriorMod = (mod: Mod) => {
    if (!exteriorMods.some(m => m.id === mod.id)) {
      setExteriorMods([...exteriorMods, mod]);
    }
    setOpenExteriorMods(false);
  };
  
  // Remove a mod from selected mods
  const removeEngineMod = (id: number) => {
    setEngineMods(engineMods.filter(mod => mod.id !== id));
  };
  
  const removeInteriorMod = (id: number) => {
    setInteriorMods(interiorMods.filter(mod => mod.id !== id));
  };
  
  const removeExteriorMod = (id: number) => {
    setExteriorMods(exteriorMods.filter(mod => mod.id !== id));
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
    const remainingSlots = 6 - photoFiles.length;
    
    if (remainingSlots <= 0) {
      alert("You can upload a maximum of 6 images");
      return;
    }
  
    // Limit to remaining slots
    const newFiles = Array.from(files).slice(0, remainingSlots);
  
    // Update files array
    setPhotoFiles(prevFiles => [...prevFiles, ...newFiles]);
  
    // Create preview URLs for the new files
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPhotoPreview(prevPreviews => [...prevPreviews, ...newPreviews]);
    
    // Reset the file input so the same file can be selected again if needed
    e.target.value = '';
  }

  const removePhoto = (index: number) => {
    // Remove file
    const newFiles = [...photoFiles];
    newFiles.splice(index, 1);
    setPhotoFiles(newFiles);
    
    // Remove preview and revoke URL to prevent memory leaks
    URL.revokeObjectURL(photoPreview[index]);
    const newPreviews = [...photoPreview];
    newPreviews.splice(index, 1);
    setPhotoPreview(newPreviews);
  }

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
    if (photoFiles.length === 0) newErrors.photos = "At least one photo is required";
    
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
      // First, upload all images to S3
      const uploadedPhotos: { s3Key: string; isMainPhoto: boolean }[] = [];
      
      for (let i = 0; i < photoFiles.length; i++) {
        setUploadProgress(0);
        const key = await uploadToS3(photoFiles[i]);
        uploadedPhotos.push({
          s3Key: key,
          isMainPhoto: i === 0 // First photo is the main photo
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
            carColor: "", // You might want to add this field to your form
            description,
            totalMods: engineMods.length + interiorMods.length + exteriorMods.length,
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
            engineMods: engineMods.map(mod => mod.id),
            interiorMods: interiorMods.map(mod => mod.id),
            exteriorMods: exteriorMods.map(mod => mod.id)
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
    setEngineMods([]);
    setInteriorMods([]);
    setExteriorMods([]);
    setTotalCost(0);
    setErrors({});
    setCarDetails({
      make: "",
      model: "",
      year: "",
      trim: "",
      engine: "",
      transmission: "",
      category: "",
      drivetrain: "",
    });
    setActiveTab("basic");
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
                {photoPreview.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-gray-800">
                    <img
                        src={photo}
                        alt={`Car photo ${index + 1}`}
                        className="object-cover w-full h-full"
                    />
                    <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80"
                    >
                        <X className="h-4 w-4" />
                    </button>
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
           <div>
             <Label className="block mb-2 text-white">Modifications</Label>
             <Tabs defaultValue="engine">
               <TabsList className="grid grid-cols-3 mb-4">
                 <TabsTrigger value="engine">Engine</TabsTrigger>
                 <TabsTrigger value="exterior">Exterior</TabsTrigger>
                 <TabsTrigger value="interior">Interior</TabsTrigger>
               </TabsList>
               
               {/* ENGINE MODS */}
               <TabsContent value="engine" className="space-y-4">
                 <div className="space-y-2">
                   <Label className="text-white">Selected Engine Modifications</Label>
                   
                   {engineMods.length > 0 ? (
                     <div className="space-y-2">
                       {engineMods.map(mod => (
                         <div key={mod.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-md">
                           <div>
                             <p className="font-medium">{mod.brand}</p>
                             <p className="text-sm text-gray-400">{mod.description}</p>
                             <p className="text-sm text-green-500">${mod.cost.toLocaleString()}</p>
                           </div>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => removeEngineMod(mod.id)}
                             className="text-red-500"
                           >
                             <X className="h-4 w-4" />
                           </Button>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-sm text-gray-500">No engine modifications selected</p>
                   )}
                   
                   <Popover open={openEngineMods} onOpenChange={setOpenEngineMods}>
                     <PopoverTrigger asChild>
                       <Button
                         variant="outline"
                         role="combobox"
                         aria-expanded={openEngineMods}
                         className="w-full justify-between"
                       >
                         Add Engine Modification
                         <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-full p-0">
                       <Command>
                         <CommandInput placeholder="Search engine mods..." />
                         <CommandList>
                           <CommandEmpty>No mods found.</CommandEmpty>
                           {isLoadingEngineMods ? (
                             <div className="py-6 text-center">
                               <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                               <p className="text-sm text-gray-500 mt-2">Loading modifications...</p>
                             </div>
                           ) : (
                             <CommandGroup>
                               {availableEngineMods.map((mod) => (
                                 <CommandItem
                                   key={mod.id}
                                   value={mod.id.toString()}
                                   onSelect={() => addEngineMod(mod)}
                                   className="py-2"
                                 >
                                   <div className="flex-1">
                                     <p className="font-medium">{mod.brand}</p>
                                     <p className="text-sm text-gray-400">{mod.description}</p>
                                     <p className="text-sm text-green-500">${mod.cost.toLocaleString()}</p>
                                   </div>
                                   <Check
                                     className={`h-4 w-4 ${
                                       engineMods.some(m => m.id === mod.id) ? "opacity-100" : "opacity-0"
                                     }`}
                                   />
                                 </CommandItem>
                               ))}
                             </CommandGroup>
                           )}
                         </CommandList>
                       </Command>
                     </PopoverContent>
                   </Popover>
                 </div>
               </TabsContent>
               
               {/* EXTERIOR MODS */}
               <TabsContent value="exterior" className="space-y-4">
                 <div className="space-y-2">
                   <Label className="text-white">Selected Exterior Modifications</Label>
                   
                   {exteriorMods.length > 0 ? (
                     <div className="space-y-2">
                       {exteriorMods.map(mod => (
                         <div key={mod.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-md">
                           <div>
                             <p className="font-medium">{mod.brand}</p>
                             <p className="text-sm text-gray-400">{mod.description}</p>
                             <p className="text-sm text-green-500">${mod.cost.toLocaleString()}</p>
                           </div>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => removeExteriorMod(mod.id)}
                             className="text-red-500"
                           >
                             <X className="h-4 w-4" />
                           </Button>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-sm text-gray-500">No exterior modifications selected</p>
                   )}
                   
                   <Popover open={openExteriorMods} onOpenChange={setOpenExteriorMods}>
                     <PopoverTrigger asChild>
                       <Button
                         variant="outline"
                         role="combobox"
                         aria-expanded={openExteriorMods}
                         className="w-full justify-between"
                       >
                         Add Exterior Modification
                         <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-full p-0">
                       <Command>
                         <CommandInput placeholder="Search exterior mods..." />
                         <CommandList>
                           <CommandEmpty>No mods found.</CommandEmpty>
                           {isLoadingExteriorMods ? (
                             <div className="py-6 text-center">
                               <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                               <p className="text-sm text-gray-500 mt-2">Loading modifications...</p>
                             </div>
                           ) : (
                             <CommandGroup>
                               {availableExteriorMods.map((mod) => (
                                 <CommandItem
                                   key={mod.id}
                                   value={mod.id.toString()}
                                   onSelect={() => addExteriorMod(mod)}
                                   className="py-2"
                                 >
                                   <div className="flex-1">
                                     <p className="font-medium">{mod.brand}</p>
                                     <p className="text-sm text-gray-400">{mod.description}</p>
                                     <p className="text-sm text-green-500">${mod.cost.toLocaleString()}</p>
                                   </div>
                                   <Check
                                     className={`h-4 w-4 ${
                                       exteriorMods.some(m => m.id === mod.id) ? "opacity-100" : "opacity-0"
                                     }`}
                                   />
                                 </CommandItem>
                               ))}
                             </CommandGroup>
                           )}
                         </CommandList>
                       </Command>
                     </PopoverContent>
                   </Popover>
                 </div>
               </TabsContent>
               
               {/* INTERIOR MODS */}
               <TabsContent value="interior" className="space-y-4">
                 <div className="space-y-2">
                   <Label className="text-white">Selected Interior Modifications</Label>
                   
                   {interiorMods.length > 0 ? (
                     <div className="space-y-2">
                       {interiorMods.map(mod => (
                         <div key={mod.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-md">
                           <div>
                             <p className="font-medium">{mod.brand}</p>
                             <p className="text-sm text-gray-400">{mod.description}</p>
                             <p className="text-sm text-green-500">${mod.cost.toLocaleString()}</p>
                           </div>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => removeInteriorMod(mod.id)}
                             className="text-red-500"
                           >
                             <X className="h-4 w-4" />
                           </Button>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-sm text-gray-500">No interior modifications selected</p>
                   )}
                   
                   <Popover open={openInteriorMods} onOpenChange={setOpenInteriorMods}>
                     <PopoverTrigger asChild>
                       <Button
                         variant="outline"
                         role="combobox"
                         aria-expanded={openInteriorMods}
                         className="w-full justify-between"
                       >
                         Add Interior Modification
                         <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-full p-0">
                       <Command>
                         <CommandInput placeholder="Search interior mods..." />
                         <CommandList>
                           <CommandEmpty>No mods found.</CommandEmpty>
                           {isLoadingInteriorMods ? (
                             <div className="py-6 text-center">
                               <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                               <p className="text-sm text-gray-500 mt-2">Loading modifications...</p>
                             </div>
                           ) : (
                             <CommandGroup>
                               {availableInteriorMods.map((mod) => (
                                 <CommandItem
                                   key={mod.id}
                                   value={mod.id.toString()}
                                   onSelect={() => addInteriorMod(mod)}
                                   className="py-2"
                                 >
                                   <div className="flex-1">
                                     <p className="font-medium">{mod.brand}</p>
                                     <p className="text-sm text-gray-400">{mod.description}</p>
                                     <p className="text-sm text-green-500">${mod.cost.toLocaleString()}</p>
                                   </div>
                                   <Check
                                     className={`h-4 w-4 ${
                                       interiorMods.some(m => m.id === mod.id) ? "opacity-100" : "opacity-0"
                                     }`}
                                   />
                                 </CommandItem>
                               ))}
                             </CommandGroup>
                           )}
                         </CommandList>
                       </Command>
                     </PopoverContent>
                   </Popover>
                 </div>
               </TabsContent>
             </Tabs>
           </div>

           <div className="mt-4 p-4 bg-gray-800 rounded-md">
             <div className="flex justify-between items-center">
               <span className="font-medium">Total Modifications:</span>
               <span>{engineMods.length + exteriorMods.length + interiorMods.length}</span>
             </div>
             <div className="flex justify-between items-center mt-2">
               <span className="font-medium">Total Cost:</span>
               <span className="text-green-500">${totalCost.toLocaleString()}</span>
             </div>
           </div>

           <DialogFooter>
             <Button variant="outline" onClick={() => setActiveTab("photos")}>
               Back
             </Button>
             <Button onClick={() => setActiveTab("details")}>Next: Additional Details</Button>
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