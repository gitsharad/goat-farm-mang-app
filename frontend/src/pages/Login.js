import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Users, Heart, Baby, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'Worker',
    farmTypes: []
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Get redirect URL before any async operations
    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo = searchParams.get('redirect') || '/';
    console.log('Redirect target:', redirectTo);

    try {
      let result;
      if (isLogin) {
        result = await login({
          username: formData.username,
          password: formData.password,
          redirect: redirectTo // Pass redirect URL to login function
        });

        if (result?.success) {
          toast.success('Login successful!');
          
          // Always redirect to dashboard-selector after login
          const targetUrl = '/dashboard-selector';
          console.log('Login successful, redirecting to:', targetUrl);
          
          // Use a small timeout to ensure state updates are processed
          setTimeout(() => {
            window.location.href = targetUrl;
          }, 100);
        } else {
          toast.error(result?.message || 'Login failed. Please check your credentials.');
        }
      } else {
        // Registration logic
        if (!formData.farmTypes || formData.farmTypes.length === 0) {
          toast.error('Please select at least one farm type');
          setLoading(false);
          return;
        }
        
        result = await register(formData);
        if (result?.success) {
          toast.success('Registration successful! Please log in.');
          setIsLogin(true); // Switch to login form
          setFormData({
            username: '',
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            role: 'Worker',
            farmTypes: []
          });
        } else {
          toast.error(result?.message || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'Worker',
      farmTypes: []
    });
  };

  const handleFarmTypeToggle = (type) => {
    setFormData((prev) => {
      const set = new Set(prev.farmTypes || []);
      if (set.has(type)) set.delete(type); else set.add(type);
      return { ...prev, farmTypes: Array.from(set) };
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 text-white p-12">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-6">Farm Management System</h1>
          <p className="text-lg text-primary-100 mb-8">
            Streamline your farm operations with our comprehensive management system for goats, poultry, and dairy.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-primary-200" />
              <div>
                <h3 className="font-semibold">Animal Management</h3>
                <p className="text-primary-200">Track individual animals, breeding, and health records</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Heart className="h-8 w-8 text-primary-200" />
              <div>
                <h3 className="font-semibold">Health Monitoring</h3>
                <p className="text-primary-200">Monitor vaccinations, treatments, and medical history</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Baby className="h-8 w-8 text-primary-200" />
              <div>
                <h3 className="font-semibold">Breeding Programs</h3>
                <p className="text-primary-200">Manage mating schedules and track pregnancies</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Utensils className="h-8 w-8 text-primary-200" />
              <div>
                <h3 className="font-semibold">Feed Management</h3>
                <p className="text-primary-200">Track feeding schedules and nutritional requirements</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600">
              {isLogin 
                ? 'Sign in to your account to continue' 
                : 'Join us to start managing your farm'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                {/* Farm Types Selection - Multiple for registration */}
                <div>
                  <label className="label">Farm Types *</label>
                  <p className="text-sm text-gray-600 mb-3">Select all farm types you manage (choose at least one)</p>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        name="farmTypes-goat"
                        checked={formData.farmTypes.includes('goat')}
                        onChange={() => handleFarmTypeToggle('goat')}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">🐐 Goat Farm</div>
                        <div className="text-xs text-gray-500">Manage goats, breeding, health, and feed records</div>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        name="farmTypes-poultry"
                        checked={formData.farmTypes.includes('poultry')}
                        onChange={() => handleFarmTypeToggle('poultry')}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">🐔 Poultry Farm</div>
                        <div className="text-xs text-gray-500">Manage poultry batches, egg production, and health</div>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        name="farmTypes-dairy"
                        checked={formData.farmTypes.includes('dairy')}
                        onChange={() => handleFarmTypeToggle('dairy')}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">🐄 Dairy Farm</div>
                        <div className="text-xs text-gray-500">Manage dairy cattle, milk production, and breeding</div>
                      </div>
                    </label>
                    {formData.farmTypes.length === 0 && (
                      <p className="text-xs text-red-600">Please select at least one farm type.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="input"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="input"
                    required
                  >
                    <option value="Worker">Worker</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

              </>
            )}

            <div>
              <label className="label">
                {isLogin ? 'Username or Email' : 'Username'}
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-lg font-semibold disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 