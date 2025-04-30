"use client"

import { useState } from "react"
import { Navbar } from "../navbar"
import { Footer } from "../footer"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
import { X, Upload, Plus, Camera } from "lucide-react"

export default function UploadPage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [photoPreview, setPhotoPreview] = useState<string[]>([])

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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Upload Your Car</h1>
            <p className="text-gray-400">Share your build with the community and get feedback</p>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Car Details</CardTitle>
              <CardDescription>Fill out the information about your car build</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="photos" className="block mb-4">
                    Photos
                  </Label>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="make">Make</Label>
                    <Select>
                      <SelectTrigger id="make">
                        <SelectValue placeholder="Select make" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="toyota">Toyota</SelectItem>
                        <SelectItem value="honda">Honda</SelectItem>
                        <SelectItem value="nissan">Nissan</SelectItem>
                        <SelectItem value="mazda">Mazda</SelectItem>
                        <SelectItem value="subaru">Subaru</SelectItem>
                        <SelectItem value="bmw">BMW</SelectItem>
                        <SelectItem value="mercedes">Mercedes-Benz</SelectItem>
                        <SelectItem value="audi">Audi</SelectItem>
                        <SelectItem value="ford">Ford</SelectItem>
                        <SelectItem value="chevrolet">Chevrolet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" placeholder="e.g. Supra, Civic, 370Z" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input id="year" placeholder="e.g. 2023" type="number" />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="modifications" className="block mb-2">
                  Modifications
                </Label>
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

              <div className="space-y-2">
                <Label htmlFor="social">Social Media (Optional)</Label>
                <Input id="instagram" placeholder="Instagram username" />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline">Save as Draft</Button>
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  Submit Build
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
