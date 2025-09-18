"use client"

import { useState, useEffect } from "react"
import { Navbar } from "../utils/navbar"
import { Button } from "../ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { BarChart3, Camera, Edit, Heart, LineChart, Plus, Settings, Trophy, Upload, X, Trash, Car, Zap, TrendingUp, Target, DollarSign, Award } from "lucide-react"
import { getS3ImageUrl } from "../utils/s3helper"
import { AddCarModal } from "../utils/add-car-modal"
import { EditCarModal } from "../utils/edit-car-modal"
import { useUser } from '../contexts/usercontext'
import { Car as GarageCar, useGarage } from '../contexts/garagecontext'
import { useNavigate } from 'react-router-dom'
import {EditProfileModal} from '../utils/edit-profile-modal'
import TireLoadingAnimation from "../utils/tire-spinner"

export default function GaragePage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<GarageCar | null>(null);
  const [isAddCarModalOpen, setIsAddCarModalOpen] = useState(false)
  const [isEditProfileModalOpen, setIsEditProfileModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  const { user, isAuthenticated } = useUser();
  const { cars, isLoading, error, fetchUserCars, deleteCar } = useGarage();
  const validCars = cars.filter(car => car && typeof car === 'object');
  const navigate = useNavigate();

  // Mouse parallax effect
  useEffect(() => {
    interface MousePosition {
        x: number;
        y: number;
    }

    interface MouseMoveEvent extends MouseEvent {
        clientX: number;
        clientY: number;
    }

    const handleMouseMove = (e: MouseMoveEvent) => {
        setMousePosition({
            x: (e.clientX / window.innerWidth) * 100,
            y: (e.clientY / window.innerHeight) * 100,
        })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserCars();
    }
  }, [isAuthenticated, fetchUserCars]);

  const handleDeleteCar = async (entryID: number) => {
    if (window.confirm("Are you sure you want to delete this car?")) {
      await deleteCar(entryID);
    }
  }
  
  const handleEditCar = (car: GarageCar) => {
    setSelectedCar(car);
    setIsEditModalOpen(true);
  };

  if (!isAuthenticated) {
    return null; 
  }
  
  

  
return (
    <div className="min-h-screen bg-gray-950 overflow-x-hidden">
      {/* Animated background */}
      <div 
        className="fixed inset-0 opacity-5"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(221, 28, 73, 0.3) 0%, transparent 50%),
            radial-gradient(circle at ${100 - mousePosition.x}% ${100 - mousePosition.y}%, rgba(107, 114, 128, 0.2) 0%, transparent 50%)`
        }}
      />
      
     

      <Navbar />
      
      {isLoading && validCars.length === 0 ? (
        <div className="flex justify-center items-start">
            <TireLoadingAnimation />
        </div>
        
      ) : (
        
      <main className="relative z-10 min-h-screen">
        <div className="w-full mx-auto px-6 py-12">
          {/* Hero Header */}
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-6">
              My Garage
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Your personal automotive sanctuary. Build, modify, and showcase your dream machines.
            </p>
          </div>
          
          

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
            {/* Profile Card - Enhanced */}
            <div className="xl:col-span-1 xl:row-start-1">
              <div className="bg-black/40 backdrop-blur-xl border border-gray-800 rounded-3xl p-8">
                {/* Profile Header */}
                <div className="text-center mb-8">
                  <div className="relative inline-block mb-6">
                    <Avatar className="h-32 w-32 ring-4 ring-primary/50 ring-offset-4 ring-offset-gray-950">
                      <AvatarImage 
                        className="w-full h-full object-cover" 
                        src={user?.profilephotokey 
                          ? getS3ImageUrl(user?.profilephotokey)
                          : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(user?.name || "User")}`
                        } 
                        alt="User" 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-red-700 text-white font-bold text-2xl">
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-950 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-2">{user?.name || "User"}</h2>
                  <p className="text-gray-400 text-lg">{user?.userEmail}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center p-4 bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl">
                    <div className="text-3xl font-black text-primary mb-1">{validCars.length}</div>
                    <div className="text-xs text-gray-400 font-semibold">Cars</div>
                  </div>
                  <div className="text-center p-4 bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl">
                    <div className="text-3xl font-black text-white mb-1">{validCars.reduce((total, car) => total + car.upvotes, 0)}</div>
                    <div className="text-xs text-gray-400 font-semibold">Votes</div>
                  </div>
                  <div className="text-center p-4 bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl">
                    <div className="text-3xl font-black text-yellow-500 mb-1">-</div>
                    <div className="text-xs text-gray-400 font-semibold">Trophies</div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="space-y-6 mb-8">
                  <div className="bg-gray-900/30 rounded-xl p-4">
                    <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Region
                    </h3>
                    <p className="text-gray-300">{user?.region || "Unknown"}</p>
                  </div>

                  <div className="bg-gray-900/30 rounded-xl p-4">
                    <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                      <Award className="h-4 w-4 text-green-400" />
                      Member Since
                    </h3>
                    <p className="text-gray-300">
                      {user?.accountCreated ? new Date(user.accountCreated).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>
                </div>

                {/* Edit Profile Button */}
                <Button 
                  className="w-full bg-primary hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all duration-300 hover:scale-105"
                  onClick={() => setIsEditProfileModal(true)}
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>

           
            <div className="xl:col-span-3">
              <Tabs defaultValue="my-cars" className="space-y-8">
                <TabsList className="grid grid-cols-2 bg-black/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-2 h-16">
                  <TabsTrigger 
                    value="my-cars" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-white text-gray-400 rounded-xl font-bold text-lg h-12 transition-all duration-300"
                  >
                    <Car className="h-5 w-5 mr-2" />
                    My Cars
                  </TabsTrigger>
                  <TabsTrigger 
                    value="stats" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-white text-gray-400 rounded-xl font-bold text-lg h-12 transition-all duration-300"
                  >
                    <BarChart3 className="h-5 w-5 mr-2" />
                    My Stats
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="my-cars" className="space-y-8">
                  {/* Header with Add Button */}
                  <div className="flex justify-between items-center">
                    <h2 className="text-4xl font-bold text-white">Collection</h2>
                    <Button 
                      size="lg" 
                      className="bg-primary hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                      onClick={() => setIsAddCarModalOpen(true)}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add New Car
                    </Button>
                  </div>

                  {error && (
                    <div className="bg-red-900/50 backdrop-blur-xl border border-red-500/30 text-red-100 p-6 rounded-2xl">
                      {error}
                    </div>
                  )}

                  {validCars.length === 0 ? (
                    <div className="bg-black/40 backdrop-blur-xl border border-gray-800 rounded-3xl p-16 text-center">
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                          <Car className="h-32 w-32 text-gray-600" />
                          <div className="absolute -top-2 -right-2 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                            <Plus className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <h3 className="text-4xl font-bold text-white">Your garage awaits</h3>
                        <p className="text-gray-400 text-xl max-w-md">
                          Ready to showcase your automotive passion? Add your first build and start your journey.
                        </p>
                        <Button 
                          size="lg"
                          className="bg-primary hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105"
                          onClick={() => setIsAddCarModalOpen(true)}
                        >
                          <Zap className="h-5 w-5 mr-2" />
                          Add Your First Car
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {validCars.map((car) => (
                        <div key={car.entryID} className="group relative bg-black/40 backdrop-blur-xl border border-gray-800 rounded-3xl overflow-hidden hover:scale-[1.02] transition-all duration-300">
                          {/* Car Image */}
                          <div className="relative h-64 overflow-hidden">
                            <img
                              src={car.mainPhotoKey 
                                ? getS3ImageUrl(car.mainPhotoKey) 
                                : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(car.carName)}`
                              }
                              alt={car.carName}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                            
                            {/* Category Badge */}
                            <div className="absolute top-4 right-4">
                              <Badge className="bg-primary text-white px-4 py-2 font-bold">
                                {car.category}
                              </Badge>
                            </div>

                            {/* Likes */}
                            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-gray-700 rounded-full px-3 py-2">
                              <Heart className="h-4 w-4 text-red-500" fill="currentColor" />
                              <span className="text-white font-bold text-sm">{car.upvotes}</span>
                            </div>
                          </div>

                          {/* Car Info */}
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-2xl font-bold text-white mb-2">{car.carName}</h3>
                                <p className="text-gray-400 text-lg">
                                  {car.carMake} {car.carModel}
                                  {car.carColor && <span className="text-primary"> • {car.carColor}</span>}
                                </p>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {/*<div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-green-400">${car.totalCost?.toLocaleString() || '0'}</div>
                                <div className="text-xs text-gray-400">Investment</div>
                              </div> */}
                              
                              <div className="bg-gray-900/100 col-span-full rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-primary">{car.mods.length || 0}</div>
                                <div className="text-xs text-gray-400">Modifications</div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                              <Button 
                                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all duration-300"
                                onClick={() => handleEditCar(car)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline"
                                className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500 font-bold py-3 rounded-xl transition-all duration-300"
                                onClick={() => handleDeleteCar(car.entryID)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="stats" className="space-y-8">
                  <h2 className="text-4xl font-bold text-white">Analytics</h2>

                  {/* Main Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">Total Votes</h3>
                        <TrendingUp className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-4xl font-black text-primary mb-2">
                        {validCars.reduce((total, car) => total + (car?.upvotes || 0), 0)}
                      </div>
                      <p className="text-gray-400">Across all builds</p>
                    </div>

                    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">Total Cars</h3>
                        <Car className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-4xl font-black text-white mb-2">{validCars.length}</div>
                      <p className="text-gray-400">In your collection</p>
                    </div>

                    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">Total Mods</h3>
                        <Settings className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-4xl font-black text-white mb-2">
                        {validCars.reduce((total, car) => total + (car?.totalMods || 0), 0)}
                      </div>
                      <p className="text-gray-400">Modifications</p>
                    </div>
                  </div>

                  {/* Detailed Performance Card */}
                  
                  <div className="bg-black/40 backdrop-blur-xl">
                  {/*  <h3 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                      <DollarSign className="h-8 w-8 text-green-400" />
                      Financial Overview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                        <h4 className="text-lg font-bold text-white mb-2">Total Investment</h4>
                        <div className="text-3xl font-black text-green-400 mb-2">
                          ${validCars.reduce((total, car) => total + Number(car?.totalCost || 0), 0).toLocaleString()}
                        </div>
                        <p className="text-green-400 text-sm">All builds combined</p>
                      </div>
                      
                      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                        <h4 className="text-lg font-bold text-white mb-2">Average Cost</h4>
                        <div className="text-3xl font-black text-primary mb-2">
                          ${validCars.length > 0 
                            ? Math.round(validCars.reduce((total, car) => total + Number(car?.totalCost || 0), 0) / validCars.length).toLocaleString()
                            : 0
                          }
                        </div>
                        <p className="text-primary text-sm">Per build</p>
                      </div>
                      
                      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                        <h4 className="text-lg font-bold text-white mb-2">Most Popular</h4>
                        <div className="text-lg font-bold text-white mb-2 truncate">
                          {validCars.length > 0 
                            ? validCars.filter(car => car).reduce((prev, current) => (prev?.upvotes > current?.upvotes) ? prev : current)?.carName || 'None'
                            : 'None'}
                        </div>
                        <p className="text-gray-400 text-sm">Most upvoted</p>
                      </div>
                    </div>
                    
                    */}
                     <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                        <h4 className="text-lg font-bold text-white mb-2">Most Popular</h4>
                        <div className="text-lg font-bold text-white mb-2 truncate">
                          {validCars.length > 0 
                            ? validCars.filter(car => car).reduce((prev, current) => (prev?.upvotes > current?.upvotes) ? prev : current)?.carName || 'None'
                            : 'None'}
                        </div>
                        <p className="text-gray-400 text-sm">Most upvoted</p>
                    </div>
                   
                    
                    
                  </div>
                </TabsContent>
              </Tabs>
            </div>

        
          </div>
        </div>
      </main>
      )}
      

      {/* Modals */}
      <EditProfileModal open={isEditProfileModalOpen} onOpenChange={setIsEditProfileModal} />
      <AddCarModal open={isAddCarModalOpen} onOpenChange={setIsAddCarModalOpen} />
      {selectedCar && (
        <EditCarModal 
          open={isEditModalOpen} 
          onOpenChange={setIsEditModalOpen} 
          car={selectedCar} 
        />
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
        
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );}