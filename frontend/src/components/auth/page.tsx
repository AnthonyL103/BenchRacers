import { useState, useEffect } from "react"
import { Link, useSearchParams, useNavigate } from "react-router-dom"
import { Navbar } from "../navbar"
import { Footer } from "../footer"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Car, Github, ChromeIcon as Google } from "lucide-react"

export default function AuthPage() {
  // Use React Router's useSearchParams hook
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get the signup parameter from the URL
  const showSignup = searchParams.get("signup") === "true";
  const [activeTab, setActiveTab] = useState(showSignup ? "signup" : "login");

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab === "signup") {
      navigate("/auth?signup=true", { replace: true });
    } else {
      navigate("/auth", { replace: true });
    }
  }, [activeTab, navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Car className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Welcome to Bench Racers</h1>
            <p className="text-gray-400 mt-2">The ultimate car enthusiast community</p>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="mt-4">
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </TabsContent>
                <TabsContent value="signup" className="mt-4">
                  <CardDescription>Create a new account to join our community</CardDescription>
                </TabsContent>
              </Tabs>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeTab === "login" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your@email.com" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Input id="password" type="password" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="your@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full">{activeTab === "login" ? "Login" : "Create Account"}</Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-gray-900 px-2 text-gray-400">or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="gap-2">
                  <Google className="h-4 w-4" />
                  Google
                </Button>
                <Button variant="outline" className="gap-2">
                  <Github className="h-4 w-4" />
                  GitHub
                </Button>
              </div>

              <div className="text-center text-sm text-gray-400 mt-2">
                {activeTab === "login" ? (
                  <p>
                    Don't have an account?{" "}
                    <Link to="/auth?signup=true" className="text-primary hover:underline">
                      Sign up
                    </Link>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <Link to="/auth" className="text-primary hover:underline">
                      Login
                    </Link>
                  </p>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}