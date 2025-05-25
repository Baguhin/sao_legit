import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Megaphone, 
  LogOut,
  Bell,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  GraduationCap
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Chat } from "@/components/chat";
import { AppointmentForm } from "@/components/appointment-form";
import { RequestForm } from "@/components/request-form";
import type { Appointment, Request, Announcement } from "@/lib/types";
import { format } from "date-fns";

export default function StudentDashboard() {
  const { user, refetch } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Fetch data
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: requests = [] } = useQuery<Request[]>({
    queryKey: ["/api/requests"],
  });

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      toast({
        title: "Success",
        description: "Logged out successfully!",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const upcomingAppointments = appointments.filter(apt => apt.status === "approved");
  const pendingAppointments = appointments.filter(apt => apt.status === "pending");
  const activeRequests = requests.filter(req => req.status !== "completed" && req.status !== "rejected");

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: 3 },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "requests", label: "Requests", icon: FileText },
    { id: "announcements", label: "Announcements", icon: Megaphone },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "messages":
        return <Chat />;
      case "appointments":
        return renderAppointments();
      case "requests":
        return renderRequests();
      case "announcements":
        return renderAnnouncements();
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Requests</p>
                <p className="text-2xl font-bold text-gray-900">{activeRequests.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingAppointments.length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar className="text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Messages</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <MessageSquare className="text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Announcements</p>
                <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Megaphone className="text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.slice(0, 3).map((request) => (
                <div key={request.id} className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FileText className="text-primary text-sm" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Request submitted</p>
                    <p className="text-xs text-gray-600">
                      {request.requestType} - {format(new Date(request.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center space-y-2"
                onClick={() => setShowAppointmentForm(true)}
              >
                <Calendar className="text-xl text-gray-600" />
                <span className="text-sm font-medium">Book Appointment</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center space-y-2"
                onClick={() => setShowRequestForm(true)}
              >
                <Plus className="text-xl text-gray-600" />
                <span className="text-sm font-medium">Submit Request</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center space-y-2"
                onClick={() => setActiveSection("messages")}
              >
                <MessageSquare className="text-xl text-gray-600" />
                <span className="text-sm font-medium">Send Message</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center space-y-2"
                onClick={() => setActiveSection("announcements")}
              >
                <Megaphone className="text-xl text-gray-600" />
                <span className="text-sm font-medium">View Updates</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">My Appointments</h2>
          <p className="text-gray-600">Manage your scheduled appointments</p>
        </div>
        <Button onClick={() => setShowAppointmentForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Book Appointment
        </Button>
      </div>

      <div className="space-y-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary text-white w-12 h-12 rounded-lg flex items-center justify-center">
                        <Calendar />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{appointment.appointmentType}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(appointment.preferredDate), "MMM d, yyyy")} at {appointment.preferredTime}
                        </p>
                        <p className="text-sm text-gray-600">{appointment.reason}</p>
                      </div>
                    </div>
                    <Badge className="bg-secondary text-white">Confirmed</Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No upcoming appointments</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Appointments */}
        {pendingAppointments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-4">
                      <div className="bg-yellow-600 text-white w-12 h-12 rounded-lg flex items-center justify-center">
                        <Clock />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{appointment.appointmentType}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(appointment.preferredDate), "MMM d, yyyy")} at {appointment.preferredTime}
                        </p>
                        <p className="text-sm text-gray-600">{appointment.reason}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-yellow-600 text-yellow-600">Pending</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">My Requests</h2>
          <p className="text-gray-600">Track your submitted requests</p>
        </div>
        <Button onClick={() => setShowRequestForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {requests.length > 0 ? (
              requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <FileText className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{request.requestType}</p>
                      <p className="text-sm text-gray-600">
                        Submitted {format(new Date(request.createdAt), "MMM d, yyyy")}
                      </p>
                      <p className="text-sm text-gray-600">{request.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={request.status === "completed" ? "default" : 
                               request.status === "pending" ? "secondary" : "outline"}
                      className={
                        request.status === "completed" ? "bg-green-100 text-green-800" :
                        request.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-blue-100 text-blue-800"
                      }
                    >
                      {request.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No requests submitted yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnnouncements = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Announcements</h2>
        <p className="text-gray-600">Stay updated with important information from Student Affairs</p>
      </div>

      <div className="space-y-4">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${
                    announcement.priority === "urgent" ? "bg-red-100" :
                    announcement.priority === "important" ? "bg-orange-100" : "bg-blue-100"
                  }`}>
                    {announcement.priority === "urgent" ? (
                      <AlertCircle className="text-red-600" />
                    ) : (
                      <Megaphone className="text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                      <span className="text-sm text-gray-500">
                        {format(new Date(announcement.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{announcement.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Posted by {announcement.creator?.firstName} {announcement.creator?.lastName}</span>
                      <span>{announcement.views} views</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No announcements available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <GraduationCap className="text-primary text-2xl" />
              <div>
                <h2 className="font-bold text-gray-900">SAO Connect</h2>
                <p className="text-sm text-gray-600">{user?.firstName} {user?.lastName}</p>
              </div>
            </div>
          </div>
          
          <nav className="mt-6">
            <div className="px-6 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? "text-primary bg-blue-50"
                      : "text-gray-700 hover:text-primary hover:bg-blue-50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge className="bg-accent text-white text-xs ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </nav>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-gray-700 hover:text-accent"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="ml-64 flex-1">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {navigationItems.find(item => item.id === activeSection)?.label || "Dashboard"}
                </h1>
                <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-5 h-5" />
                  <Badge className="absolute -top-1 -right-1 bg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    2
                  </Badge>
                </Button>
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AppointmentForm 
        open={showAppointmentForm} 
        onOpenChange={setShowAppointmentForm} 
      />
      <RequestForm 
        open={showRequestForm} 
        onOpenChange={setShowRequestForm} 
      />
    </div>
  );
}
