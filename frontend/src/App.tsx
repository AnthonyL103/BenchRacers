import React, {useState, useEffect} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from "framer-motion";
import Home from './components/home';
import AboutPage from './components/about/page';
import ExplorePage from './components/explore/page';
import FollowingPage from './components/following/page';
import GaragePage from './components/garage/page';
import RankingsPage from './components/rankings/page';
import AuthPage from './components/auth/page';
import StatsPage from './components/stats/page';
import VerifyEmail from './components/auth/verify';
import ForgotPasswordPage from './components/auth/forgotpassword';
import ResetPasswordPage from './components/auth/resetpassword';
import AdminPage from './components/admin/page';
import { CarProvider } from './components/contexts/carlistcontext';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";



const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

const clearUserData = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
};

interface TokenProps {
  children: React.ReactNode;
}

const TokenManager: React.FC<TokenProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('token');
      
      if (isTokenExpired(token)) {
        clearUserData();
        
        const currentPath = window.location.pathname;
        const publicRoutes = ['/', '/auth', '/verify', '/forgot-password', '/reset-password', '/about'];
        
        if (!publicRoutes.includes(currentPath)) {
          navigate('/auth');
        }
      }
      setIsChecking(false);
    };

    checkToken();

    const interval = setInterval(checkToken, 5 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkToken();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [navigate]);

  if (isChecking) {
    return <div>Loading...</div>; 
  }

  return children;
};


const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/following" element={<FollowingPage />} />
        <Route path="/garage" element={<GaragePage />} />
        <Route path="/rankings" element={<RankingsPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<Navigate to="/auth?signup=true" replace />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <Router>     
    <CarProvider>
        <TokenManager>
        <AnimatedRoutes />
        </TokenManager>
    </CarProvider>
    </Router>
  );
};

export default App;
