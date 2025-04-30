"use client"

import { Label } from "../ui/label"

import { useState } from "react"
import Image from "next/image"
import { Navbar } from "../navbar"
import { Footer } from "../footer"
import { Button } from "../ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { BarChart3, Camera, Edit, Heart, LineChart, Plus, Settings, Trophy, Upload, X } from "lucide-react"
import { AddCarModal } from "../add-car-modal"

export default function GaragePage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [photoPreview, setPhotoPreview] = useState<string[]>([])
  const [isAddCarModalOpen, setIsAddCarModalOpen] = useState(false)

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
        <div className="container">
          <div className="flex flex-col md:flex-row gap-8 mb-12">
            <div className="w-full md:w-1/3">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="/placeholder.svg?height=200&width=200" alt="User" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-2xl">John Doe</CardTitle>
                  <div className="text-gray-400">@johndoe</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-center">
                    <div>
                      <div className="text-2xl font-bold">3</div>
                      <div className="text-xs text-gray-400">Cars</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">1,245</div>
                      <div className="text-xs text-gray-400">Votes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">2</div>
                      <div className="text-xs text-gray-400">Trophies</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800">
                    <h3 className="font-medium mb-2">Bio</h3>
                    <p className="text-sm text-gray-400">
                      Car enthusiast with a passion for JDM and European builds. Currently working on my Supra project.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-800">
                    <h3 className="font-medium mb-2">Achievements</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                        <Trophy className="h-3 w-3 mr-1" /> Top 10 JDM
                      </Badge>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        <Heart className="h-3 w-3 mr-1" /> 1K+ Likes
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full gap-2">
                    <Settings className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="w-full md:w-2/3">
              <Tabs defaultValue="my-cars">
                <TabsList className="grid grid-cols-3 mb-8">
                  <TabsTrigger value="my-cars">My Cars</TabsTrigger>
                  <TabsTrigger value="saved">Saved Builds</TabsTrigger>
                  <TabsTrigger value="stats">My Stats</TabsTrigger>
                </TabsList>

                <TabsContent value="my-cars" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">My Cars</h2>
                    <Button size="sm" className="gap-2" onClick={() => setIsAddCarModalOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Add New Car
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      { name: "Toyota Supra MK4", rank: "#12 in Toyota", likes: 432 },
                      { name: "Nissan 370Z", rank: "#8 in Nissan", likes: 567 },
                      { name: "Honda S2000", rank: "#5 in Honda", likes: 789 },
                    ].map((car, i) => (
                      <Card key={i} className="bg-gray-900 border-gray-800">
                        <div className="relative h-48">
                          <Image
                            src={`/placeholder.svg?height=400&width=600`}
                            alt={car.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-primary">{car.rank}</Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold">{car.name}</h3>
                              <p className="text-sm text-gray-400">
                                Added on {["Jan 15, 2023", "Mar 22, 2023", "May 10, 2023"][i]}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4 text-primary" fill="currentColor" />
                              <span className="text-sm">{car.likes}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex gap-2 p-4 pt-0">
                          <Button variant="outline" size="sm" className="flex-1 gap-2">
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button size="sm" className="flex-1">
                            View Stats
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="saved" className="space-y-6">
                  <h2 className="text-xl font-bold">Saved Builds</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      { name: "BMW M4 Competition", owner: "@bmwfanatic", likes: 876 },
                      { name: "Porsche 911 GT3", owner: "@trackday", likes: 1024 },
                      { name: "Ford Mustang GT", owner: "@musclecar", likes: 654 },
                      { name: "Audi RS6 Avant", owner: "@wagonlife", likes: 789 },
                    ].map((car, i) => (
                      <Card key={i} className="bg-gray-900 border-gray-800">
                        <div className="relative h-48">
                          <Image
                            src={`/placeholder.svg?height=400&width=600`}
                            alt={car.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold">{car.name}</h3>
                              <p className="text-sm text-gray-400">By {car.owner}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4 text-primary" fill="currentColor" />
                              <span className="text-sm">{car.likes}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                          <Button size="sm" className="w-full">
                            View Details
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="stats" className="space-y-6">
                  <h2 className="text-xl font-bold">My Stats</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Total Votes</CardTitle>
                        <BarChart3 className="h-4 w-4 text-gray-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">1,788</div>
                        <p className="text-sm text-green-500">+12% from last month</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Average Rating</CardTitle>
                        <LineChart className="h-4 w-4 text-gray-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">8.7/10</div>
                        <p className="text-sm text-green-500">+0.3 from last month</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Best Ranking</CardTitle>
                        <Trophy className="h-4 w-4 text-gray-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">#5</div>
                        <p className="text-sm text-gray-400">in Honda category</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle>Performance Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
                        <p className="text-gray-400">Performance chart would be displayed here</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        <Card className="bg-gray-800 border-gray-700">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Votes This Month</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">245</div>
                            <p className="text-xs text-green-500">+18% from last month</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-gray-800 border-gray-700">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Rank Changes</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">+3</div>
                            <p className="text-xs text-green-500">Positions gained</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-gray-800 border-gray-700">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Profile Views</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">1,245</div>
                            <p className="text-xs text-green-500">+32% from last month</p>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="upload" id="upload-tab" className="space-y-6">
                  <h2 className="text-xl font-bold">Upload New Car</h2>

                  <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="space-y-8 p-6">
                      <div className="space-y-6">
                        <div>
                          <Label htmlFor="photos" className="block mb-4">
                            Photos
                          </Label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                            {photoPreview.map((photo, index) => (
                              <div
                                key={index}
                                className="relative aspect-square rounded-md overflow-hidden bg-gray-800"
                              >
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
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Add Car Modal */}
      <AddCarModal open={isAddCarModalOpen} onOpenChange={setIsAddCarModalOpen} />
    </div>
  )
}
