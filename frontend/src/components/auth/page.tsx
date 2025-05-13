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
import { useUser } from '../usercontext';
import { getUserRegion } from '../getLocation';
import { useLocation } from "react-router-dom";

export default function AuthPage() {
  // Use React Router's useSearchParams hook
  const { isLoading, login, setLoading, setError } = useUser();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); 
  const [errorMessage, setErrorMessage] = useState("");
  
  // Get the signup parameter from the URL
  const showSignup = searchParams.get("signup") === "true";
  const [activeTab, setActiveTab] = useState(showSignup ? "signup" : "login");
  
  const location = useLocation();
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"success" | "error" | null>(null);
  
  // Handle verification messages
  useEffect(() => {
    if (location.state && 
        'verificationMessage' in location.state && 
        'verificationStatus' in location.state) {
      setVerificationMessage(location.state.verificationMessage as string);
      setVerificationStatus(location.state.verificationStatus as "success" | "error");
      
      // Clear the message after 5 seconds
      const timer = setTimeout(() => {
        setVerificationMessage(null);
        setVerificationStatus(null);
        
        // Clear the location state to prevent showing the message again on refresh
        window.history.replaceState({}, document.title);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location]);

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
    setErrorMessage("");
    setError(null);
  }, [activeTab, setError]);

  // Simplified login handler
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Set loading state
    setLoading(true);
    setErrorMessage(""); // Clear any previous error messages
    
    try {
      // Get form data
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      
      console.log("Attempting login with:", { email });
      
      // Make API call
      const response = await fetch('https://api.benchracershq.com/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      // Parse the response data
      const data = await response.json();
      console.log("Login response:", data);
      
      if (!response.ok) {
        // Handle specific error codes
        if (data.errorCode === 'EMAIL_NOT_VERIFIED') {
          setErrorMessage("Please verify your email before logging in. Check your inbox for a verification email.");
        } else if (data.errorCode === 'INVALID_CREDENTIALS') {
          setErrorMessage('Invalid email or password.');
        } else if (data.errorCode === 'MISSING_FIELDS') {
          setErrorMessage('Email and password are required.');
        } else {
          setErrorMessage(data.message || 'Login failed');
        }
        setError(data.message || 'Login failed');
        setLoading(false);
        return;
      }
      
      // Handle successful login
      if (data.success && data.token) {
        console.log("Login successful, user data:", data.user);
        
        // Call the login function from context with user data and token
        login(data.user, data.token);
        
        // Navigate to home page
        navigate('/');
      } else {
        setErrorMessage('Invalid response from server');
        setError('Invalid response from server');
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Simplified signup handler
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setLoading(true);
    setErrorMessage("");
    
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      setLoading(false);
      return;
    }
    
    try {
      // Get form data
      const formData = new FormData(e.currentTarget);
      const email = formData.get('signup-email') as string;
      const name = formData.get('name') as string;
      
      // Get user's region
      const region = await getUserRegion();
      console.log("User region:", region);
      
      // Make API call with region included
      const response = await fetch('https://api.benchracershq.com/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, password, region }),
      });
    
      // Parse the response data
      const data = await response.json();
      console.log("Signup response:", data);
      
      if (!response.ok) {
        // Handle specific error codes
        if (data.errorCode === 'USER_EXISTS') {
          setErrorMessage('An account with this email already exists.');
        } else if (data.errorCode === 'USER_EXISTS_NOT_VERIFIED') {
          setErrorMessage('An account with this email already exists but is not verified. A new verification email has been sent.');
        } else if (data.errorCode === 'WEAK_PASSWORD') {
          setErrorMessage('Password must be at least 8 characters long.');
        } else if (data.errorCode === 'MISSING_FIELDS') {
          setErrorMessage('All fields are required.');
        } else {
          setErrorMessage(data.message || 'Signup failed');
        }
        setError(data.message || 'Signup failed');
        setLoading(false);
        return;
      }
      
      // Handle successful signup
      if (data.success && data.user && data.token) {
        // Store the token and user data
        login(data.user, data.token);
        
        // Show success alert
        alert("Account created successfully! Please check your email to verify your account.");
      } else {
        setErrorMessage('Invalid response from server');
        setError('Invalid response from server');
      }
    } catch (error) {
      console.error("Signup error:", error);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
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
          
          {verificationMessage && (
            <div className={`mb-4 p-3 rounded text-sm ${
              verificationStatus === "success" 
                ? "bg-green-800 text-green-100 border border-green-700" 
                : "bg-red-900 text-red-100 border border-red-800"
            }`}>
              {verificationMessage}
            </div>
          )}

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
                    <Input id="email" name="email" className="text-black" type="email" placeholder="your@email.com" required />
                  </div>
                  <div className="space-y-2 text-white">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Input id="password" name="password" className="text-black" type="password" required />
                  </div>
                  <div className="flex items-center"> 
                    {errorMessage && (
                      <p className="text-red-500 text-sm font-medium mb-2">{errorMessage}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2 text-white">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" className="text-black" placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2 text-white">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input 
                      id="signup-email" 
                      name="signup-email" 
                      type="email" 
                      className="text-black"
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