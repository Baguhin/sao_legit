import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GraduationCap, Calendar, MessageSquare, Megaphone, Shield, UserPlus, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { refetch } = useAuth();

  const handleStudentLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await apiRequest("POST", "/api/auth/login", { email, password });
      toast({
        title: "Success!",
        description: "Successfully logged in!",
      });
      setShowLogin(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      await apiRequest("POST", "/api/auth/login", { email: username, password });
      toast({
        title: "Success!",
        description: "Welcome to Admin Portal!",
      });
      setShowAdminLogin(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid credentials. Use admin/admin123",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleStudentRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const userData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      studentId: formData.get("studentId") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: "student",
    };

    try {
      await apiRequest("POST", "/api/auth/register", userData);
      toast({
        title: "Success!",
        description: "Account created successfully!",
      });
      setShowRegister(false);
      // Auto login after registration
      await apiRequest("POST", "/api/auth/login", { 
        email: userData.email, 
        password: userData.password 
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Registration failed. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <GraduationCap className="text-primary text-2xl" />
              <span className="text-xl font-bold text-gray-900">SAO Connect</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setShowLogin(true)}
                className="text-gray-600 hover:text-primary"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              <Button 
                onClick={() => setShowRegister(true)}
                className="bg-primary text-white hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Connect with Student Affairs
              <span className="block text-blue-200">Seamlessly</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Streamline your student experience with our comprehensive platform for appointments, messaging, and support services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => setShowRegister(true)}
                className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-4"
              >
                Register as Student
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => setShowAdminLogin(true)}
                className="border-2 border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4"
              >
                <Shield className="w-5 h-5 mr-2" />
                Admin Portal
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need in one platform
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools designed to enhance communication between students and Student Affairs Office.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-primary text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Scheduling</h3>
              <p className="text-gray-600">Book appointments with SAO staff easily and get instant confirmations.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="text-secondary text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Messaging</h3>
              <p className="text-gray-600">Connect with SAO administrators instantly through our chat system.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Megaphone className="text-purple-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Announcements</h3>
              <p className="text-gray-600">Stay updated with important announcements and notifications.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Login Modal */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="text-center mb-4">
              <GraduationCap className="text-primary text-3xl mb-2 mx-auto" />
              <DialogTitle className="text-2xl font-bold text-gray-900">Student Sign In</DialogTitle>
              <p className="text-gray-600">Access your student portal</p>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                name="email"
                type="email" 
                required 
                placeholder="student@university.edu"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password"
                name="password"
                type="password" 
                required 
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary text-white hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          
          <div className="text-center mt-4">
            <Button 
              variant="link" 
              onClick={() => {
                setShowLogin(false);
                setShowRegister(true);
              }}
              className="text-primary hover:text-blue-700 text-sm"
            >
              Don't have an account? Register here
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Login Modal */}
      <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="text-center mb-4">
              <Shield className="text-primary text-3xl mb-2 mx-auto" />
              <DialogTitle className="text-2xl font-bold text-gray-900">Admin Portal</DialogTitle>
              <p className="text-gray-600">SAO Administrator Access</p>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username"
                name="username"
                type="text" 
                required 
                placeholder="admin"
                defaultValue="admin"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="admin-password">Password</Label>
              <Input 
                id="admin-password"
                name="password"
                type="password" 
                required 
                placeholder="admin123"
                defaultValue="admin123"
                className="mt-1"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary text-white hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Accessing..." : "Access Admin Portal"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Registration Modal */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="text-center mb-4">
              <UserPlus className="text-primary text-3xl mb-2 mx-auto" />
              <DialogTitle className="text-2xl font-bold text-gray-900">Create Account</DialogTitle>
              <p className="text-gray-600">Join the SAO Connect community</p>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleStudentRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName"
                  name="firstName"
                  type="text" 
                  required 
                  placeholder="John"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName"
                  name="lastName"
                  type="text" 
                  required 
                  placeholder="Doe"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="studentId">Student ID</Label>
              <Input 
                id="studentId"
                name="studentId"
                type="text" 
                required 
                placeholder="2024001234"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="register-email">Email</Label>
              <Input 
                id="register-email"
                name="email"
                type="email" 
                required 
                placeholder="john.doe@university.edu"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="register-password">Password</Label>
              <Input 
                id="register-password"
                name="password"
                type="password" 
                required 
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary text-white hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          
          <div className="text-center mt-4">
            <Button 
              variant="link"
              onClick={() => {
                setShowRegister(false);
                setShowLogin(true);
              }}
              className="text-primary hover:text-blue-700 text-sm"
            >
              Already have an account? Sign in
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
