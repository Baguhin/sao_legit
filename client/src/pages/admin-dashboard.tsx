import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Users, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Megaphone, 
  BarChart3,
  LogOut,
  Bell,
  Plus,
  Search,
  Eye,
  Edit,
  Check,
  X,
  Play,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Chat } from "@/components/chat";
import { AnnouncementForm } from "@/components/announcement-form";
import type { User, Appointment, Request, Announcement, Analytics } from "@/lib/types";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { user, refetch } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch data
  const { data: students = [] } = useQuery<User[]>({
    queryKey: ["/api/students"],
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: pendingAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/pending"],
  });

  const { data: todaysAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/today"],
  });

  const { data: requests = [] } = useQuery<Request[]>({
    queryKey: ["/api/requests"],
  });

  const { data: pendingRequests = [] } = useQuery<Request[]>({
    queryKey: ["/api/requests/pending"],
  });

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/analytics/overview"],
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

  const handleAppointmentStatusUpdate = async (appointmentId: number, status: string, adminNotes?: string) => {
    try {
      await apiRequest("PUT", `/api/appointments/${appointmentId}/status`, {
        status,
        adminNotes,
      });
      
      toast({
        title: "Success",
        description: `Appointment ${status}`,
      });
      
      // Refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/today"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive",
      });
    }
  };

  const handleRequestStatusUpdate = async (requestId: number, status: string, adminResponse?: string) => {
    try {
      await apiRequest("PUT", `/api/requests/${requestId}/status`, {
        status,
        adminResponse,
      });
      
      toast({
        title: "Success",
        description: `Request marked as ${status}`,
      });
      
      // Refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests/pending"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive",
      });
    }
  };

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "students", label: "Students", icon: Users },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: analytics?.unreadMessages || 0 },
    { id: "appointments", label: "Appointments", icon: Calendar, badge: pendingAppointments.length },
    { id: "requests", label: "Requests", icon: FileText, badge: pendingRequests.length },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.lastName} ${student.email} ${student.studentId}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    switch (activeSection) {
      case "students":
        return renderStudents();
      case "messages":
        return <Chat isAdmin />;
      case "appointments":
        return renderAppointments();
      case "requests":
        return renderRequests();
      case "announcements":
        return renderAnnouncements();
      case "analytics":
        return renderAnalytics();
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
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.studentCount || 0}</p>
                <p className="text-sm text-green-600">Active users</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.pendingRequests || 0}</p>
                <p className="text-sm text-yellow-600">Needs attention</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <FileText className="text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.todaysAppointments || 0}</p>
                <p className="text-sm text-green-600">Scheduled</p>
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
                <p className="text-sm text-gray-600">Unread Messages</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.unreadMessages || 0}</p>
                <p className="text-sm text-accent">New messages</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <MessageSquare className="text-purple-600" />
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
                    <p className="text-sm font-medium text-gray-900">New request submitted</p>
                    <p className="text-xs text-gray-600">
                      {request.requestType} from {request.student?.firstName} - {format(new Date(request.createdAt), "MMM d, h:mm a")}
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
                onClick={() => setShowAnnouncementForm(true)}
              >
                <Megaphone className="text-xl text-gray-600" />
                <span className="text-sm font-medium">New Announcement</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center space-y-2"
                onClick={() => setActiveSection("requests")}
              >
                <FileText className="text-xl text-gray-600" />
                <span className="text-sm font-medium">Review Requests</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center space-y-2"
                onClick={() => setActiveSection("appointments")}
              >
                <Calendar className="text-xl text-gray-600" />
                <span className="text-sm font-medium">Manage Schedule</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center space-y-2"
                onClick={() => setActiveSection("messages")}
              >
                <MessageSquare className="text-xl text-gray-600" />
                <span className="text-sm font-medium">Reply Messages</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Student Management</h2>
          <p className="text-gray-600">Manage registered students and their information</p>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Student</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Registered</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{student.studentId}</td>
                    <td className="py-3 px-4 text-gray-600">{student.email}</td>
                    <td className="py-3 px-4">
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {format(new Date(student.createdAt!), "MMM d, yyyy")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Appointment Management</h2>
          <p className="text-gray-600">Review and manage student appointment requests</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Pending Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingAppointments.length > 0 ? (
                pendingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-4">
                      <div className="bg-yellow-600 text-white w-12 h-12 rounded-lg flex items-center justify-center">
                        <Clock />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {appointment.appointmentType} - {appointment.student?.firstName} {appointment.student?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Requested: {format(new Date(appointment.preferredDate), "MMM d, yyyy")} at {appointment.preferredTime}
                        </p>
                        <p className="text-sm text-gray-600">Reason: {appointment.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAppointmentStatusUpdate(appointment.id, "approved")}
                        className="bg-secondary text-white hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAppointmentStatusUpdate(appointment.id, "rejected")}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No pending appointments</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaysAppointments.length > 0 ? (
                todaysAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary text-white w-12 h-12 rounded-lg flex items-center justify-center">
                        <Calendar />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {appointment.student?.firstName} {appointment.student?.lastName} - {appointment.appointmentType}
                        </p>
                        <p className="text-sm text-gray-600">
                          {appointment.preferredTime} | Room 201
                        </p>
                        <p className="text-sm text-gray-600">Topic: {appointment.reason}</p>
                      </div>
                    </div>
                    <Badge className="bg-secondary text-white">Confirmed</Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No appointments scheduled for today</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Student Requests</h2>
          <p className="text-gray-600">Review and process student service requests</p>
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter requests" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {requests.length > 0 ? (
              requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${
                      request.priority === "urgent" ? "bg-red-100" : "bg-blue-100"
                    }`}>
                      {request.priority === "urgent" ? (
                        <AlertTriangle className="text-red-600" />
                      ) : (
                        <FileText className="text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-semibold text-gray-900">{request.requestType}</p>
                        {request.priority === "urgent" && (
                          <Badge variant="destructive" className="text-xs">High Priority</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Student: {request.student?.firstName} {request.student?.lastName} (ID: {request.student?.studentId})
                      </p>
                      <p className="text-sm text-gray-600">
                        Submitted: {format(new Date(request.createdAt), "MMM d, yyyy")}
                      </p>
                      <p className="text-sm text-gray-600">{request.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {request.status === "pending" ? (
                      <Button
                        size="sm"
                        onClick={() => handleRequestStatusUpdate(request.id, "in_progress")}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Process
                      </Button>
                    ) : request.status === "completed" ? (
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleRequestStatusUpdate(request.id, "completed")}
                        className="bg-secondary text-white hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    )}
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
              <p className="text-gray-500 text-center py-8">No requests to review</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnnouncements = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Announcements</h2>
          <p className="text-gray-600">Create and manage announcements for students</p>
        </div>
        <Button onClick={() => setShowAnnouncementForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      <div className="space-y-4">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${
                      announcement.priority === "urgent" ? "bg-red-100" :
                      announcement.priority === "important" ? "bg-orange-100" : "bg-blue-100"
                    }`}>
                      {announcement.priority === "urgent" ? (
                        <AlertTriangle className="text-red-600" />
                      ) : (
                        <Megaphone className="text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">Published</Badge>
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{announcement.content}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Published {format(new Date(announcement.createdAt), "MMM d, yyyy")}</span>
                        <span>{announcement.views} views</span>
                      </div>
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
              <p className="text-gray-500">No announcements created yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Analytics & Reports</h2>
        <p className="text-gray-600">View system usage and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Chart placeholder - Activity trends over time</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Transcripts</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "65%" }}></div>
                  </div>
                  <span className="text-sm text-gray-500">65%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Enrollment Certificates</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-secondary h-2 rounded-full" style={{ width: "25%" }}></div>
                  </div>
                  <span className="text-sm text-gray-500">25%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">General Inquiries</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "10%" }}></div>
                  </div>
                  <span className="text-sm text-gray-500">10%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      <div className="flex">
        {/* Admin Sidebar */}
        <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Shield className="text-primary text-2xl" />
              <div>
                <h2 className="font-bold text-gray-900">SAO Admin</h2>
                <p className="text-sm text-gray-600">Administrator Panel</p>
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
                  {item.badge && item.badge > 0 && (
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

        {/* Admin Main Content */}
        <div className="ml-64 flex-1">
          {/* Admin Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {navigationItems.find(item => item.id === activeSection)?.label || "Admin Dashboard"}
                </h1>
                <p className="text-gray-600">Student Affairs Office Management System</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-5 h-5" />
                  <Badge className="absolute -top-1 -right-1 bg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {(analytics?.unreadMessages || 0) + (pendingAppointments.length) + (pendingRequests.length)}
                  </Badge>
                </Button>
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                  AD
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
      <AnnouncementForm 
        open={showAnnouncementForm} 
        onOpenChange={setShowAnnouncementForm} 
      />
    </div>
  );
}
