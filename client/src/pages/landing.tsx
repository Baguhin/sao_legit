import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, MessageSquare, Calendar, FileText, Users, Shield, ArrowRight, CheckCircle, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { refetch } = useAuth();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await apiRequest("POST", "/api/auth/login", { email, password });
      toast({
        title: "Success",
        description: "Welcome back!",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const userData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      studentId: formData.get("studentId") as string,
    };

    try {
      await apiRequest("POST", "/api/auth/register", userData);
      
      // Auto-login after registration
      await apiRequest("POST", "/api/auth/login", {
        email: userData.email,
        password: userData.password,
      });
      
      toast({
        title: "Success",
        description: "Account created and logged in successfully!",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Registration failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SAO Connect</h1>
                <p className="text-sm text-gray-600">Student Affairs Office Portal</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                Connect with Your
                <span className="text-blue-600"> Student Affairs Office</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Streamline your academic journey with our comprehensive student services platform. 
                Book appointments, submit requests, and stay connected with SAO staff.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="group flex items-center space-x-4 p-5 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Instant Messaging</h3>
                  <p className="text-blue-200 text-sm">Real-time chat with SAO staff</p>
                </div>
              </div>
              
              <div className="group flex items-center space-x-4 p-5 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Smart Scheduling</h3>
                  <p className="text-blue-200 text-sm">Book appointments effortlessly</p>
                </div>
              </div>
              
              <div className="group flex items-center space-x-4 p-5 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Document Hub</h3>
                  <p className="text-blue-200 text-sm">Submit & track requests</p>
                </div>
              </div>
              
              <div className="group flex items-center space-x-4 p-5 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Live Updates</h3>
                  <p className="text-blue-200 text-sm">Stay informed with notifications</p>
                </div>
              </div>
            </div>
          </div>

          {/* Auth Forms */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md shadow-2xl bg-white/95 backdrop-blur-xl border-0">
              <CardHeader className="text-center pb-8">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Access your student portal or create your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="login" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="space-y-4">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-sm font-semibold text-gray-700">
                          Email or Username
                        </Label>
                        <Input
                          id="login-email"
                          name="email"
                          type="text"
                          placeholder="Enter email or 'admin' for staff"
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-sm font-semibold text-gray-700">
                          Password
                        </Label>
                        <Input
                          id="login-password"
                          name="password"
                          type="password"
                          placeholder="Enter password"
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105" 
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing in..." : (
                          <div className="flex items-center space-x-2">
                            <span>Sign In</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        )}
                      </Button>
                      <div className="text-center p-4 bg-blue-50 rounded-xl">
                        <div className="text-sm text-gray-600 mb-2">Demo Admin Access:</div>
                        <code className="bg-white px-3 py-1 rounded-lg text-blue-700 font-mono text-sm">
                          admin / admin123
                        </code>
                      </div>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register" className="space-y-4">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
                            First Name
                          </Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            placeholder="John"
                            className="h-11 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
                            Last Name
                          </Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            placeholder="Doe"
                            className="h-11 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studentId" className="text-sm font-semibold text-gray-700">
                          Student ID
                        </Label>
                        <Input
                          id="studentId"
                          name="studentId"
                          placeholder="2024-00001"
                          className="h-11 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email" className="text-sm font-semibold text-gray-700">
                          Email
                        </Label>
                        <Input
                          id="register-email"
                          name="email"
                          type="email"
                          placeholder="john.doe@university.edu"
                          className="h-11 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password" className="text-sm font-semibold text-gray-700">
                          Password
                        </Label>
                        <Input
                          id="register-password"
                          name="password"
                          type="password"
                          placeholder="Create password"
                          className="h-11 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105" 
                        disabled={isLoading}
                      >
                        {isLoading ? "Creating Account..." : (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Create Account</span>
                          </div>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-white/5 backdrop-blur-xl mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">Capstone Project 2024</span>
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-blue-200 text-sm max-w-md mx-auto">
              Built with modern web technologies for the ultimate student experience. 
              Connecting students and administrators seamlessly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}