export interface User {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  studentId?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId?: number;
  content: string;
  isFromAdmin: boolean;
  isRead: boolean;
  createdAt: string;
  sender?: User;
  receiver?: User;
}

export interface Appointment {
  id: number;
  studentId: number;
  appointmentType: string;
  preferredDate: string;
  preferredTime: string;
  reason: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  student?: User;
}

export interface Request {
  id: number;
  studentId: number;
  requestType: string;
  priority: string;
  description: string;
  status: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
  student?: User;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: string;
  isPublished: boolean;
  views: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  creator?: User;
}

export interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface Analytics {
  studentCount: number;
  pendingRequests: number;
  todaysAppointments: number;
  unreadMessages: number;
}
