import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../navbar";
import { Footer } from "../footer";
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
      
      // The backend always returns 200 for security reasons (to prevent email enumeration)
      // But we'll always show a success message
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
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Car className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Reset Your Password</h1>
            <p className="text-gray-400 mt-2">Enter your email to receive a reset link</p>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardDescription>
                We'll send you an email with a link to reset your password.
              </CardDescription>
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
      </main>
      <Footer />
    </div>
  );
}