import React, { useState } from 'react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { usePreloader } from '../contexts/PreloaderContext';
import { Button } from '../components/atoms/Button';

export function SignIn() {
  const navigate = useNavigate();
  const { signIn, user, loading } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const { setShowPreloader } = usePreloader();

  // Listen for Supabase connection events
  useEffect(() => {
    const handleConnectionError = () => {
      console.log('⚠️ SignIn: Supabase connection error detected');
      setConnectionError(true);
      
      // Don't set error if already authenticated to prevent blocking the redirect
      if (!user) {
        setError('Connection to authentication service failed. Please check your network and try again.');
      }
    };

    const handleConnectionSuccess = () => {
      console.log('✅ SignIn: Supabase connection successful');
      setConnectionError(false);
      setError(null);
    };

    window.addEventListener('supabase:connection:error', handleConnectionError);
    window.addEventListener('supabase:connection:success', handleConnectionSuccess);

    return () => {
      window.removeEventListener('supabase:connection:error', handleConnectionError);
      window.removeEventListener('supabase:connection:success', handleConnectionSuccess);
    };
  }, [user]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user && !loading) {
      console.log('✅ User already authenticated, redirecting to dashboard');
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  // Handle forced navigation when user exists despite connection issues
  useEffect(() => {
    if (user) {
      console.log('✅ User exists in SignIn, forcing navigation to dashboard');
      // Small delay to allow state updates to complete
      const navTimer = setTimeout(() => navigate('/', { replace: true }), 100);
      return () => clearTimeout(navTimer);
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setShowPreloader(true);

    // Prevent sign-in attempts if there's a connection error
    if (connectionError) {
      console.warn('⚠️ Sign in prevented due to connection error');
      setError('Cannot sign in while offline. Please check your network connection.');
      setIsSubmitting(false);
      return;
    }
    
    console.log('🔄 Form submitted, starting sign in process...');
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error('❌ Sign in failed:', error.message);
        setError(error.message);
        setShowPreloader(false);
      } else {
        console.log('✅ Sign in successful, navigating to dashboard');
        // Don't navigate here - let the useEffect handle it when user state updates
        // Navigation will happen automatically via auth state change
      }
    } catch (err: any) {
      console.error('❌ Unexpected sign in error:', err);
      setError(err?.message || 'An unexpected error occurred');
      setShowPreloader(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading if we're in the middle of auth state change
  // Critical fix: The user might be authenticated but we have connection issues
  // Force navigate to dashboard when user exists, even with connection issues
  if (user) {
    console.log('✅ User exists in SignIn, showing redirect loading UI');
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Form */}
      <div className="flex-1 bg-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6 sm:mb-8">
              <div className="p-2 sm:p-3 bg-primary rounded-xl shadow-soft">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-gray-900" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">CPA Hex</span>
                <p className="text-xs sm:text-sm text-gray-400 font-medium">AI Dashboard</p>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome back!</h1>
            <p className="text-sm sm:text-base text-gray-400">Sign in to your CPA Hex account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {connectionError && !error && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 sm:p-4">
                <p className="text-yellow-400 text-xs sm:text-sm">Connection to authentication service is currently unavailable. Sign-in may not work properly.</p>
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 sm:p-4">
                <p className="text-red-400 text-xs sm:text-sm">{error}</p>
              </div>
            )}
            
            <div className="space-y-3 sm:space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 text-sm sm:text-base"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 text-sm sm:text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary bg-gray-800 border-gray-600 rounded focus:ring-primary focus:ring-2"
                />
                <span className="ml-2 text-xs sm:text-sm text-gray-400">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs sm:text-sm text-primary hover:text-primary-hover transition-colors duration-200"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold"
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-primary hover:text-primary-hover font-semibold transition-colors duration-200"
              >
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Terms */}
          <div className="text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              By signing in, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:text-primary-hover transition-colors duration-200">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary hover:text-primary-hover transition-colors duration-200">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Background */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/32489809/pexels-photo-32489809.jpeg?_gl=1*j7c3pm*_ga*NDg0MTc4NzYzLjE3NDg1OTk1MTM.*_ga_8JE65Q40S6*czE3NTExMTMyNTUkbzMkZzEkdDE3NTExMTMyNzgkajM3JGwwJGgw')`
          }}
        />
        {/* Blur overlay for better text readability */}
        <div className="absolute inset-0 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40" />
        
        {/* Content Overlay */}
        <div className="relative h-full flex flex-col justify-between p-8 xl:p-12 text-white">
          <div className="flex-1 flex flex-col justify-center">
            <div className="max-w-lg">
              <h2 className="text-3xl xl:text-4xl font-bold mb-6 leading-tight">
                Your AI-powered tax assistant awaits
              </h2>
              <p className="text-lg xl:text-xl text-white/90 leading-relaxed">
                Streamline your tax workflow with intelligent document processing, 
                automated deduction detection, and seamless client management.
              </p>
            </div>
          </div>
          
          {/* Testimonial */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 xl:p-6 border border-white/20">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 xl:w-10 xl:h-10 bg-primary rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-xs xl:text-sm font-semibold text-gray-900">JD</span>
                </div>
                <div className="w-8 h-8 xl:w-10 xl:h-10 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-xs xl:text-sm font-semibold text-white">SM</span>
                </div>
                <div className="w-8 h-8 xl:w-10 xl:h-10 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-xs xl:text-sm font-semibold text-white">AL</span>
                </div>
              </div>
              <span className="text-white/90 font-medium text-sm xl:text-base">Trusted by 2,500+ CPAs</span>
            </div>
            <p className="text-white/80 italic text-sm xl:text-base">
              "CPA Hex has transformed how we handle tax season. The AI insights save us hours every day."
            </p>
            <p className="text-white/70 text-xs xl:text-sm mt-2">— Sarah Chen, Managing Partner</p>
          </div>
        </div>
      </div>
    </div>
  );
}