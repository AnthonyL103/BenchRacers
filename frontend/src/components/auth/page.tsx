import { useState, useEffect, use } from "react"
import { Link, useSearchParams, useNavigate } from "react-router-dom"
import { Navbar } from "../utils/navbar"
import { Footer } from "../utils/footer"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Car, Github, ChromeIcon as Google } from "lucide-react"
import { useUser } from '../contexts/usercontext';
import { getUserRegion } from '../utils/getLocation';
import { useLocation } from "react-router-dom";
import {Home, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"

export default function AuthPage() {
  const { isLoading, login, setLoading, setError } = useUser();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); 
  const [errorMessage, setErrorMessage] = useState("");
  
  const showSignup = searchParams.get("signup") === "true";
  const [activeTab, setActiveTab] = useState(showSignup ? "signup" : "login");
  
  const [showPassword, setshowPassword] = useState(false);
  const [showloginPassword, setshowloginPassword] = useState(false);
  
  const [showTerms, setShowTerms] = useState(false);
  const [hasAcceptedTerms, sethasAcceptedTerms] = useState(false);
  
  
  const location = useLocation();
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"success" | "error" | null>(null);
  const [pendingFormData, setPendingFormData] = useState<{email: string, name: string} | null>(null);

  const passwordValidations = {
        hasLength: password.length >= 8,
        hasCapital: /[A-Z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecial: /[!@#$%^&*]/.test(password),
    };
  
  useEffect(() => {
    if (location.state && 
        'verificationMessage' in location.state && 
        'verificationStatus' in location.state) {
      setVerificationMessage(location.state.verificationMessage as string);
      setVerificationStatus(location.state.verificationStatus as "success" | "error");
      
      const timer = setTimeout(() => {
        setVerificationMessage(null);
        setVerificationStatus(null);
        
        window.history.replaceState({}, document.title);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location]);

  useEffect(() => {
    if (activeTab === "signup") {
      navigate("/auth?signup=true", { replace: true });
    } else {
      navigate("/auth", { replace: true });
    }
  }, [activeTab, navigate]);
  
  useEffect(() => {
    setErrorMessage("");
    setError(null);
  }, [activeTab, setError]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setLoading(true);
    setErrorMessage(""); 
    
    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      
      console.log("Attempting login with:", { email });
      
      const response = await fetch('https://api.benchracershq.com/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      console.log("Login response:", data);
      
      if (!response.ok) {
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
      
      if (data.success && data.token) {
        console.log("Login successful, user data:", data.user);
        
        login(data.user, data.token);
        
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
  
const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  
  setLoading(true);
  setErrorMessage("");
  
  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
      setErrorMessage("Password must be at least 8 characters long and include at least one number and one special character.");
      setLoading(false);
      return;
  }
  
  if (password !== confirmPassword) {
    setErrorMessage("Passwords do not match");
    setLoading(false);
    return;
  }
  
  const formData = new FormData(e.currentTarget);
  const email = formData.get('signup-email') as string;
  const name = formData.get('name') as string;
  
  if (!hasAcceptedTerms) {
      setPendingFormData({ email, name }); 
      setShowTerms(true);
      return;
  }
  
  await proceedWithSignup(email, name);
};

const proceedWithSignup = async (email: string, name: string) => {
  console.log("Signup initiated with password:", password);

  try {
    const region = await getUserRegion();
    console.log("User region:", region);
    
    const response = await fetch('https://api.benchracershq.com/api/users/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name, password, region }),
    });

    const data = await response.json();
    console.log("Signup response:", data);
    
    if (!response.ok) {
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
    
    if (data.success && data.user && data.token) {
      login(data.user, data.token);
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
    <div className="flex flex-col h-screen overflow-hidden bg-black">
      
      <main className="relative h-full w-full">
        <div className="fixed inset-0 z-0">

            <img
            src="/cars-6248512_1920.jpg"
            alt="Featured car"
            className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0" />
        </div>
  
  <div className="relative z-20 min-h-screen flex items-center justify-center  px-4 sm:px-6 lg:px-8">
    <div className="w-full max-w-md space-y-8">
      
      
      {verificationMessage && (
        <div className={`mb-2 p-3 rounded text-sm ${
          verificationStatus === "success" 
            ? "bg-green-800 text-green-100 border border-green-700" 
            : "bg-red-900 text-red-100 border border-red-800"
        }`}>
          {verificationMessage}
        </div>
      )}

     <Card
        className="
        absolute fixed z-10 
        top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        w-[calc(100vw-2rem)] max-w-md sm:w-[calc(100vw-3rem)] sm:max-w-lg md:w-[calc(100vw-4rem)] md:max-w-xl lg:max-w-2xl
        bg-gray-950 border border-gray-950
        rounded-xl shadow-lg 
        max-h-[90vh] overflow-y-auto
        transition-all duration-200
    "
        >
        {/* Home Button */}
       

        <CardHeader className="p-4">
            <div className="flex mb-2 flex-row justify-between gap-2 align-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Welcome to Bench Racers
            </h1>
             <Link
                    to="/"
                >
                    <Car className="h-12 w-12 text-primary hover:text-white" />
                </Link>
            </div>

            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" >
                <CardDescription className="text-white">Enter your credentials to access your account</CardDescription>
            </TabsContent>
            <TabsContent value="signup"  >
                <CardDescription className="text-white">Create a new account to join our community</CardDescription>
            </TabsContent>
            </Tabs>
        </CardHeader>
            <CardContent className="space-y-2 px-4">
                
              {activeTab === "login" ? (
                <form onSubmit={handleLogin} className="space-y-2">
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
                    <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        className="text-black" 
                        type={showloginPassword ? "text" : "password"}
                        required
                    />

                    <button
                        type="button"
                        onClick={() => setshowloginPassword(!showloginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                        {showloginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    </div>
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
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <div className="space-y-1 text-white">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" className="text-black" placeholder="John Doe" required />
                    </div>
                    <div className="space-y-1 text-white">
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
                    </div>

                    <div className="space-y-2">
                    <div className="relative space-y-1 text-white">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input 
                        id="signup-password" 
                        name="signup-password"
                        value={password} 
                        className="text-black pr-10" // give space for the eye icon
                        onChange={(e) => setPassword(e.target.value)} 
                        type={showPassword ? "text" : "password"}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setshowPassword(!showPassword)}
                        className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    </div>

                    <div className="space-y-1 text-white">
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
                    </div>
                </div>
                
                <div className="space-y-1 text-sm">
                                <div className="flex items-center">
                                    {passwordValidations.hasLength ? (
                                        <CheckCircle className="text-green-500 mr-2" size={16} />
                                    ) : (
                                        <XCircle className="text-red-500 mr-2" size={16} />
                                    )}
                                    <span className="text-white">At least 8 characters</span>
                                </div>
                                <div className="flex items-center">
                                    {passwordValidations.hasCapital ? (
                                        <CheckCircle className="text-green-500 mr-2" size={16} />
                                    ) : (
                                        <XCircle className="text-red-500 mr-2" size={16} />
                                    )}
                                    <span className="text-white">One uppercase letter</span>
                                </div>
                                <div className="flex items-center">
                                    {passwordValidations.hasNumber ? (
                                        <CheckCircle className="text-green-500 mr-2" size={16} />
                                    ) : (
                                        <XCircle className="text-red-500 mr-2" size={16} />
                                    )}
                                    <span className="text-white">One number</span>
                                </div>
                                <div className="flex items-center">
                                    {passwordValidations.hasSpecial ? (
                                        <CheckCircle className="text-green-500 mr-2" size={16} />
                                    ) : (
                                        <XCircle className="text-red-500 mr-2" size={16} />
                                    )}
                                    <span className="text-white">One special character (!@#$...)</span>
                                </div>
                    </div>
                
                {/* Error message and button stay full width */}
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
            <CardFooter className="flex flex-col ">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-gray-900 px-2 text-gray-400">or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <Button variant="outline" className="gap-2" type="button">
                  <Google className="h-4 w-4" />
                  Google
                </Button>
                <Button variant="outline" className="gap-2" type="button">
                  <Github className="h-4 w-4" />
                  GitHub
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
        </div>
      </main>
     
      
      {showTerms && (
  <Dialog open={showTerms} onOpenChange={setShowTerms}>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-700 text-white">
      <DialogHeader>
        <DialogTitle className="text-2xl text-white">Terms and Conditions</DialogTitle>
        <DialogDescription asChild>
          <div className="prose prose-invert max-w-none text-white space-y-4 text-sm mt-4">
            <p><strong>Effective Date:</strong> August 6, 2025</p>

            <p>Welcome to Bench Racers, a community-driven platform where car enthusiasts share builds, discover new ideas, and connect through a shared passion for cars. These Terms and Conditions (“Terms”) explain your rights and responsibilities when using our site. By accessing or using Bench Racers, you agree to these Terms.</p>

            <h2>1. Who Can Use Bench Racers</h2>
            <p>You must be at least 13 years old. If you're under 18, you need parental or guardian permission.</p>

            <h2>2. Your Account</h2>
            <p>You are responsible for safeguarding your login information and all activity under your account.</p>

            <h2>3. Your Content and How It’s Used</h2>
            <p>You own the content you share. By posting, you grant us a non-exclusive, royalty-free license to use your content for platform operations and community discovery. Deleted content may remain anonymized for internal analysis.</p>

            <h2>4. How We Use Your Data</h2>
            <p>We collect data to operate and improve the platform. Data may be stored in the U.S. or other regions. We use cookies for analytics.</p>

            <h2>5. Community Guidelines</h2>
            <p>Prohibited behavior includes hate speech, illegal content, impersonation, and spam. We reserve the right to remove content or suspend accounts at our discretion.</p>

            <h2>6. Copyright Complaints (DMCA)</h2>
            <p>Submit copyright concerns to <a href="mailto:support@benchracershq.com" className="text-blue-400">support@benchracershq.com</a>. We comply with the DMCA.</p>

            <h2>7. Dispute Resolution</h2>
            <p>Disputes must attempt informal resolution first. Remaining disputes will be resolved via arbitration or small claims court in California.</p>

            <h2>8. Protecting Each Other</h2>
            <p>You agree to hold us harmless from legal claims resulting from your activity on the site.</p>

            <h2>9. Beta Notice</h2>
            <p>Features may change or be unavailable during our beta phase.</p>

            <h2>10. Limitation of Liability</h2>
            <p>We provide the platform “as is” and are not liable for damages from its use.</p>

            <h2>11. Updates to These Terms</h2>
            <p>We may revise Terms. Continued use indicates acceptance. Material changes will be communicated via email or on-site notification.</p>

            <h2>12. Accessibility and Inclusion</h2>
            <p>We aim to make the platform accessible. Contact <a href="mailto:support@benchracershq.com" className="text-blue-400">support@benchracershq.com</a> with any concerns.</p>

            <h2>13. Governing Law</h2>
            <p>These Terms are governed by the laws of California.</p>

            <h2>14. Contact Us</h2>
            <p>Email: <a href="mailto:support@benchracershq.com" className="text-blue-400">support@benchracershq.com</a></p>
          </div>
        </DialogDescription>
      </DialogHeader>
      
      <DialogHeader>
        <DialogTitle className="text-2xl text-white">Privacy Policy</DialogTitle>
        <DialogDescription asChild>
          <div className="prose prose-invert max-w-none text-white space-y-4 text-sm mt-4">
            <p><strong>Effective Date:</strong> August 6, 2025</p>

            <p>Your privacy matters to us. This Privacy Policy explains how Bench Racers collects, uses, and protects your data.</p>

            <h2>1. What We Collect</h2>
            <ul>
              <li>Account information, content submissions, car data, VIN decoding</li>
              <li>Usage data (likes, visits), browser/device info, general location</li>
              <li>Cookies and analytics data</li>
            </ul>

            <h2>2. How We Use It</h2>
            <ul>
              <li>To operate and improve the platform</li>
              <li>To analyze trends and usage behavior (anonymized)</li>
              <li>To moderate content and ensure safety</li>
            </ul>

            <h2>3. Cookies and Tracking</h2>
            <p>We use cookies for preferences and analytics. You can control cookies through your browser settings.</p>

            <h2>4. Data Sharing</h2>
            <p>We do not sell personal information. Data may be shared with service providers or included in anonymized reports.</p>

            <h2>5. Data Storage</h2>
            <p>Your data is stored securely in the US or where our providers operate. We apply reasonable safeguards to protect your information.</p>

            <h2>6. Your Rights</h2>
            <p>You may access, edit, or delete your data. Contact us at <a href="mailto:support@benchracershq.com" className="text-blue-400">support@benchracershq.com</a> to request account deletion or changes.</p>

            <h2>7. Children’s Privacy</h2>
            <p>This platform is not intended for children under 13. We do not knowingly collect data from children.</p>

            <h2>8. Third-Party Links</h2>
            <p>We are not responsible for the privacy practices of other websites linked on our platform.</p>

            <h2>9. Policy Updates</h2>
            <p>We may revise this Privacy Policy. Material changes will be communicated through the site or email.</p>

            <h2>10. Contact Us</h2>
            <p>Email: <a href="mailto:support@benchracershq.com" className="text-blue-400">support@benchracershq.com</a></p>
          </div>
        </DialogDescription>
      </DialogHeader>

    <DialogFooter>
    <DialogTitle>By clicking "Accept & Complete Signup", you agree to our Terms and Conditions and Privacy Policy.</DialogTitle>
    <Button
        onClick={async () => {
        sethasAcceptedTerms(true);
        setShowTerms(false);
        
        // Automatically continue with signup using stored form data
        if (pendingFormData) {
            await proceedWithSignup(pendingFormData.email, pendingFormData.name);
            setPendingFormData(null);
        }
        }}
        className="bg-blue-600 hover:bg-blue-700"
    >
        Accept & Complete Signup
    </Button>

    <Button variant="secondary" onClick={() => {
        setShowTerms(false);
        setPendingFormData(null);
        setLoading(false);
    }}>
        Cancel
    </Button>
    </DialogFooter>
    </DialogContent>
  </Dialog>
)}
    </div>
  )
}