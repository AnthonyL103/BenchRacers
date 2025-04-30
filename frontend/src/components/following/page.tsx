"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "../navbar"
import { Footer } from "../footer"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Input } from "../ui/input"
import { Bell, Heart, Search, User, UserMinus, UserPlus } from "lucide-react"

// Mock data for demonstration
const followedUsers = [
  {
    id: "1",
    username: "godzilla",
    name: "Alex Johnson",
    avatar: "/placeholder.svg?height=200&width=200",
    bio: "JDM enthusiast. R34 GT-R owner. Track day addict.",
    followers: 1245,
    following: 342,
    cars: [
      {
        id: "1",
        name: "Nissan Skyline GT-R R34",
        image: "/placeholder.svg?height=400&width=600",
        likes: 1024,
        updated: "2 days ago",
        isNew: true,
      },
      {
        id: "2",
        name: "Nissan 370Z",
        image: "/placeholder.svg?height=400&width=600",
        likes: 756,
        updated: "2 weeks ago",
        isNew: false,
      },
    ],
  },
  {
    id: "2",
    username: "2jzpower",
    name: "Mike Rodriguez",
    avatar: "/placeholder.svg?height=200&width=200",
    bio: "Toyota fanatic. Building the ultimate Supra.",
    followers: 987,
    following: 213,
    cars: [
      {
        id: "3",
        name: "Toyota Supra MK4",
        image: "/placeholder.svg?height=400&width=600",
        likes: 956,
        updated: "1 day ago",
        isNew: true,
      },
    ],
  },
  {
    id: "3",
    username: "s2kmaster",
    name: "Sarah Chen",
    avatar: "/placeholder.svg?height=200&width=200",
    bio: "Honda S2000 owner. Track enthusiast. Photography lover.",
    followers: 876,
    following: 432,
    cars: [
      {
        id: "4",
        name: "Honda S2000",
        image: "/placeholder.svg?height=400&width=600",
        likes: 842,
        updated: "3 days ago",
        isNew: true,
      },
      {
        id: "5",
        name: "Acura NSX",
        image: "/placeholder.svg?height=400&width=600",
        likes: 723,
        updated: "1 month ago",
        isNew: false,
      },
    ],
  },
  {
    id: "4",
    username: "bmwfanatic",
    name: "David Miller",
    avatar: "/placeholder.svg?height=200&width=200",
    bio: "BMW enthusiast. M3 owner. German engineering at its finest.",
    followers: 765,
    following: 321,
    cars: [
      {
        id: "6",
        name: "BMW M3 Competition",
        image: "/placeholder.svg?height=400&width=600",
        likes: 789,
        updated: "1 week ago",
        isNew: false,
      },
      {
        id: "7",
        name: "BMW M2",
        image: "/placeholder.svg?height=400&width=600",
        likes: 654,
        updated: "2 months ago",
        isNew: false,
      },
    ],
  },
]

// Mock data for suggested users
const suggestedUsers = [
  {
    id: "5",
    username: "porschefan",
    name: "Emma Wilson",
    avatar: "/placeholder.svg?height=200&width=200",
    bio: "Porsche enthusiast. 911 GT3 owner.",
    followers: 1102,
    following: 245,
  },
  {
    id: "6",
    username: "musclecar",
    name: "James Thompson",
    avatar: "/placeholder.svg?height=200&width=200",
    bio: "American muscle car lover. Mustang GT owner.",
    followers: 876,
    following: 198,
  },
  {
    id: "7",
    username: "ralliart",
    name: "Ryan Davis",
    avatar: "/placeholder.svg?height=200&width=200",
    bio: "Rally enthusiast. Evo X owner. Dirt is my playground.",
    followers: 754,
    following: 321,
  },
]

export default function FollowingPage() {
  const [activeTab, setActiveTab] = useState("feed")
  const [searchQuery, setSearchQuery] = useState("")

  // Filter builds based on search query
  const filteredBuilds = followedUsers.flatMap((user) =>
    user.cars
      .filter(
        (car) =>
          car.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .map((car) => ({ ...car, user })),
  )

  // Sort builds by update time (newest first)
  const sortedBuilds = [...filteredBuilds].sort((a, b) => (a.isNew && !b.isNew ? -1 : !a.isNew && b.isNew ? 1 : 0))

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold">Following</h1>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search builds or users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-8">
              <TabsTrigger value="feed">Build Feed</TabsTrigger>
              <TabsTrigger value="users">Following</TabsTrigger>
              <TabsTrigger value="discover">Discover</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Recent Updates</h2>
                <Button variant="outline" size="sm" className="gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </Button>
              </div>

              {sortedBuilds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sortedBuilds.map((build, i) => (
                    <Card key={i} className="bg-gray-900 border-gray-800">
                      <div className="relative h-48">
                        <Image src={build.image || "/placeholder.svg"} alt={build.name} fill className="object-cover" />
                        {build.isNew && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-primary">New Update</Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <Link href={`/car/${build.id}`}>
                              <h3 className="font-bold hover:text-primary transition-colors">{build.name}</h3>
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={build.user.avatar || "/placeholder.svg"} alt={build.user.username} />
                                <AvatarFallback>
                                  <User className="h-3 w-3" />
                                </AvatarFallback>
                              </Avatar>
                              <Link href={`/user/${build.user.id}`} className="text-sm text-gray-400 hover:text-white">
                                @{build.user.username}
                              </Link>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4 text-primary" fill="currentColor" />
                            <span className="text-sm">{build.likes}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Updated {build.updated}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">No builds found matching your search.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <h2 className="text-xl font-bold">Users You Follow</h2>

              <div className="space-y-4">
                {followedUsers.map((user) => (
                  <Card key={user.id} className="bg-gray-900 border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                            <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <Link href={`/user/${user.id}`} className="font-bold hover:text-primary">
                              {user.name}
                            </Link>
                            <p className="text-sm text-gray-400">@{user.username}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {user.followers} followers · {user.following} following
                            </p>
                          </div>
                        </div>
                        <div className="flex-1 md:text-right">
                          <Button variant="outline" size="sm" className="gap-1">
                            <UserMinus className="h-3 w-3" />
                            Unfollow
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-gray-300">{user.bio}</p>
                      </div>
                      {user.cars.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Recent Builds:</p>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {user.cars.map((car) => (
                              <Link key={car.id} href={`/car/${car.id}`} className="flex-shrink-0">
                                <div className="relative w-24 h-24 rounded-md overflow-hidden">
                                  <Image
                                    src={car.image || "/placeholder.svg"}
                                    alt={car.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="discover" className="space-y-6">
              <h2 className="text-xl font-bold">Suggested Users</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedUsers.map((user) => (
                  <Card key={user.id} className="bg-gray-900 border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                          <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Link href={`/user/${user.id}`} className="font-bold hover:text-primary">
                            {user.name}
                          </Link>
                          <p className="text-sm text-gray-400">@{user.username}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {user.followers} followers · {user.following} following
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-gray-300 line-clamp-2">{user.bio}</p>
                      </div>
                      <div className="mt-4">
                        <Button size="sm" className="w-full gap-1">
                          <UserPlus className="h-3 w-3" />
                          Follow
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
