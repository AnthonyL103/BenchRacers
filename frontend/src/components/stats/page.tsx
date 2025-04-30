import { Navbar } from "../navbar"
import { Footer } from "../footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { BarChart, LineChart, PieChart } from "lucide-react"

export default function StatsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Stats & Comparisons</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Analyze how your builds compare to others and track your performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Total Votes</CardTitle>
                <BarChart className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">1,788</div>
                <p className="text-sm text-green-500">+12% from last month</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Average Rating</CardTitle>
                <PieChart className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">8.7/10</div>
                <p className="text-sm text-green-500">+0.3 from last month</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Best Ranking</CardTitle>
                <LineChart className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">#5</div>
                <p className="text-sm text-gray-400">in Honda category</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="compare" className="mb-12">
            <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-8">
              <TabsTrigger value="compare">Compare Builds</TabsTrigger>
              <TabsTrigger value="trends">Community Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="compare">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Build Comparison</CardTitle>
                  <CardDescription>Compare your build against others in the same category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Your Car</label>
                        <Select defaultValue="honda">
                          <SelectTrigger>
                            <SelectValue placeholder="Select your car" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="honda">Honda S2000</SelectItem>
                            <SelectItem value="toyota">Toyota Supra MK4</SelectItem>
                            <SelectItem value="nissan">Nissan 370Z</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Compare Against</label>
                        <Select defaultValue="category">
                          <SelectTrigger>
                            <SelectValue placeholder="Select comparison" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="category">Category Average</SelectItem>
                            <SelectItem value="top10">Top 10 in Category</SelectItem>
                            <SelectItem value="specific">Specific Build</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="pt-4">
                        <Badge className="mb-2">Honda S2000</Badge>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Horsepower</span>
                              <span>240 hp</span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full">
                              <div className="h-2 bg-primary rounded-full" style={{ width: "60%" }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Aesthetics</span>
                              <span>8.4/10</span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full">
                              <div className="h-2 bg-primary rounded-full" style={{ width: "84%" }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Performance</span>
                              <span>7.9/10</span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full">
                              <div className="h-2 bg-primary rounded-full" style={{ width: "79%" }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Uniqueness</span>
                              <span>9.2/10</span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full">
                              <div className="h-2 bg-primary rounded-full" style={{ width: "92%" }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 md:pt-0">
                      <Badge variant="outline" className="mb-2">
                        Category Average
                      </Badge>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Horsepower</span>
                            <span>280 hp</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full">
                            <div className="h-2 bg-gray-500 rounded-full" style={{ width: "70%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Aesthetics</span>
                            <span>7.8/10</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full">
                            <div className="h-2 bg-gray-500 rounded-full" style={{ width: "78%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Performance</span>
                            <span>8.1/10</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full">
                            <div className="h-2 bg-gray-500 rounded-full" style={{ width: "81%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Uniqueness</span>
                            <span>7.5/10</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full">
                            <div className="h-2 bg-gray-500 rounded-full" style={{ width: "75%" }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 p-4 bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-2">Analysis</h4>
                        <p className="text-sm text-gray-300">
                          Your Honda S2000 scores higher than average in aesthetics and uniqueness, but slightly lower
                          in performance. Consider focusing on performance mods to improve your overall ranking.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Community Trends</CardTitle>
                  <CardDescription>See what's popular in the community right now</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-medium mb-4">Most Popular Modifications</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Aftermarket Exhaust</span>
                            <span>78%</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full">
                            <div className="h-2 bg-primary rounded-full" style={{ width: "78%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Coilovers/Suspension</span>
                            <span>72%</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full">
                            <div className="h-2 bg-primary rounded-full" style={{ width: "72%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Wheels/Tires</span>
                            <span>65%</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full">
                            <div className="h-2 bg-primary rounded-full" style={{ width: "65%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>ECU Tuning</span>
                            <span>58%</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full">
                            <div className="h-2 bg-primary rounded-full" style={{ width: "58%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Body Kits</span>
                            <span>45%</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full">
                            <div className="h-2 bg-primary rounded-full" style={{ width: "45%" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-4">Trending Categories</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>JDM</span>
                            <span>+12%</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full">
                            <div className="h-2 bg-green-500 rounded-full" style={{ width: "85%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Track Builds</span>
                            <span>+8%</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full">
                            <div className="h-2 bg-green-500 rounded-full" style={{ width: "75%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>European Luxury</span>
                            <span>+5%</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full">
                            <div className="h-2 bg-green-500 rounded-full" style={{ width: "65%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>American Muscle</span>
                            <span>+3%</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full">
                            <div className="h-2 bg-green-500 rounded-full" style={{ width: "55%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Stanced</span>
                            <span>-2%</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full">
                            <div className="h-2 bg-red-500 rounded-full" style={{ width: "40%" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>How your builds perform over time</CardDescription>
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
        </div>
      </main>
      <Footer />
    </div>
  )
}
