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
    
    if (newPassword !== confirmPassword) {
      setMessage({
        text: "Passwords do not match",
        type: "error"
      });
      return;
    }

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
    <div className="flex flex-col h-screen overflow-hidden bg-black">
      <main className="flex-1 py-12">
        <div className="absolute inset-0 z-0">
          <img
            src="miata-6564096_1920.jpg"
            alt="Featured car"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0" />
        </div>
        <div className="relative z-20 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">

            <Card className="
              absolute fixed z-10 
              top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
              w-[calc(100vw-2rem)] max-w-md sm:w-[calc(100vw-3rem)] sm:max-w-lg md:w-[calc(100vw-4rem)] md:max-w-xl lg:max-w-2xl
              bg-gray-950 border border-gray-950
              rounded-xl shadow-lg 
              max-h-[90vh] overflow-y-auto
              transition-all duration-200
            ">
              <CardHeader className="p-4">
                <div className="text-center mb-2">
                  <div className="flex mb-2 flex-row justify-between gap-2 align-left">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      Reset Your Password
                    </h1>
                    <Link to="/">
                      <Car className="h-12 w-12 text-primary hover:text-white" />
                    </Link>
                  </div>
                  <p className="text-gray-400">Create a new password for your account</p>
                </div>
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
                        placeholder="Enter new password"
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
                        placeholder="Confirm new password"
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
        </div>
      </main>
    </div>
  );
}