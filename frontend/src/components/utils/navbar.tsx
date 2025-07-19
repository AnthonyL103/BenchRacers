import { useState } from "react"; // Add this import
import { Link, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { Car, Compass, User, Home, Trophy, Users, LogOut, Menu, X } from "lucide-react"; // Add Menu and X
import { cn } from "../../../lib/utils";
import { useUser } from '../contexts/usercontext';

export function Navbar() {
  const location = useLocation();
  const pathname = location.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Add state
  
  const { user, isAuthenticated, logout } = useUser();

  const routes = [
    { name: "Home", path: "/", icon: Home },
    { name: "Explore", path: "/explore", icon: Compass },
    { name: "Rankings", path: "/rankings", icon: Trophy },
    { name: "My Garage", path: "/garage", icon: User },
  ];
  
  if (user && user.isEditor) {
    routes.push({ name: "Admin", path: "/admin", icon: Car });
  }
  
  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-sm border-b border-gray-800">
      <div className="px-2 md:px-4 flex items-center justify-between py-4 w-full">
        <div className="flex gap-6">
          <img 
            src="/BenchRacersLogo.png" 
            alt="Bench Racers Logo" 
            className="h-20 w-auto brightness-0 invert" 
          />
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {routes.map((route) => {
              const Icon = route.icon;
              return (
                <Link key={route.path} to={route.path}>
                  <Button
                    variant="ghost"
                    className={cn("flex items-center gap-2 text-white text-lg", pathname === route.path && "bg-[#DD1C49] text-white")}
                  >
                    <Icon className="h-5 w-5" /> 
                    <span>{route.name}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <p className="text-sm text-white">Welcome, <span className="font-bold">{user.name}</span></p>
              </div>
              <Button variant="outline" className="flex items-center gap-1" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="outline" className="flex items-center gap-1">
                  <span>Login</span>
                </Button>
              </Link>
              <Link to="/auth?signup=true">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black/95 border-t border-gray-800">
          <div className="container px-8 py-4 space-y-2">
            {routes.map((route) => {
              const Icon = route.icon;
              return (
                <Link 
                  key={route.path} 
                  to={route.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 text-white text-lg py-3",
                      pathname === route.path && "bg-[#DD1C49] text-white"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{route.name}</span>
                  </Button>
                </Link>
              );
            })}
            
            {/* Mobile Auth Buttons */}
            <div className="pt-4 border-t border-gray-800 space-y-2">
              {isAuthenticated && user ? (
                <>
                  <p className="text-sm text-white px-3">Welcome, <span className="font-bold">{user.name}</span></p>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2" 
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Login</Button>
                  </Link>
                  <Link to="/auth?signup=true" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}