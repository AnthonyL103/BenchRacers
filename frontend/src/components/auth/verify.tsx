import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "../utils/navbar";
import { Footer } from "../utils/footer";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Car } from "lucide-react";
import axios from "axios";

const VerifyEmail = () => {
  const [status, setStatus] = useState<string>("Verifying your email...");
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get("token");

      if (!token) {
        setStatus("Invalid verification link. Token is missing.");
        setVerificationStatus("error");
        setTimeout(() => {
          navigate("/auth", { 
            state: { 
              verificationMessage: "Invalid verification link. Please try signing up again.",
              verificationStatus: "error" 
            } 
          });
        }, 3000);
        return;
      }

      try {
        // Make API call to your backend
        const response = await axios.get(`https://api.benchracershq.com/api/users/verify`, {
          params: { token }
        });
        
        setStatus("Your email has been successfully verified! Redirecting to login...");
        setVerificationStatus("success");
        setTimeout(() => {
          navigate("/auth", { 
            state: { 
              verificationMessage: "Email verified successfully! You can now log in.",
              verificationStatus: "success" 
            } 
          });
        }, 3000);
      } catch (error) {
        console.error("Verification error:", error);
        let errorMessage = "Verification failed. Please try again or contact support.";
        
        if (axios.isAxiosError(error) && error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        setStatus(`${errorMessage} Redirecting to login...`);
        setVerificationStatus("error");
        setTimeout(() => {
          navigate("/auth", { 
            state: { 
              verificationMessage: errorMessage,
              verificationStatus: "error" 
            } 
          });
        }, 3000);
      }
    };

    verifyEmail();
  }, [location, navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Car className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Email Verification</h1>
            <p className="text-gray-400 mt-2">Verifying your Bench Racers account</p>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white">
                  Email Verification
                </h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center py-6">
                {verificationStatus === "pending" && (
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                )}
                
                {verificationStatus === "success" && (
                  <div className="text-green-500 text-5xl mb-4">✓</div>
                )}
                
                {verificationStatus === "error" && (
                  <div className="text-red-500 text-5xl mb-4">✗</div>
                )}
                
                <p className={`text-center ${
                  verificationStatus === "success" ? "text-green-400" : 
                  verificationStatus === "error" ? "text-red-400" : "text-white"
                }`}>
                  {status}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VerifyEmail;