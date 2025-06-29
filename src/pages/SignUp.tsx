import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, Mail, Lock, User, Building } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { usePreloader } from '../contexts/PreloaderContext';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';

export function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuthContext();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const { setShowPreloader } = usePreloader();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setIsLoading(true);
    setShowPreloader(true);
    
    try {
      const { error } = await signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
      });
      
      if (error) {
        setError(error.message);
        setShowPreloader(false);
      } else {
        // Show email confirmation message
        setShowEmailConfirmation(true);
        
        // Redirect to sign-in after 3 seconds
        setTimeout(() => {
          navigate('/signin');
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setShowPreloader(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Show email confirmation state
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Panel - Confirmation Message */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md text-center space-y-6 sm:space-y-8">
            {/* Logo */}
            <div className="flex items-center justify-center space-x-3 mb-6 sm:mb-8">
              <div className="p-2 sm:p-3 bg-primary rounded-xl shadow-soft">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-gray-900" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">CPA OS</span>
                <p className="text-xs sm:text-sm text-gray-400 font-medium">by Nurahex</p>
              </div>
            </div>

            {/* Success Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg sm:text-xl">✓</span>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Account Created!</h1>
              <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
                Please check your email to confirm your account.
              </p>
              <p className="text-gray-500 text-xs sm:text-sm">
                We've sent a confirmation link to <span className="text-primary font-medium">{formData.email}</span>
              </p>
            </div>

            {/* Loading indicator */}
            <div className="flex items-center justify-center space-x-3 text-gray-400">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs sm:text-sm">Redirecting to sign in...</span>
            </div>

            {/* Manual redirect link */}
            <div className="pt-4">
              <Link
                to="/signin"
                className="text-sm text-primary hover:text-primary-hover font-semibold transition-colors duration-200"
              >
                Go to sign in now
              </Link>
            </div>
          </div>
        </div>

        {/* Right Panel - Same background */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.pexels.com/photos/31951633/pexels-photo-31951633.jpeg?_gl=1*106c6uc*_ga*NDg0MTc4NzYzLjE3NDg1OTk1MTM.*_ga_8JE65Q40S6*czE3NTExMTMyNTUkbzMkZzEkdDE3NTExMTM2NjEkajU5JGwwJGgw')`
            }}
          />
          {/* Blur overlay for better text readability */}
          <div className="absolute inset-0 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40" />
          
          {/* Content Overlay */}
          <div className="relative h-full flex flex-col justify-center items-center p-8 xl:p-12 text-white">
            <div className="text-center max-w-lg">
              <h2 className="text-3xl xl:text-4xl font-bold mb-6 leading-tight">
                Welcome to the CPA OS family!
              </h2>
              <p className="text-lg xl:text-xl text-white/90 leading-relaxed">
                You're just one step away from revolutionizing your tax workflow with AI-powered insights.
              </p>
            </div>
          </div>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Start your free trial</h1>
            <p className="text-sm sm:text-base text-gray-400">Create your CPA OS account today</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 sm:p-4">
                <p className="text-red-400 text-xs sm:text-sm">{error}</p>
              </div>
            )}
            
            <div className="space-y-3 sm:space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="relative">
                  <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 text-sm sm:text-base"
                    required
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 text-sm sm:text-base"
                  required
                />
              </div>

              {/* Company */}
              <div className="relative">
                <Building className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Company name"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 text-sm sm:text-base"
                  required
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
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

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 text-sm sm:text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors duration-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            {/* Agreement */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary bg-gray-800 border-gray-600 rounded focus:ring-primary focus:ring-2 mt-1"
                required
              />
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                I agree to the{' '}
                <Link to="/terms" className="text-primary hover:text-primary-hover transition-colors duration-200">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary hover:text-primary-hover transition-colors duration-200">
                  Privacy Policy
                </Link>
              </p>
            </div>

            <Button
              type="submit"
              className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link
                to="/signin"
                className="text-primary hover:text-primary-hover font-semibold transition-colors duration-200"
              >
                Sign in
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
            backgroundImage: `url('https://images.pexels.com/photos/31951633/pexels-photo-31951633.jpeg?_gl=1*106c6uc*_ga*NDg0MTc4NzYzLjE3NDg1OTk1MTM.*_ga_8JE65Q40S6*czE3NTExMTMyNTUkbzMkZzEkdDE3NTExMTM2NjEkajU5JGwwJGgw')`
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
                Join thousands of CPAs who trust CPA OS
              </h2>
              <p className="text-lg xl:text-xl text-white/90 leading-relaxed mb-6 xl:mb-8">
                Experience the future of tax preparation with AI-powered insights, 
                automated workflows, and intelligent client management.
              </p>
              
              {/* Features */}
              <div className="space-y-3 xl:space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 xl:w-6 xl:h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-gray-900 text-xs xl:text-sm">✓</span>
                  </div>
                  <span className="text-white/90 text-sm xl:text-base">AI-powered document analysis</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 xl:w-6 xl:h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-gray-900 text-xs xl:text-sm">✓</span>
                  </div>
                  <span className="text-white/90 text-sm xl:text-base">Automated deduction detection</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 xl:w-6 xl:h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-gray-900 text-xs xl:text-sm">✓</span>
                  </div>
                  <span className="text-white/90 text-sm xl:text-base">Seamless client collaboration</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 xl:p-6 border border-white/20">
            <div className="grid grid-cols-3 gap-4 xl:gap-6 text-center">
              <div>
                <div className="text-xl xl:text-2xl font-bold text-white">2,500+</div>
                <div className="text-white/70 text-xs xl:text-sm">Active CPAs</div>
              </div>
              <div>
                <div className="text-xl xl:text-2xl font-bold text-white">50K+</div>
                <div className="text-white/70 text-xs xl:text-sm">Documents Processed</div>
              </div>
              <div>
                <div className="text-xl xl:text-2xl font-bold text-white">98%</div>
                <div className="text-white/70 text-xs xl:text-sm">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}