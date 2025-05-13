import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from "framer-motion";
import Home from './components/home';
import AboutPage from './components/about/page';
import CarDetailPage from './components/car/page';
import ExplorePage from './components/explore/page';
import FollowingPage from './components/following/page';
import GaragePage from './components/garage/page';
import RankingsPage from './components/rankings/page';
import AuthPage from './components/auth/page';
import StatsPage from './components/stats/page';
import VerifyEmail from './components/auth/verify';
import ForgotPasswordPage from './components/auth/forgotpassword';
import ResetPasswordPage from './components/auth/resetpassword';


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
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <Router>      
        <AnimatedRoutes />
    </Router>
  );
};

export default App;
