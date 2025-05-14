import Link from "next/link"
import Image from "next/image"
import { Navbar } from "../utils/navbar"
import { Footer } from "../utils/footer"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Card, CardContent } from "../ui/card"
import { Separator } from "../ui/separator"
import {
  BookmarkPlus,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  Star,
  ThumbsUp,
  User,
} from "lucide-react"

// Define interfaces for our data types
interface Comment {
  user: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
}

interface ModificationItem {
  name: string;
  brand: string;
  partNumber: string;
  price: number;
  affiliateLink: string;
}

interface Modification {
  category: string;
  items: ModificationItem[];
}

interface SimilarCar {
  id: string;
  name: string;
  image: string;
  owner: string;
  likes: number;
}

interface CarSpecs {
  year: string;
  make: string;
  model: string;
  trim: string;
  horsepower: string;
  torque: string;
  transmission: string;
  drivetrain: string;
}

interface Car {
  id: string;
  name: string;
  owner: string;
  ownerAvatar: string;
  description: string;
  likes: number;
  comments: number;
  rank: string;
  tags: string[];
  images: string[];
  specs: CarSpecs;
  modifications: Modification[];
  rating: number;
  comments2: Comment[];
  similarCars: SimilarCar[];
}

// This would normally come from a database
const getCar = (id: string): Car => {
  // Mock data for demonstration
  return {
    id,
    name: "Nissan Skyline GT-R R34",
    owner: "godzilla",
    ownerAvatar: "/placeholder.svg?height=200&width=200",
    description:
      "My dream build finally complete after 3 years of work. This R34 GT-R features a fully built RB26DETT engine pushing 650whp with a single Garrett GTX3582R turbo. The exterior has been kept mostly stock with just a few subtle modifications to enhance the iconic look.",
    likes: 1024,
    comments: 86,
    rank: "#1 in Nissan",
    tags: ["JDM", "Turbo", "Track", "Iconic"],
    images: [
      "/placeholder.svg?height=1200&width=1600",
      "/placeholder.svg?height=1200&width=1600",
      "/placeholder.svg?height=1200&width=1600",
      "/placeholder.svg?height=1200&width=1600",
    ],
    specs: {
      year: "1999",
      make: "Nissan",
      model: "Skyline GT-R",
      trim: "V-Spec",
      horsepower: "650whp",
      torque: "580 lb-ft",
      transmission: "6-speed manual",
      drivetrain: "AWD",
    },
    modifications: [
      {
        category: "Engine",
        items: [
          {
            name: "Garrett GTX3582R single turbo",
            brand: "Garrett",
            partNumber: "GTX3582R",
            price: 1899.99,
            affiliateLink: "#",
          },
          { name: "HKS cams", brand: "HKS", partNumber: "2202-RN002", price: 899.99, affiliateLink: "#" },
          {
            name: "Tomei 1.2mm head gasket",
            brand: "Tomei",
            partNumber: "TA4070-NS05B",
            price: 249.99,
            affiliateLink: "#",
          },
          {
            name: "ID1300 injectors",
            brand: "Injector Dynamics",
            partNumber: "ID1300",
            price: 1299.99,
            affiliateLink: "#",
          },
          { name: "Nismo fuel pump", brand: "Nismo", partNumber: "17301-RR581", price: 399.99, affiliateLink: "#" },
          { name: "AEM infinity ECU", brand: "AEM", partNumber: "30-7106", price: 2499.99, affiliateLink: "#" },
        ],
      },
      {
        category: "Exterior",
        items: [
          {
            name: "Nismo Z-tune front bumper",
            brand: "Nismo",
            partNumber: "62022-RNR45",
            price: 1599.99,
            affiliateLink: "#",
          },
          { name: "Nismo side skirts", brand: "Nismo", partNumber: "76410-RNR45", price: 899.99, affiliateLink: "#" },
          {
            name: "Top Secret carbon fiber hood",
            brand: "Top Secret",
            partNumber: "TS-GTRNR34-CFH",
            price: 1799.99,
            affiliateLink: "#",
          },
          {
            name: "Volk Racing TE37 wheels (18x10.5 +15)",
            brand: "Volk Racing",
            partNumber: "TE37-18105",
            price: 3599.99,
            affiliateLink: "#",
          },
          {
            name: "Nitto NT01 tires (275/35/18)",
            brand: "Nitto",
            partNumber: "NT01-27535R18",
            price: 1199.99,
            affiliateLink: "#",
          },
        ],
      },
      {
        category: "Suspension",
        items: [
          {
            name: "HKS Hipermax IV coilovers",
            brand: "HKS",
            partNumber: "80230-AN001",
            price: 2499.99,
            affiliateLink: "#",
          },
          {
            name: "Nismo front and rear sway bars",
            brand: "Nismo",
            partNumber: "54611-RNR45",
            price: 799.99,
            affiliateLink: "#",
          },
          { name: "Cusco strut tower bar", brand: "Cusco", partNumber: "116-540-A", price: 349.99, affiliateLink: "#" },
          { name: "Whiteline bushings", brand: "Whiteline", partNumber: "KDT911", price: 499.99, affiliateLink: "#" },
        ],
      },
      {
        category: "Interior",
        items: [
          { name: "Bride Zeta III seats", brand: "Bride", partNumber: "F67AMF", price: 1799.99, affiliateLink: "#" },
          {
            name: "Personal steering wheel",
            brand: "Personal",
            partNumber: "P13770",
            price: 349.99,
            affiliateLink: "#",
          },
          { name: "Nismo cluster", brand: "Nismo", partNumber: "24810-RNR45", price: 899.99, affiliateLink: "#" },
          {
            name: "HKS EVC boost controller",
            brand: "HKS",
            partNumber: "45003-AK009",
            price: 399.99,
            affiliateLink: "#",
          },
          { name: "AEM wideband gauge", brand: "AEM", partNumber: "30-4110", price: 199.99, affiliateLink: "#" },
        ],
      },
    ],
    rating: 9.8,
    comments2: [
      {
        user: "jdmfanatic",
        avatar: "/placeholder.svg?height=100&width=100",
        text: "Absolutely stunning build! That RB26 must sound incredible with the single turbo setup.",
        time: "2 days ago",
        likes: 24,
      },
      {
        user: "skylinelover",
        avatar: "/placeholder.svg?height=100&width=100",
        text: "Dream car right here. Those TE37s are the perfect choice.",
        time: "3 days ago",
        likes: 18,
      },
      {
        user: "boostaddict",
        avatar: "/placeholder.svg?height=100&width=100",
        text: "What kind of power delivery do you get with the GTX3582R? Any lag?",
        time: "5 days ago",
        likes: 12,
      },
    ],
    similarCars: [
      {
        id: "2",
        name: "Toyota Supra MK4",
        image: "/placeholder.svg?height=400&width=600",
        owner: "2jzpower",
        likes: 756,
      },
      {
        id: "3",
        name: "Mazda RX-7 FD",
        image: "/placeholder.svg?height=400&width=600",
        owner: "rotarylife",
        likes: 689,
      },
      {
        id: "4",
        name: "Mitsubishi Lancer Evolution VIII",
        image: "/placeholder.svg?height=400&width=600",
        owner: "ralliart",
        likes: 542,
      },
    ],
  }
}

export default function CarDetailPage({ params }: { params: { id: string } }) {
  const car = getCar(params.id)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Image Gallery */}
        <section className="relative bg-black">
          <div className="relative h-[50vh] md:h-[70vh]">
            <Image src={car.images[0] || "/placeholder.svg"} alt={car.name} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <div className="container">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div>
                    <Badge className="mb-2 bg-primary text-white">{car.rank}</Badge>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{car.name}</h1>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 border">
                        <AvatarImage src={car.ownerAvatar || "/placeholder.svg"} alt={car.owner} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-200">
                        By{" "}
                        <Link href={`/user/${car.owner}`} className="hover:underline">
                          @{car.owner}
                        </Link>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" size="icon" className="rounded-full bg-black/50 border-gray-600">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full bg-black/50 border-gray-600">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="container py-4 overflow-x-auto">
            <div className="flex gap-2">
              {car.images.map((image, index) => (
                <div
                  key={index}
                  className={`relative h-20 w-32 flex-shrink-0 rounded-md overflow-hidden ${
                    index === 0 ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${car.name} image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <Button variant="outline" className="gap-2">
                    <Heart className="h-5 w-5" />
                    <span>Like</span>
                    <Badge variant="secondary" className="ml-1">
                      {car.likes}
                    </Badge>
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>Comment</span>
                    <Badge variant="secondary" className="ml-1">
                      {car.comments2.length}
                    </Badge>
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <BookmarkPlus className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {car.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-bold mb-4">Description</h2>
                <p className="text-gray-300 leading-relaxed">{car.description}</p>
              </div>

              {/* Modifications */}
              <div>
                <h2 className="text-xl font-bold mb-4">Modifications</h2>
                <Tabs defaultValue="Engine">
                  <TabsList className="grid grid-cols-4 mb-4">
                    {car.modifications.map((mod) => (
                      <TabsTrigger key={mod.category} value={mod.category}>
                        {mod.category}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {car.modifications.map((mod) => (
                    <TabsContent key={mod.category} value={mod.category} className="space-y-4">
                      <ul className="space-y-2">
                        {mod.items.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
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
                                className="h-3 w-3 text-primary"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <span>{item.name}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* Shop This Build */}
              <div>
                <h2 className="text-xl font-bold mb-4">Shop This Build</h2>
                <Tabs defaultValue="Engine">
                  <TabsList className="grid grid-cols-4 mb-4">
                    {car.modifications.map((mod) => (
                      <TabsTrigger key={mod.category} value={mod.category}>
                        {mod.category}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {car.modifications.map((mod) => (
                    <TabsContent key={mod.category} value={mod.category} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mod.items.map((item, index) => (
                          <Card key={index} className="bg-gray-800 border-gray-700">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{item.name}</h4>
                                  <p className="text-sm text-gray-400">
                                    {item.brand} | Part #{item.partNumber}
                                  </p>
                                </div>
                                <div className="text-primary font-bold">${item.price.toFixed(2)}</div>
                              </div>
                              <Button variant="outline" size="sm" className="w-full mt-3">
                                Shop Now
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* Comments */}
              <div>
                <h2 className="text-xl font-bold mb-4">Comments</h2>
                <div className="space-y-4">
                  {car.comments2.map((comment, index) => (
                    <div key={index} className="flex gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={comment.avatar || "/placeholder.svg"} alt={comment.user} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-800 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <Link href={`/user/${comment.user}`} className="font-bold hover:underline">
                                @{comment.user}
                              </Link>
                              <span className="text-xs text-gray-400 ml-2">{comment.time}</span>
                            </div>
                          </div>
                          <p className="text-gray-300">{comment.text}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                          <button className="flex items-center gap-1 hover:text-white">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{comment.likes}</span>
                          </button>
                          <button className="hover:text-white">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Specs */}
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">Specifications</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Year</span>
                      <span className="font-medium">{car.specs.year}</span>
                    </div>
                    <Separator className="bg-gray-800" />
                    <div className="flex justify-between">
                      <span className="text-gray-400">Make</span>
                      <span className="font-medium">{car.specs.make}</span>
                    </div>
                    <Separator className="bg-gray-800" />
                    <div className="flex justify-between">
                      <span className="text-gray-400">Model</span>
                      <span className="font-medium">{car.specs.model}</span>
                    </div>
                    <Separator className="bg-gray-800" />
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trim</span>
                      <span className="font-medium">{car.specs.trim}</span>
                    </div>
                    <Separator className="bg-gray-800" />
                    <div className="flex justify-between">
                      <span className="text-gray-400">Horsepower</span>
                      <span className="font-medium">{car.specs.horsepower}</span>
                    </div>
                    <Separator className="bg-gray-800" />
                    <div className="flex justify-between">
                      <span className="text-gray-400">Torque</span>
                      <span className="font-medium">{car.specs.torque}</span>
                    </div>
                    <Separator className="bg-gray-800" />
                    <div className="flex justify-between">
                      <span className="text-gray-400">Transmission</span>
                      <span className="font-medium">{car.specs.transmission}</span>
                    </div>
                    <Separator className="bg-gray-800" />
                    <div className="flex justify-between">
                      <span className="text-gray-400">Drivetrain</span>
                      <span className="font-medium">{car.specs.drivetrain}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rating */}
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">Community Rating</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-5xl font-bold">{car.rating}</div>
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-6 w-6 ${star <= Math.round(car.rating / 2) ? "text-yellow-500 fill-yellow-500" : "text-gray-600"}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">Based on community votes</p>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full">
                    <div className="h-2 bg-primary rounded-full" style={{ width: `${(car.rating / 10) * 100}%` }}></div>
                  </div>
                </CardContent>
              </Card>

              {/* Owner */}
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">About the Owner</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={car.ownerAvatar || "/placeholder.svg"} alt={car.owner} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={`/user/${car.owner}`} className="font-bold text-lg hover:underline">
                        @{car.owner}
                      </Link>
                      <p className="text-sm text-gray-400">Member since 2021</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    View Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Similar Cars */}
              <div>
                <h3 className="text-lg font-bold mb-4">Similar Builds</h3>
                <div className="space-y-4">
                  {car.similarCars.map((similarCar) => (
                    <Link href={`/car/${similarCar.id}`} key={similarCar.id}>
                      <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
                        <CardContent className="p-4 flex gap-4">
                          <div className="relative h-16 w-24 rounded-md overflow-hidden">
                            <Image
                              src={similarCar.image || "/placeholder.svg"}
                              alt={similarCar.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{similarCar.name}</h4>
                            <p className="text-sm text-gray-400">By @{similarCar.owner}</p>
                            <div className="flex items-center gap-1 text-sm mt-1">
                              <Heart className="h-3 w-3 text-primary" fill="currentColor" />
                              <span>{similarCar.likes}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}