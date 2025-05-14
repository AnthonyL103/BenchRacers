import Link from "next/link"
import Image from "next/image"
import { Navbar } from "../utils/navbar"
import { Footer } from "../utils/footer"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
import { ArrowUp, Heart, Trophy } from "lucide-react"

// Mock data for demonstration
const categoryData = {
  exotic: {
    top3: [
      {
        id: "1",
        name: "Lamborghini Aventador",
        owner: "supercarfan",
        image: "/placeholder.svg?height=600&width=800",
        likes: 1245,
      },
      {
        id: "2",
        name: "Ferrari 488 Pista",
        owner: "rossoCorsa",
        image: "/placeholder.svg?height=600&width=800",
        likes: 1102,
      },
      {
        id: "3",
        name: "McLaren 720S",
        owner: "speedhunter",
        image: "/placeholder.svg?height=600&width=800",
        likes: 987,
      },
    ],
    leaderboard: [
      {
        id: "4",
        name: "Porsche 911 GT3 RS",
        owner: "trackday",
        image: "/placeholder.svg?height=200&width=200",
        likes: 876,
        change: 2,
      },
      {
        id: "5",
        name: "Audi R8 V10 Plus",
        owner: "quattrolover",
        image: "/placeholder.svg?height=200&width=200",
        likes: 812,
        change: 1,
      },
      {
        id: "6",
        name: "Aston Martin DBS",
        owner: "bondcars",
        image: "/placeholder.svg?height=200&width=200",
        likes: 765,
        change: 3,
      },
      {
        id: "7",
        name: "Ferrari F8 Tributo",
        owner: "tifosi",
        image: "/placeholder.svg?height=200&width=200",
        likes: 723,
        change: -1,
      },
    ],
  },
  sport: {
    top3: [
      {
        id: "8",
        name: "Nissan Skyline GT-R R34",
        owner: "godzilla",
        image: "/placeholder.svg?height=600&width=800",
        likes: 1024,
      },
      {
        id: "9",
        name: "Toyota Supra MK4",
        owner: "2jzpower",
        image: "/placeholder.svg?height=600&width=800",
        likes: 956,
      },
      {
        id: "10",
        name: "Honda S2000",
        owner: "s2kmaster",
        image: "/placeholder.svg?height=600&width=800",
        likes: 842,
      },
    ],
    leaderboard: [
      {
        id: "11",
        name: "Mazda RX-7 FD",
        owner: "rotarylife",
        image: "/placeholder.svg?height=200&width=200",
        likes: 789,
        change: 2,
      },
      {
        id: "12",
        name: "Subaru WRX STI",
        owner: "subiefan",
        image: "/placeholder.svg?height=200&width=200",
        likes: 756,
        change: 0,
      },
      {
        id: "13",
        name: "Mitsubishi Evo X",
        owner: "ralliart",
        image: "/placeholder.svg?height=200&width=200",
        likes: 712,
        change: 1,
      },
      {
        id: "14",
        name: "BMW M3 E46",
        owner: "bavarian",
        image: "/placeholder.svg?height=200&width=200",
        likes: 689,
        change: -2,
      },
    ],
  },
  offroad: {
    top3: [
      {
        id: "15",
        name: "Ford F-150 Raptor",
        owner: "raptorowner",
        image: "/placeholder.svg?height=600&width=800",
        likes: 876,
      },
      {
        id: "16",
        name: "Jeep Wrangler Rubicon",
        owner: "trailhunter",
        image: "/placeholder.svg?height=600&width=800",
        likes: 823,
      },
      {
        id: "17",
        name: "Toyota 4Runner TRD Pro",
        owner: "overlander",
        image: "/placeholder.svg?height=600&width=800",
        likes: 791,
      },
    ],
    leaderboard: [
      {
        id: "18",
        name: "Land Rover Defender",
        owner: "britishoffroad",
        image: "/placeholder.svg?height=200&width=200",
        likes: 745,
        change: 3,
      },
      {
        id: "19",
        name: "Chevrolet Colorado ZR2",
        owner: "desertrunner",
        image: "/placeholder.svg?height=200&width=200",
        likes: 712,
        change: 1,
      },
      {
        id: "20",
        name: "Mercedes G-Wagon",
        owner: "luxuryoffroad",
        image: "/placeholder.svg?height=200&width=200",
        likes: 689,
        change: 0,
      },
      {
        id: "21",
        name: "Toyota Tacoma TRD",
        owner: "tacotuesday",
        image: "/placeholder.svg?height=200&width=200",
        likes: 654,
        change: -1,
      },
    ],
  },
}

export default function RankingsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Rankings</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              See how car builds stack up against each other based on community votes
            </p>
          </div>

          <Tabs defaultValue="exotic" className="mb-8">
            <div className="flex justify-center mb-20">
              <TabsList className="grid grid-cols-3 w-full max-w-xl">
                <TabsTrigger value="exotic">Exotic</TabsTrigger>
                <TabsTrigger value="sport">Sport</TabsTrigger>
                <TabsTrigger value="offroad">Off-Road</TabsTrigger>
              </TabsList>
            </div>

            {Object.entries(categoryData).map(([category, data]) => (
              <TabsContent key={category} value={category}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  {/* Top 3 Podium */}
                  <Card className="bg-gray-900 border-gray-800 order-2 md:order-1">
                    <div className="relative h-64">
                      <Image
                        src={data.top3[1].image || "/placeholder.svg"}
                        alt="2nd place car"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
                        <Badge className="bg-[#C0C0C0] text-black font-bold">2nd Place</Badge>
                        <div className="flex items-center gap-1 bg-black/60 rounded-full px-2 py-1">
                          <Heart className="h-3 w-3 text-primary" fill="currentColor" />
                          <span className="text-xs text-white">{data.top3[1].likes}</span>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-white">{data.top3[1].name}</h3>
                      <p className="text-sm text-gray-400">By @{data.top3[1].owner}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900 border-gray-800 order-1 md:order-2 transform md:scale-110 z-10 shadow-xl">
                    <div className="relative">
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-10">
                        <Trophy className="h-12 w-12 text-yellow-500 fill-yellow-500" />
                      </div>
                    </div>
                    <div className="relative h-72 mt-4">
                      <Image
                        src={data.top3[0].image || "/placeholder.svg"}
                        alt="1st place car"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
                        <Badge className="bg-yellow-500 text-black font-bold">1st Place</Badge>
                        <div className="flex items-center gap-1 bg-black/60 rounded-full px-2 py-1">
                          <Heart className="h-3 w-3 text-primary" fill="currentColor" />
                          <span className="text-xs text-white">{data.top3[0].likes}</span>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-white">{data.top3[0].name}</h3>
                      <p className="text-sm text-gray-400">By @{data.top3[0].owner}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900 border-gray-800 order-3">
                    <div className="relative h-64">
                      <Image
                        src={data.top3[2].image || "/placeholder.svg"}
                        alt="3rd place car"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
                        <Badge className="bg-[#CD7F32] text-black font-bold">3rd Place</Badge>
                        <div className="flex items-center gap-1 bg-black/60 rounded-full px-2 py-1">
                          <Heart className="h-3 w-3 text-primary" fill="currentColor" />
                          <span className="text-xs text-white">{data.top3[2].likes}</span>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-white">{data.top3[2].name}</h3>
                      <p className="text-sm text-gray-400">By @{data.top3[2].owner}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Leaderboard */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle>Top 10 Leaderboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.leaderboard.map((car, i) => (
                        <Link href={`/car/${car.id}`} key={i}>
                          <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-800 transition-colors">
                            <div className="font-bold text-lg w-8 text-center">{i + 4}</div>
                            <div className="relative w-16 h-16 rounded-md overflow-hidden">
                              <Image
                                src={car.image || "/placeholder.svg"}
                                alt={`Rank ${i + 4} car`}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-white">{car.name}</h3>
                              <p className="text-sm text-gray-400">By @{car.owner}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4 text-primary" fill="currentColor" />
                              <span className="text-sm text-white">{car.likes}</span>
                            </div>
                            <div
                              className={`text-xs flex items-center ${car.change > 0 ? "text-green-500" : car.change < 0 ? "text-red-500" : "text-gray-400"}`}
                            >
                              {car.change > 0 ? (
                                <>
                                  <ArrowUp className="h-3 w-3 mr-1" />
                                  {car.change}
                                </>
                              ) : car.change < 0 ? (
                                <>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-3 w-3 mr-1"
                                  >
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <polyline points="19 12 12 19 5 12"></polyline>
                                  </svg>
                                  {Math.abs(car.change)}
                                </>
                              ) : (
                                "-"
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
