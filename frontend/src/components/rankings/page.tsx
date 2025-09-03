import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Navbar } from "../utils/navbar"
import { Footer } from "../utils/footer"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { ArrowUp, Heart, Trophy, Loader2, Crown, Medal, Award, TrendingUp, Star } from "lucide-react"
import { getS3ImageUrl } from "../utils/s3helper"
import axios from 'axios';

interface RankingsCar {
  entryID: number;
  carName: string;
  carMake: string;
  carModel: string;
  upvotes: number;
  allPhotoKeys: string[];
  mainPhotoKey?: string;
  userName: string;
  profilephotokey?: string;
  userID: string;
  totalMods?: number;
  totalCost?: number;
  region?: string;
  category?: string;
  horsepower?: number;
  torque?: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: RankingsCar[];
  count: number;
}

export default function RankingsPage() {
  const [topCars, setTopCars] = useState<RankingsCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchTopCars();
  }, []);

  const fetchTopCars = async () => {
    try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const response = await axios.get('https://api.benchracershq.com/api/rankings/top10', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
        });

        const { success, data, message } = response.data;

        if (!success) {
        throw new Error(message || 'Failed to fetch rankings');
        }

        setTopCars(data);
    } catch (err) {
        console.error('Error fetching rankings:', err);
        setError('Failed to load rankings. Please try again.');
    } finally {
        setLoading(false);
    }
    };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="border-b border-gray-800 bg-gray-900">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Rankings
            </h1>
            <p className="text-gray-400 mt-2">See how car builds stack up against each other</p>
          </div>
        </div>
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-yellow-500" />
              <p className="text-gray-400">Loading rankings...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="border-b border-gray-800 bg-gray-900">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Rankings
            </h1>
          </div>
        </div>
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md mx-auto">
                <p className="text-red-400 mb-4">{error}</p>
                <button 
                  onClick={fetchTopCars}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const top3 = topCars.slice(0, 3);
  const leaderboard = topCars.slice(3, 10);

  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400 fill-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-amber-600 fill-amber-600" />;
      default: return <Star className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch(rank) {
      case 1: return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black";
      case 2: return "bg-gradient-to-r from-gray-300 to-gray-500 text-black";
      case 3: return "bg-gradient-to-r from-amber-500 to-amber-700 text-black";
      default: return "bg-gray-700 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      
      {/* Header Section */}
      <div className="border-b border-gray-800 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex justify-center items-center gap-4 mb-4">
              <Trophy className="h-12 w-12 text-yellow-500 animate-pulse" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
                Rankings
              </h1>
              <Trophy className="h-12 w-12 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Discover the most loved car builds in the community
            </p>
            
            {/* Stats Bar */}
            <div className="flex justify-center gap-6 mt-6">
              <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2">
                <span className="text-yellow-500 font-bold text-lg">{topCars.length}</span>
                <span className="text-gray-400 text-sm ml-1">Ranked Cars</span>
              </div>
              <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2">
                <span className="text-red-500 font-bold text-lg">
                  {topCars.reduce((sum, car) => sum + car.upvotes, 0).toLocaleString()}
                </span>
                <span className="text-gray-400 text-sm ml-1">Total Votes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="py-8">
        <div className="container mx-auto px-4">
          
          {/* Podium Section */}
          {top3.length >= 3 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white text-center mb-8 flex items-center justify-center gap-2">
                <TrendingUp className="h-6 w-6 text-yellow-500" />
                Top 3 Champions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* 2nd Place */}
                <div className="order-2 md:order-1">
                  <Card className="bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden group">
                    <div className="relative h-72">
                      <img
                        src={top3[1]?.mainPhotoKey 
                          ? getS3ImageUrl(top3[1]?.mainPhotoKey) 
                          : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(top3[1]?.carName)}`
                        }
                        alt={top3[1]?.carName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                      
                      {/* Rank Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge className={`${getRankBadgeColor(2)} font-bold text-lg px-4 py-2 shadow-lg`}>
                          <Medal className="h-5 w-5 mr-2" />
                          2nd Place
                        </Badge>
                      </div>
                      
                      {/* User Info */}
                      <div className="absolute top-4 right-4">
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full px-3 py-2">
                          <Avatar className="h-8 w-8 ring-2 ring-white/30">
                            <AvatarImage 
                              src={top3[1]?.profilephotokey ? getS3ImageUrl(top3[1]?.profilephotokey) : undefined}
                              alt={`${top3[1]?.userName}'s profile`}
                            />
                            <AvatarFallback className="bg-gray-600 text-white text-sm">
                              {top3[1]?.userName?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white text-sm font-medium">@{top3[1]?.userName}</span>
                        </div>
                      </div>
                      
                      {/* Vote Count */}
                      <div className="absolute bottom-4 right-4">
                        <div className="flex items-center gap-2 bg-red-500/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                          <Heart className="h-5 w-5 text-white" fill="currentColor" />
                          <span className="text-white font-bold">{top3[1]?.upvotes?.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {/* Car Info */}
                      <div className="absolute bottom-4 left-4 max-w-[60%] pr-4">
                        <h3 className="text-white font-bold text-xl mb-1 drop-shadow-lg break-words leading-tight">{top3[1]?.carName}</h3>
                        <p className="text-gray-200 text-sm drop-shadow-md break-words">
                          {top3[1]?.carMake} {top3[1]?.carModel}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* 1st Place - Larger and centered */}
                <div className="order-1 md:order-2">
                  <div className="relative">
                    
                    <Card className="bg-gradient-to-b from-yellow-900/30 to-gray-900 border-yellow-500/50 hover:border-yellow-400 transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-yellow-500/20 overflow-hidden group relative z-10">
                      <div className="relative h-80">
                        <img
                          src={top3[0]?.mainPhotoKey 
                            ? getS3ImageUrl(top3[0]?.mainPhotoKey) 
                            : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(top3[0]?.carName)}`
                          }
                          alt={top3[0]?.carName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        
                        {/* Winner Glow */}
                        <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/50 via-transparent to-yellow-900/30" />
                        
                        {/* Rank Badge */}
                        <div className="absolute top-4 left-4">
                          <Badge className={`${getRankBadgeColor(1)} font-bold text-xl px-6 py-3 shadow-xl animate-pulse`}>
                            <Crown className="h-6 w-6 mr-2" />
                            CHAMPION
                          </Badge>
                        </div>
                        
                        {/* User Info */}
                        <div className="absolute top-4 right-4">
                          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-full px-4 py-3">
                            <Avatar className="h-10 w-10 ring-2 ring-yellow-500/50">
                              <AvatarImage 
                                src={top3[0]?.profilephotokey ? getS3ImageUrl(top3[0]?.profilephotokey) : undefined}
                                alt={`${top3[0]?.userName}'s profile`}
                              />
                              <AvatarFallback className="bg-yellow-600 text-black font-bold">
                                {top3[0]?.userName?.charAt(0)?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-white font-semibold">@{top3[0]?.userName}</span>
                          </div>
                        </div>
                        
                        {/* Vote Count */}
                        <div className="absolute bottom-4 right-4">
                          <div className="flex items-center gap-2 bg-red-500 backdrop-blur-sm rounded-full px-5 py-3 shadow-xl">
                            <Heart className="h-6 w-6 text-white animate-pulse" fill="currentColor" />
                            <span className="text-white font-bold text-lg">{top3[0]?.upvotes?.toLocaleString()}</span>
                          </div>
                        </div>
                        
                        {/* Car Info */}
                        <div className="absolute bottom-4 left-4 max-w-[60%] pr-4">
                          <h3 className="text-white font-bold text-2xl mb-1 drop-shadow-lg break-words leading-tight">{top3[0]?.carName}</h3>
                          <p className="text-gray-200 drop-shadow-md break-words text-sm">
                            {top3[0]?.carMake} {top3[0]?.carModel}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="order-3">
                  <Card className="bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden group">
                    <div className="relative h-72">
                      <img
                        src={top3[2]?.mainPhotoKey 
                          ? getS3ImageUrl(top3[2]?.mainPhotoKey) 
                          : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(top3[2]?.carName)}`
                        }
                        alt={top3[2]?.carName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                      
                      {/* Rank Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge className={`${getRankBadgeColor(3)} font-bold text-lg px-4 py-2 shadow-lg`}>
                          <Award className="h-5 w-5 mr-2" />
                          3rd Place
                        </Badge>
                      </div>
                      
                      {/* User Info */}
                      <div className="absolute top-4 right-4">
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full px-3 py-2">
                          <Avatar className="h-8 w-8 ring-2 ring-white/30">
                            <AvatarImage 
                              src={top3[2]?.profilephotokey ? getS3ImageUrl(top3[2]?.profilephotokey) : undefined}
                              alt={`${top3[2]?.userName}'s profile`}
                            />
                            <AvatarFallback className="bg-gray-600 text-white text-sm">
                              {top3[2]?.userName?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white text-sm font-medium">@{top3[2]?.userName}</span>
                        </div>
                      </div>
                      
                      {/* Vote Count */}
                      <div className="absolute bottom-4 right-4">
                        <div className="flex items-center gap-2 bg-red-500/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                          <Heart className="h-5 w-5 text-white" fill="currentColor" />
                          <span className="text-white font-bold">{top3[2]?.upvotes?.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {/* Car Info */}
                      <div className="absolute bottom-4 left-4 max-w-[60%] pr-4">
                        <h3 className="text-white font-bold text-xl mb-1 drop-shadow-lg break-words leading-tight">{top3[2]?.carName}</h3>
                        <p className="text-gray-200 text-sm drop-shadow-md break-words">
                          {top3[2]?.carMake} {top3[2]?.carModel}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Section */}
          {leaderboard.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white text-center mb-8 flex items-center justify-center gap-2">
                <Trophy className="h-6 w-6 text-gray-400" />
                Full Leaderboard
              </h2>
              
              <Card className="bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700 overflow-hidden">
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {leaderboard.map((car, i) => (
                      <Link href={`/garage/${car.entryID}`} key={car.entryID}>
                        <div className="flex items-center gap-4 p-4 border-b border-gray-700 last:border-b-0 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer group">
                          {/* Rank Number */}
                          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full border border-gray-600 group-hover:border-gray-500 transition-colors">
                            <span className="font-bold text-lg text-white">#{i + 4}</span>
                          </div>
                          
                          {/* Car Image */}
                          <div className="relative w-20 h-16 rounded-lg overflow-hidden border border-gray-600 group-hover:border-gray-500 transition-colors">
                            <img
                              src={car?.mainPhotoKey 
                                ? getS3ImageUrl(car?.mainPhotoKey) 
                                : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(car?.carName)}`
                              }
                              alt={car?.carName}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                          </div>
                          
                          {/* Car Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-lg group-hover:text-yellow-400 transition-colors truncate">
                              {car.carName}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {car.carMake} {car.carModel}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Avatar className="h-6 w-6 ring-1 ring-gray-600">
                                <AvatarImage 
                                  src={car?.profilephotokey ? getS3ImageUrl(car?.profilephotokey) : undefined}
                                  alt={`${car?.userName}'s profile`}
                                />
                                <AvatarFallback className="bg-gray-600 text-white text-xs">
                                  {car?.userName?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-gray-400 text-sm">@{car.userName}</span>
                            </div>
                          </div>
                          
                          {/* Stats */}
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1">
                              <Heart className="h-4 w-4 text-red-500" fill="currentColor" />
                              <span className="text-white font-semibold">{car.upvotes?.toLocaleString()}</span>
                            </div>
                            
                            {/* Performance badges */}
                            <div className="flex gap-1">
                              {car.horsepower && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5 text-orange-300 border-orange-400/30 bg-orange-500/10">
                                  {car.horsepower} HP
                                </Badge>
                              )}
                              {car.totalMods && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5 text-blue-300 border-blue-400/30 bg-blue-500/10">
                                  {car.totalMods} mods
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Trend indicator placeholder */}
                          <div className="w-8 text-center">
                            <div className="w-2 h-2 bg-gray-600 rounded-full mx-auto"></div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty State */}
          {topCars.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 max-w-md mx-auto">
                <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Rankings Yet</h3>
                <p className="text-gray-400 mb-4">Cars will appear here once they start receiving votes!</p>
                <p className="text-sm text-gray-500">
                  Be the first to explore and vote for amazing builds
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      
    </div>
  );
}