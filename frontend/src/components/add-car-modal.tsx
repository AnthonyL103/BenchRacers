"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Camera, Loader2, Plus, Search, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddCarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCarModal({ open, onOpenChange }: AddCarModalProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [vin, setVin] = useState("")
  const [isLookingUpVin, setIsLookingUpVin] = useState(false)
  const [vinLookupSuccess, setVinLookupSuccess] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [photoPreview, setPhotoPreview] = useState<string[]>([])
  const [carDetails, setCarDetails] = useState({
    make: "",
    model: "",
    year: "",
    trim: "",
    engine: "",
    transmission: "",
    drivetrain: "",
  })

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  const handlePhotoUpload = () => {
    // In a real app, this would handle file uploads
    // For now, we'll just add a placeholder
    setPhotoPreview([...photoPreview, `/placeholder.svg?height=600&width=800&text=Photo ${photoPreview.length + 1}`])
  }

  const removePhoto = (index: number) => {
    const newPreviews = [...photoPreview]
    newPreviews.splice(index, 1)
    setPhotoPreview(newPreviews)
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
        transmission: "8-Speed Automatic",
        drivetrain: "RWD",
      })
      setVinLookupSuccess(true)
      setIsLookingUpVin(false)
      setActiveTab("photos")
    }, 1500)
  }

  const handleSubmit = () => {
    // In a real app, this would save the car to the database
    console.log("Saving car:", { vin, ...carDetails, photos: photoPreview, tags: selectedTags })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Car</DialogTitle>
          <DialogDescription>Enter your car details and modifications to showcase your build</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="photos" disabled={!vinLookupSuccess}>
              Photos
            </TabsTrigger>
            <TabsTrigger value="mods" disabled={!vinLookupSuccess}>
              Modifications
            </TabsTrigger>
            <TabsTrigger value="details" disabled={!vinLookupSuccess}>
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="vin">VIN (Vehicle Identification Number)</Label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    placeholder="e.g. Toyota"
                    value={carDetails.make}
                    onChange={(e) => setCarDetails({ ...carDetails, make: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g. Supra"
                    value={carDetails.model}
                    onChange={(e) => setCarDetails({ ...carDetails, model: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    placeholder="e.g. 2020"
                    value={carDetails.year}
                    onChange={(e) => setCarDetails({ ...carDetails, year: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trim">Trim</Label>
                  <Input
                    id="trim"
                    placeholder="e.g. GR"
                    value={carDetails.trim}
                    onChange={(e) => setCarDetails({ ...carDetails, trim: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engine">Engine</Label>
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
                  <Label htmlFor="transmission">Transmission</Label>
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
                  <Label htmlFor="drivetrain">Drivetrain</Label>
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
              <Button onClick={() => vinLookupSuccess && setActiveTab("photos")} disabled={!vinLookupSuccess}>
                Next: Add Photos
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="photos" className="space-y-6 py-4">
            <div>
              <Label className="block mb-4">Car Photos</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {photoPreview.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-gray-800">
                    <img
                      src={photo || "/placeholder.svg"}
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
                    onClick={handlePhotoUpload}
                    className="aspect-square rounded-md border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-gray-800/50 transition-colors"
                  >
                    <Camera className="h-6 w-6 text-gray-400" />
                    <span className="text-sm text-gray-400">Add Photo</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Upload up to 6 high-quality photos of your car. First photo will be the main image.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setActiveTab("basic")}>
                Back
              </Button>
              <Button onClick={() => setActiveTab("mods")} disabled={photoPreview.length === 0}>
                Next: Add Modifications
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="mods" className="space-y-6 py-4">
            <div>
              <Label className="block mb-2">Modifications</Label>
              <Tabs defaultValue="engine">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="engine">Engine</TabsTrigger>
                  <TabsTrigger value="exterior">Exterior</TabsTrigger>
                  <TabsTrigger value="suspension">Suspension</TabsTrigger>
                  <TabsTrigger value="interior">Interior</TabsTrigger>
                </TabsList>
                <TabsContent value="engine" className="space-y-4">
                  <Textarea placeholder="Describe your engine modifications..." className="min-h-[120px]" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="horsepower">Horsepower</Label>
                      <Input id="horsepower" placeholder="e.g. 450" type="number" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="torque">Torque (lb-ft)</Label>
                      <Input id="torque" placeholder="e.g. 420" type="number" />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="exterior" className="space-y-4">
                  <Textarea placeholder="Describe your exterior modifications..." className="min-h-[120px]" />
                </TabsContent>
                <TabsContent value="suspension" className="space-y-4">
                  <Textarea placeholder="Describe your suspension setup..." className="min-h-[120px]" />
                </TabsContent>
                <TabsContent value="interior" className="space-y-4">
                  <Textarea placeholder="Describe your interior modifications..." className="min-h-[120px]" />
                </TabsContent>
              </Tabs>
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
              <Label htmlFor="tags" className="block mb-2">
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell us about your build journey, inspiration, and future plans..."
                className="min-h-[150px]"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setActiveTab("mods")}>
                Back
              </Button>
              <Button onClick={handleSubmit}>Submit Build</Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
