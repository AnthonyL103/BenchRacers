"use client"

import { Label } from "../ui/label"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Navbar } from "../utils/navbar"
import { Footer } from "../utils/footer"
import { Button } from "../ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { BarChart3, Camera, Edit, Heart, LineChart, Plus, Settings, Trophy, Upload, X, Trash, Car as CarIcon } from "lucide-react"
import { getS3ImageUrl } from "../utils/s3helper"
import { AddCarModal } from "../utils/add-car-modal"
import { useUser } from '../contexts/usercontext'
import { useGarage } from '../contexts/garagecontext'
import { useNavigate } from 'react-router-dom'

export default function GaragePage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [photoPreview, setPhotoPreview] = useState<string[]>([])
  const [isAddCarModalOpen, setIsAddCarModalOpen] = useState(false)
  
  // Get user and authentication state
  const { user, isAuthenticated } = useUser();
  
  // Get garage data and functions
  const { cars, isLoading, error, fetchUserCars, deleteCar } = useGarage();
  
  const navigate = useNavigate();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);
  
  // Fetch user's cars when the component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserCars();
    }
  }, [isAuthenticated, fetchUserCars]);

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }
  
  const getImageSrc = (photoKey: string | null | undefined, carName: string): string => {
    try {
      return photoKey 
        ? getS3ImageUrl(photoKey) 
        : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(carName)}`;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return `/placeholder.svg?height=400&width=600&text=Error+Loading+Image`;
    }
  };
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
  
  // Handle car deletion
  const handleDeleteCar = async (entryID: number) => {
    if (window.confirm("Are you sure you want to delete this car?")) {
      await deleteCar(entryID);
    }
  }
  
  // Handle edit car
  const handleEditCar = (entryID: number) => {
    navigate(`/edit-car/${entryID}`);
  }

  // If authentication is still being checked, show a loading state
  if (!isAuthenticated) {
    return null; // Will redirect through useEffect
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
                      <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-2xl">{user?.name || "User"}</CardTitle>
                  <div className="text-gray-400">{user?.userEmail}</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-center">
                    <div>
                      <div className="text-2xl text-white font-bold">{cars.length}</div>
                      <div className="text-xs text-gray-400">Cars</div>
                    </div>
                    <div>
                      <div className="text-2xl text-white font-bold">{cars.reduce((total, car) => total + car.upvotes, 0)}</div>
                      <div className="text-xs text-gray-400">Votes</div>
                    </div>
                    <div>
                      <div className="text-2xl text-white font-bold">-</div>
                      <div className="text-xs text-gray-400">Trophies</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800">
                    <h3 className="font-medium mb-2 text-white">Region</h3>
                    <p className="text-sm text-gray-400">
                      {user?.region || "Unknown"}
                    </p>
                  </div>

                  <div className="pt-4 border-t text-white">
                    <h3 className="font-medium mb-2">Joined</h3>
                    <p className="text-sm text-gray-400">
                      {user?.accountCreated ? new Date(user.accountCreated).toLocaleDateString() : "Unknown"}
                    </p>
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

                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : error ? (
                    <div className="bg-red-900 text-red-100 border border-red-800 p-4 rounded mb-6">
                      {error}
                    </div>
                  ) : cars.length === 0 ? (
                    <Card className="bg-gray-900 border-gray-800 text-center p-12">
                      <div className="flex flex-col items-center gap-4">
                        <CarIcon className="h-16 w-16 text-gray-600" />
                        <h2 className="text-2xl font-bold">Your garage is empty</h2>
                        <p className="text-gray-400 max-w-md mx-auto">
                          You haven't added any cars to your garage yet. Click the "Add Car" button to get started.
                        </p>
                        <Button onClick={() => setIsAddCarModalOpen(true)} className="mt-4">
                          Add Your First Car
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {cars.map((car) => (
                        <Card key={car.entryID} className="bg-gray-900 border-gray-800">
                          <div className="relative h-48">
                          <img
                            src={car.mainPhotoKey 
                            ? getS3ImageUrl(car.mainPhotoKey) 
                            : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(car.carName)}`
                            }
                            alt={car.carName}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-primary">{car.category}</Badge>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-white">{car.carName}</h3>
                                <p className="text-sm text-gray-400">
                                  {car.carMake} {car.carColor && `· ${car.carColor}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4 text-primary text-white" fill="currentColor" />
                                <span className="text-sm text-white">{car.upvotes}</span>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex gap-2 p-4 pt-0">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 gap-2"
                              onClick={() => handleEditCar(car.entryID)}
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 gap-2 text-red-500" 
                              onClick={() => handleDeleteCar(car.entryID)}
                            >
                              <Trash className="h-4 w-4" />
                              Delete
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="saved" className="space-y-6">
                  <h2 className="text-xl font-bold">Saved Builds</h2>
                  {/* This would be populated by saved builds from your API */}
                  <Card className="bg-gray-900 border-gray-800 text-center p-12">
                    <div className="flex flex-col items-center gap-4">
                      <Heart className="h-16 w-16 text-gray-600" />
                      <h2 className="text-2xl font-bold">No saved builds yet</h2>
                      <p className="text-gray-400 max-w-md mx-auto">
                        When you save other users' car builds, they will appear here for easy reference.
                      </p>
                      <Button onClick={() => navigate('/explore')} className="mt-4">
                        Explore Cars
                      </Button>
                    </div>
                  </Card>
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
                        <div className="text-3xl font-bold">{cars.reduce((total, car) => total + car.upvotes, 0)}</div>
                        <p className="text-sm text-gray-400">Across all your cars</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Total Cars</CardTitle>
                        <LineChart className="h-4 w-4 text-gray-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{cars.length}</div>
                        <p className="text-sm text-gray-400">In your garage</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Total Mods</CardTitle>
                        <Trophy className="h-4 w-4 text-gray-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{cars.reduce((total, car) => total + car.totalMods, 0)}</div>
                        <p className="text-sm text-gray-400">Across all your cars</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle>Performance Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
                        <p className="text-gray-400">Performance chart would be displayed here</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        <Card className="bg-gray-800 border-gray-700">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Total Cost</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">${cars.reduce((total, car) => total + car.totalCost, 0).toLocaleString()}</div>
                            <p className="text-xs text-gray-400">Total investment</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-gray-800 border-gray-700">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Average Cost</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              ${cars.length > 0 
                                ? Math.round(cars.reduce((total, car) => total + car.totalCost, 0) / cars.length).toLocaleString() 
                                : 0}
                            </div>
                            <p className="text-xs text-gray-400">Per car</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-gray-800 border-gray-700">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Most Popular Car</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-lg font-bold truncate">
                              {cars.length > 0 
                                ? cars.reduce((prev, current) => (prev.upvotes > current.upvotes) ? prev : current).carName
                                : 'None'}
                            </div>
                            <p className="text-xs text-gray-400">Based on upvotes</p>
                          </CardContent>
                        </Card>
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

      {/* Add Car Modal - This would need to be updated to use the addCar function from useGarage */}
      <AddCarModal open={isAddCarModalOpen} onOpenChange={setIsAddCarModalOpen} />
    </div>
  )
}