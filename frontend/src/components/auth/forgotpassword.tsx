import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../utils/navbar";
import { Footer } from "../utils/footer";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Car } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('https://api.benchracershq.com/api/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
   
      setMessage({
        text: "If an account with this email exists, a password reset link has been sent.",
        type: "success"
      });
      
    } catch (error) {
      setMessage({
        text: "Something went wrong. Please try again later.",
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

          <Card  className="
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
             <Link
                    to="/"
                >
                    <Car className="h-12 w-12 text-primary hover:text-white" />
                </Link>
            </div>
            <p className="text-gray-400">Enter your email to receive a reset link</p>
          </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2 text-white">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    className="text-black"
                    placeholder="your@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
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