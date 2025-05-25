import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertMessageSchema,
  insertAppointmentSchema,
  insertRequestSchema,
  insertAnnouncementSchema,
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    studentId?: string;
  };
}

// Session configuration
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  return session({
    secret: process.env.SESSION_SECRET || "sao-connect-secret-key-dev",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  });
}

// Auth middleware
async function requireAuth(req: AuthenticatedRequest, res: Response, next: any) {
  console.log("Session check:", req.session?.userId);
  
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      studentId: user.studentId || undefined,
    };
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function requireAdmin(req: AuthenticatedRequest, res: Response, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      studentId: user.studentId || undefined,
    };
    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(getSession());

  // Initialize admin user if it doesn't exist
  try {
    const adminUser = await storage.getUserByEmail("admin@sao.edu");
    if (!adminUser) {
      await storage.createUser({
        email: "admin@sao.edu",
        password: "admin123",
        firstName: "SAO",
        lastName: "Administrator",
        role: "admin",
      });
      console.log("Admin user created: admin@sao.edu / admin123");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }

  // Auth routes
  app.post("/api/auth/login", async (req: AuthenticatedRequest, res) => {
    try {
      const { email, password } = req.body;

      // Handle admin login with username
      let user;
      if (email === "admin") {
        user = await storage.authenticateUser("admin@sao.edu", password);
      } else {
        user = await storage.authenticateUser(email, password);
      }

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId || undefined,
      };

      res.json({
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Check if student ID is unique
      if (userData.studentId) {
        const existingStudentId = await storage.getUserByStudentId(userData.studentId);
        if (existingStudentId) {
          return res.status(400).json({ message: "Student ID already exists" });
        }
      }

      const user = await storage.createUser(userData);
      res.status(201).json({
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/logout", (req: AuthenticatedRequest, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", async (req: AuthenticatedRequest, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId || undefined,
      };

      res.json(req.user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Message routes
  app.get("/api/messages", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { with: withUserId } = req.query;
      const messages = await storage.getMessagesBetweenUsers(
        req.user!.id,
        withUserId ? parseInt(withUserId as string) : undefined
      );
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.get("/api/conversations", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const conversations = await storage.getConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });

  app.post("/api/messages", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user!.id,
        isFromAdmin: req.user!.role === "admin",
      });

      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(400).json({ message: "Failed to create message" });
    }
  });

  app.put("/api/messages/mark-read", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { senderId } = req.body;
      await storage.markMessagesAsRead(senderId, req.user!.id);
      res.json({ message: "Messages marked as read" });
    } catch (error) {
      console.error("Mark messages read error:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Appointment routes
  app.get("/api/appointments", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      let appointments;
      if (req.user!.role === "admin") {
        appointments = await storage.getAllAppointments();
      } else {
        appointments = await storage.getAppointmentsByStudent(req.user!.id);
      }
      res.json(appointments);
    } catch (error) {
      console.error("Get appointments error:", error);
      res.status(500).json({ message: "Failed to get appointments" });
    }
  });

  app.get("/api/appointments/pending", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const appointments = await storage.getPendingAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Get pending appointments error:", error);
      res.status(500).json({ message: "Failed to get pending appointments" });
    }
  });

  app.get("/api/appointments/today", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const appointments = await storage.getTodaysAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Get today's appointments error:", error);
      res.status(500).json({ message: "Failed to get today's appointments" });
    }
  });

  app.post("/api/appointments", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse({
        ...req.body,
        studentId: req.user!.id,
        preferredDate: new Date(req.body.preferredDate),
      });

      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Create appointment error:", error);
      res.status(400).json({ message: "Failed to create appointment" });
    }
  });

  app.put("/api/appointments/:id/status", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const appointment = await storage.updateAppointmentStatus(
        parseInt(id),
        status,
        adminNotes
      );
      res.json(appointment);
    } catch (error) {
      console.error("Update appointment status error:", error);
      res.status(500).json({ message: "Failed to update appointment status" });
    }
  });

  // Request routes
  app.get("/api/requests", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      let requests;
      if (req.user!.role === "admin") {
        requests = await storage.getAllRequests();
      } else {
        requests = await storage.getRequestsByStudent(req.user!.id);
      }
      res.json(requests);
    } catch (error) {
      console.error("Get requests error:", error);
      res.status(500).json({ message: "Failed to get requests" });
    }
  });

  app.get("/api/requests/pending", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const requests = await storage.getPendingRequests();
      res.json(requests);
    } catch (error) {
      console.error("Get pending requests error:", error);
      res.status(500).json({ message: "Failed to get pending requests" });
    }
  });

  app.post("/api/requests", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const requestData = insertRequestSchema.parse({
        ...req.body,
        studentId: req.user!.id,
      });

      const request = await storage.createRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Create request error:", error);
      res.status(400).json({ message: "Failed to create request" });
    }
  });

  app.put("/api/requests/:id/status", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { status, adminResponse } = req.body;

      const request = await storage.updateRequestStatus(
        parseInt(id),
        status,
        adminResponse
      );
      res.json(request);
    } catch (error) {
      console.error("Update request status error:", error);
      res.status(500).json({ message: "Failed to update request status" });
    }
  });

  // Announcement routes
  app.get("/api/announcements", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      let announcements;
      if (req.user!.role === "admin") {
        announcements = await storage.getAllAnnouncements();
      } else {
        announcements = await storage.getPublishedAnnouncements();
      }
      res.json(announcements);
    } catch (error) {
      console.error("Get announcements error:", error);
      res.status(500).json({ message: "Failed to get announcements" });
    }
  });

  app.post("/api/announcements", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });

      const announcement = await storage.createAnnouncement(announcementData);
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Create announcement error:", error);
      res.status(400).json({ message: "Failed to create announcement" });
    }
  });

  app.put("/api/announcements/:id/views", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await storage.updateAnnouncementViews(parseInt(id));
      res.json({ message: "Views updated" });
    } catch (error) {
      console.error("Update announcement views error:", error);
      res.status(500).json({ message: "Failed to update views" });
    }
  });

  // Student management routes (admin only)
  app.get("/api/students", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ message: "Failed to get students" });
    }
  });

  // Analytics routes (admin only)
  app.get("/api/analytics/overview", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const [studentCount, pendingRequests, todaysAppointments, unreadMessages] = await Promise.all([
        storage.getStudentCount(),
        storage.getPendingRequestCount(),
        storage.getTodaysAppointmentCount(),
        storage.getUnreadMessagesCount(),
      ]);

      res.json({
        studentCount,
        pendingRequests,
        todaysAppointments,
        unreadMessages,
      });
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  interface WebSocketClient extends WebSocket {
    userId?: number;
    userRole?: string;
  }

  wss.on("connection", (ws: WebSocketClient, req) => {
    console.log("WebSocket connection established");

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case "auth":
            // Set user info for this connection
            ws.userId = message.userId;
            ws.userRole = message.userRole;
            break;

          case "message":
            // Store message in database
            const savedMessage = await storage.createMessage({
              senderId: message.senderId,
              receiverId: message.receiverId,
              content: message.content,
              isFromAdmin: message.isFromAdmin,
            });

            // Broadcast to all connected clients
            wss.clients.forEach((client: WebSocketClient) => {
              if (client.readyState === WebSocket.OPEN) {
                // Send to sender and receiver
                if (client.userId === message.senderId || client.userId === message.receiverId) {
                  client.send(JSON.stringify({
                    type: "message",
                    data: savedMessage,
                  }));
                }
              }
            });
            break;

          case "typing":
            // Broadcast typing indicator
            wss.clients.forEach((client: WebSocketClient) => {
              if (client.readyState === WebSocket.OPEN && client.userId === message.receiverId) {
                client.send(JSON.stringify({
                  type: "typing",
                  data: {
                    senderId: message.senderId,
                    isTyping: message.isTyping,
                  },
                }));
              }
            });
            break;

          default:
            console.log("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });
  });

  return httpServer;
}
