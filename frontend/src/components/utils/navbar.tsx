import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { Car, Compass, User, Home, Trophy, Users, LogOut, Menu, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import { useUser } from '../contexts/usercontext';

export function Navbar() {
  const location = useLocation();
  const pathname = location.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const { user, isAuthenticated, logout } = useUser();

  // Detect mobile and scroll
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    
    checkMobile();
    handleScroll();
    
    window.addEventListener('resize', checkMobile);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const routes = [
    { name: "Home", path: "/", icon: Home, color: "from-blue-500 to-cyan-500" },
    { name: "Explore", path: "/explore", icon: Compass, color: "from-purple-500 to-pink-500" },
    { name: "Rankings", path: "/rankings", icon: Trophy, color: "from-yellow-500 to-orange-500" },
    { name: "My Garage", path: "/garage", icon: User, color: "from-green-500 to-emerald-500" },
  ];
  
  if (user && user.isEditor) {
    routes.push({ name: "Admin", path: "/admin", icon: Car, color: "from-red-500 to-rose-500" });
  }
  
  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <style>{`
        .navbar-glow {
          box-shadow: 
            0 0 20px rgba(221, 28, 73, 0.3),
            0 4px 32px rgba(0, 0, 0, 0.8),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        .nav-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .nav-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: left 0.5s;
        }
        
        .nav-button:hover::before {
          left: 100%;
        }
        
        .nav-button-active {
          background: linear-gradient(135deg, #DD1C49, #FF2D5D);
          box-shadow: 
            0 0 20px rgba(221, 28, 73, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .logo-glow {
          filter: brightness(1.8) drop-shadow(0 0 15px rgba(221, 28, 73, 0.9));
          transition: all 0.3s ease;
        }
        
        .logo-glow:hover {
          filter: brightness(2.0) drop-shadow(0 0 25px rgba(221, 28, 73, 1));
          transform: scale(1.05);
        }
        
        .mobile-menu-backdrop {
          background: 
            radial-gradient(circle at 50% 0%, rgba(221, 28, 73, 0.15) 0%, transparent 50%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.95) 100%);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(221, 28, 73, 0.3);
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #DD1C49, #FF6B9D, #C147E9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .menu-button {
          background: rgba(221, 28, 73, 0.1);
          border: 1px solid rgba(221, 28, 73, 0.3);
          transition: all 0.3s ease;
        }
        
        .menu-button:hover {
          background: rgba(221, 28, 73, 0.2);
          border-color: rgba(221, 28, 73, 0.6);
          box-shadow: 0 0 15px rgba(221, 28, 73, 0.4);
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(221, 28, 73, 0.3); }
          50% { box-shadow: 0 0 30px rgba(221, 28, 73, 0.6); }
        }
        
        .pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
      `}</style>
      
      {/* sticky instead of fixed to make it actually part of the viewport*/}
      <nav className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500 ease-out",
        "bg-gradient-to-r from-black/95 via-gray-900/95 to-black/95",
        "backdrop-blur-xl border-b border-gray-800/50",
        isScrolled ? "navbar-glow" : "",
        isMobile ? "h-14" : "h-20"
      )}>
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent opacity-50"></div>
        
        <div className={cn(
          "relative px-4 md:px-6 flex items-center justify-between w-full h-full",
          isMobile ? "py-2" : "py-4"
        )}>
          {/* Logo Section */}
          <div className="flex items-center gap-4 md:gap-6">
            <Link to="/" className="flex items-center relative">
              <img 
                src="/BenchRacersLogo.png" 
                alt="Bench Racers Logo" 
                className="h-12 md:h-16 w-auto brightness-0 invert" 
            />
              <div 
                className="absolute inset-0 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 opacity-80 mix-blend-multiply pointer-events-none rounded"
                style={{
                  WebkitMask: 'url(/BenchRacersLogo.png) no-repeat center',
                  mask: 'url(/BenchRacersLogo.png) no-repeat center',
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain'
                }}
              />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4">
              {routes.map((route) => {
                const Icon = route.icon;
                const isActive = pathname === route.path;
                return (
                  <Link key={route.path} to={route.path}>
                    <Button
                      variant="ghost"
                      size={isMobile ? "sm" : "default"}
                      className={cn(
                        "nav-button relative group",
                        "flex items-center gap-2 font-medium",
                        "border border-transparent hover:border-white/20",
                        "rounded-xl transition-all duration-300",
                        "text-white hover:text-white",
                        isActive 
                          ? "nav-button-active text-white shadow-lg" 
                          : "hover:bg-white/10 hover:shadow-md hover:scale-105"
                      )}
                    >
                      <Icon className={cn(
                        "transition-all duration-300",
                        isMobile ? "h-4 w-4" : "h-4 w-4 lg:h-5 lg:w-5",
                        isActive ? "text-white" : "group-hover:scale-110 text-white"
                      )} />
                      <span className={cn(
                        "font-semibold tracking-wide text-white",
                        isMobile ? "text-sm" : "text-sm lg:text-base"
                      )}>
                        {route.name}
                      </span>
                      
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-white rounded-full"></div>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <div className="hidden lg:block text-right">
                  <p className="text-xs text-gray-400">Welcome back</p>
                  <p className="text-sm font-bold gradient-text">{user.name}</p>
                </div>
                <Button 
                  variant="outline" 
                  size={isMobile ? "sm" : "default"}
                  className="group border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 hover:text-red-300 transition-all duration-300"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="ml-2 font-medium">Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/auth">
                  <Button 
                    variant="outline" 
                    size={isMobile ? "sm" : "default"}
                    className="border-white/30 text-white hover:bg-white/10 hover:border-white/60 hover:text-white transition-all duration-300 rounded-xl"
                  >
                    <span className="font-medium">Login</span>
                  </Button>
                </Link>
                <Link to="/auth?signup=true">
                  <Button 
                    size={isMobile ? "sm" : "default"}
                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-xl pulse-glow"
                  >
                    <span className="font-bold">Sign Up</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon"
            className={cn(
              "md:hidden menu-button rounded-xl",
              isMobile ? "h-8 w-8" : "h-10 w-10"
            )}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? 
              <X className={cn("text-red-400", isMobile ? "h-4 w-4" : "h-5 w-5")} /> : 
              <Menu className={cn("text-white", isMobile ? "h-4 w-4" : "h-5 w-5")} />
            }
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mobile-menu-backdrop">
            <div className="px-4 py-4 space-y-2">
              {routes.map((route, index) => {
                const Icon = route.icon;
                const isActive = pathname === route.path;
                return (
                  <Link 
                    key={route.path} 
                    to={route.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="block animate-in slide-in-from-left duration-300"
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 py-3 rounded-xl transition-all duration-300",
                        "border border-transparent hover:border-white/20",
                        "text-white hover:text-white",
                        isActive 
                          ? "bg-gradient-to-r from-red-600/20 to-pink-600/20 border-red-500/40 text-white shadow-lg" 
                          : "text-gray-300 hover:bg-white/5 hover:text-white hover:scale-[1.02]"
                      )}
                    >
                      <Icon className={cn(
                        "transition-all duration-300",
                        "h-5 w-5",
                        isActive ? "text-red-400" : "group-hover:scale-110"
                      )} />
                      <span className="font-semibold text-base">{route.name}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      )}
                    </Button>
                  </Link>
                );
              })}
              
              {/* Mobile Auth Section */}
              <div className="pt-4 border-t border-gray-700/50 space-y-3">
                {isAuthenticated && user ? (
                  <div className="space-y-3">
                    <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/30">
                      <p className="text-xs text-gray-400">Logged in as</p>
                      <p className="text-sm font-bold gradient-text">{user.name}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3 py-3 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 rounded-xl transition-all duration-300" 
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-semibold">Logout</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button 
                        variant="outline" 
                        className="w-full py-3 border-white/30 text-white hover:bg-white/10 hover:text-white rounded-xl transition-all duration-300"
                      >
                        <span className="font-semibold">Login</span>
                      </Button>
                    </Link>
                    <Link to="/auth?signup=true" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button 
                        className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <span className="font-bold">Sign Up</span>
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}