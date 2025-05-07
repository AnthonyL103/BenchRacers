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
import { useUser, UserActionTypes } from '../usercontext';
import { getUserRegion } from '../getLocation';

export default function AuthPage() {
  // Use React Router's useSearchParams hook
  const { isLoading, error, dispatch } = useUser();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); 
  const [errorMessage, setErrorMessage] = useState("");
  
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
  
  // Clear error when switching tabs
  useEffect(() => {
    dispatch({ type: UserActionTypes.CLEAR_ERROR });
  }, [activeTab, dispatch]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // First dispatch LOGIN_REQUEST to set loading state
    dispatch({ type: UserActionTypes.LOGIN_REQUEST });
    
    try {
      // Get form data
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      
      // Make API call
      const response = await fetch('https://api.benchracershq.com/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      // Handle successful login
      const userData = await response.json();
      
      // Dispatch LOGIN_SUCCESS with the user data
      dispatch({ 
        type: UserActionTypes.LOGIN_SUCCESS, 
        payload: userData 
      });
      
      // Optionally store JWT token if your API returns one
      if (userData.token) {
        localStorage.setItem('token', userData.token);
      }
      
      // Navigate to dashboard on successful login
      navigate('/dashboard');
      
    } catch (error) {
      // Dispatch LOGIN_FAILURE with the error message
      dispatch({ 
        type: UserActionTypes.LOGIN_FAILURE, 
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };
  
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    dispatch({ type: UserActionTypes.REGISTER_REQUEST });
    
    if (password !== confirmPassword) {
      dispatch({ 
        type: UserActionTypes.REGISTER_FAILURE, 
        payload: "Passwords do not match" 
      });
      setErrorMessage("Passwords do not match");
      
      return;
    }
    
    try {
      // Get form data
      const formData = new FormData(e.currentTarget);
      const email = formData.get('signup-email') as string;
      const name = formData.get('name') as string;
      
      // Get user's region
      const region = await getUserRegion();
      console.log(region);
      
      // Make API call with region included
      const response = await fetch('https://api.benchracershq.com/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, password, region }),
      });
    
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Signup failed');
      }
      
      const userData = await response.json();
      dispatch({ 
        type: UserActionTypes.REGISTER_SUCCESS, 
        payload: userData 
      });
      
      // Navigate to dashboard on successful signup
      setErrorMessage("");
      navigate('/dashboard');
      
    } catch (error) {
      dispatch({ 
        type: UserActionTypes.REGISTER_FAILURE, 
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };

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
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2 text-white">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="your@email.com" required />
                  </div>
                  <div className="space-y-2 text-white">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Input id="password" name="password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2 text-white">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2 text-white">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input 
                      id="signup-email" 
                      name="signup-email" 
                      type="email" 
                      placeholder="your@email.com" 
                      required 
                    />
                  </div>
                  <div className="space-y-2 text-white">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input 
                      id="signup-password" 
                      name="signup-password"
                      value={password} 
                      className="text-black"
                      onChange={(e) => setPassword(e.target.value)} 
                      type="password" 
                      required
                    />
                  </div>
                  <div className="space-y-2 text-white">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input 
                      id="confirm-password" 
                      name="confirm-password"
                      value={confirmPassword} 
                      className="text-black"
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      type="password" 
                      required
                    />
                  </div>
                  <div className="flex items-center"> 
                  {errorMessage && (
                    <p className="text-red-500 text-sm font-medium mb-2">{errorMessage}</p>
                    )}
                  </div>
                 
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-gray-900 px-2 text-gray-400">or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="gap-2" type="button">
                  <Google className="h-4 w-4" />
                  Google
                </Button>
                <Button variant="outline" className="gap-2" type="button">
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