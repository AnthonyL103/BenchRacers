import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "../utils/navbar";
import { Footer } from "../utils/footer";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Car } from "lucide-react";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Validate token exists
  useEffect(() => {
    if (!token) {
      setMessage({
        text: "Invalid or missing token. Please request a new password reset link.",
        type: "error"
      });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Password match validation
    if (newPassword !== confirmPassword) {
      setMessage({
        text: "Passwords do not match",
        type: "error"
      });
      return;
    }

    // Password strength validation
    if (newPassword.length < 8) {
      setMessage({
        text: "Password must be at least 8 characters long",
        type: "error"
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('https://api.benchracershq.com/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }
      
      setMessage({
        text: "Password has been reset successfully",
        type: "success"
      });
      
      // Redirect to login page after successful reset
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
      
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
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
            <h1 className="text-3xl font-bold">Reset Your Password</h1>
            <p className="text-gray-400 mt-2">Create a new password for your account</p>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardDescription>
                Please enter your new password below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!token ? (
                <div className="bg-red-900 text-red-100 border border-red-800 p-3 rounded text-sm">
                  Invalid or missing token. Please request a new password reset link.
                  <div className="mt-4">
                    <Link to="/forgot-password" className="text-primary hover:underline">
                      Go to Forgot Password
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2 text-white">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input 
                      id="new-password" 
                      name="new-password" 
                      type="password"
                      className="text-black" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2 text-white">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input 
                      id="confirm-password" 
                      name="confirm-password" 
                      type="password"
                      className="text-black" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required 
                    />
                  </div>

                  {message && (
                    <div className={`p-3 rounded text-sm ${
                      message.type === "success" 
                        ? "bg-green-800 text-green-100 border border-green-700" 
                        : "bg-red-900 text-red-100 border border-red-800"
                    }`}>
                      {message.text}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <div className="text-center text-sm text-gray-400">
                <p>
                  Remember your password?{" "}
                  <Link to="/auth" className="text-primary hover:underline">
                    Back to Login
                  </Link>
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}