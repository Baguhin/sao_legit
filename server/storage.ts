import {
  users,
  messages,
  appointments,
  requests,
  announcements,
  type User,
  type InsertUser,
  type Message,
  type InsertMessage,
  type Appointment,
  type InsertAppointment,
  type AppointmentWithStudent,
  type Request,
  type InsertRequest,
  type RequestWithStudent,
  type Announcement,
  type InsertAnnouncement,
  type AnnouncementWithCreator,
  type MessageWithUsers,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStudentId(studentId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(email: string, password: string): Promise<User | null>;
  getAllStudents(): Promise<User[]>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(userId1: number, userId2?: number): Promise<MessageWithUsers[]>;
  getConversations(userId: number): Promise<{ user: User; lastMessage: MessageWithUsers; unreadCount: number }[]>;
  markMessagesAsRead(senderId: number, receiverId: number): Promise<void>;
  getUnreadMessageCount(userId: number): Promise<number>;

  // Appointment operations
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointmentsByStudent(studentId: number): Promise<Appointment[]>;
  getAllAppointments(): Promise<AppointmentWithStudent[]>;
  getPendingAppointments(): Promise<AppointmentWithStudent[]>;
  updateAppointmentStatus(id: number, status: string, adminNotes?: string): Promise<Appointment>;
  getTodaysAppointments(): Promise<AppointmentWithStudent[]>;

  // Request operations
  createRequest(request: InsertRequest): Promise<Request>;
  getRequestsByStudent(studentId: number): Promise<Request[]>;
  getAllRequests(): Promise<RequestWithStudent[]>;
  getPendingRequests(): Promise<RequestWithStudent[]>;
  updateRequestStatus(id: number, status: string, adminResponse?: string): Promise<Request>;

  // Announcement operations
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  getAllAnnouncements(): Promise<AnnouncementWithCreator[]>;
  getPublishedAnnouncements(): Promise<AnnouncementWithCreator[]>;
  updateAnnouncementViews(id: number): Promise<void>;
  updateAnnouncement(id: number, updates: Partial<InsertAnnouncement>): Promise<Announcement>;

  // Analytics operations
  getStudentCount(): Promise<number>;
  getPendingRequestCount(): Promise<number>;
  getTodaysAppointmentCount(): Promise<number>;
  getUnreadMessagesCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.studentId, studentId));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getAllStudents(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "student")).orderBy(desc(users.createdAt));
  }

  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  async getMessagesBetweenUsers(userId1: number, userId2?: number): Promise<MessageWithUsers[]> {
    const query = db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        isFromAdmin: messages.isFromAdmin,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        sender: users,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id));

    if (userId2) {
      const result = await query
        .where(
          or(
            and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
            and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
          )
        )
        .orderBy(messages.createdAt);
      return result.map(row => ({ ...row, sender: row.sender! })) as MessageWithUsers[];
    } else {
      // For admin - get all messages where admin is involved
      const result = await query
        .where(or(eq(messages.senderId, userId1), eq(messages.receiverId, userId1)))
        .orderBy(messages.createdAt);
      return result.map(row => ({ ...row, sender: row.sender! })) as MessageWithUsers[];
    }
  }

  async getConversations(userId: number): Promise<{ user: User; lastMessage: MessageWithUsers; unreadCount: number }[]> {
    // This is a complex query - for simplicity, we'll fetch and process in memory
    const allMessages = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        isFromAdmin: messages.isFromAdmin,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        sender: users,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));

    const conversations = new Map();
    
    for (const msg of allMessages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!otherUserId) continue;

      if (!conversations.has(otherUserId)) {
        const otherUser = await this.getUser(otherUserId);
        if (otherUser) {
          conversations.set(otherUserId, {
            user: otherUser,
            lastMessage: { ...msg, sender: msg.sender! },
            unreadCount: 0,
          });
        }
      }

      if (msg.receiverId === userId && !msg.isRead) {
        const conv = conversations.get(otherUserId);
        if (conv) conv.unreadCount++;
      }
    }

    return Array.from(conversations.values());
  }

  async markMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)));
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(eq(messages.receiverId, userId), eq(messages.isRead, false)));
    return result.count;
  }

  // Appointment operations
  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db.insert(appointments).values(appointmentData).returning();
    return appointment;
  }

  async getAppointmentsByStudent(studentId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.studentId, studentId))
      .orderBy(desc(appointments.createdAt));
  }

  async getAllAppointments(): Promise<AppointmentWithStudent[]> {
    const result = await db
      .select({
        id: appointments.id,
        studentId: appointments.studentId,
        appointmentType: appointments.appointmentType,
        preferredDate: appointments.preferredDate,
        preferredTime: appointments.preferredTime,
        reason: appointments.reason,
        status: appointments.status,
        adminNotes: appointments.adminNotes,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        student: users,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.studentId, users.id))
      .orderBy(desc(appointments.createdAt));
    return result.map(row => ({ ...row, student: row.student! })) as AppointmentWithStudent[];
  }

  async getPendingAppointments(): Promise<AppointmentWithStudent[]> {
    const result = await db
      .select({
        id: appointments.id,
        studentId: appointments.studentId,
        appointmentType: appointments.appointmentType,
        preferredDate: appointments.preferredDate,
        preferredTime: appointments.preferredTime,
        reason: appointments.reason,
        status: appointments.status,
        adminNotes: appointments.adminNotes,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        student: users,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.studentId, users.id))
      .where(eq(appointments.status, "pending"))
      .orderBy(desc(appointments.createdAt));
    return result.map(row => ({ ...row, student: row.student! })) as AppointmentWithStudent[];
  }

  async updateAppointmentStatus(id: number, status: string, adminNotes?: string): Promise<Appointment> {
    const [appointment] = await db
      .update(appointments)
      .set({ status, adminNotes, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return appointment;
  }

  async getTodaysAppointments(): Promise<AppointmentWithStudent[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await db
      .select({
        id: appointments.id,
        studentId: appointments.studentId,
        appointmentType: appointments.appointmentType,
        preferredDate: appointments.preferredDate,
        preferredTime: appointments.preferredTime,
        reason: appointments.reason,
        status: appointments.status,
        adminNotes: appointments.adminNotes,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        student: users,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.studentId, users.id))
      .where(
        and(
          eq(appointments.status, "approved"),
          sql`${appointments.preferredDate} >= ${today}`,
          sql`${appointments.preferredDate} < ${tomorrow}`
        )
      )
      .orderBy(appointments.preferredDate);
    return result.map(row => ({ ...row, student: row.student! })) as AppointmentWithStudent[];
  }

  // Request operations
  async createRequest(requestData: InsertRequest): Promise<Request> {
    const [request] = await db.insert(requests).values(requestData).returning();
    return request;
  }

  async getRequestsByStudent(studentId: number): Promise<Request[]> {
    return await db
      .select()
      .from(requests)
      .where(eq(requests.studentId, studentId))
      .orderBy(desc(requests.createdAt));
  }

  async getAllRequests(): Promise<RequestWithStudent[]> {
    const result = await db
      .select({
        id: requests.id,
        studentId: requests.studentId,
        requestType: requests.requestType,
        priority: requests.priority,
        description: requests.description,
        status: requests.status,
        adminResponse: requests.adminResponse,
        createdAt: requests.createdAt,
        updatedAt: requests.updatedAt,
        student: users,
      })
      .from(requests)
      .leftJoin(users, eq(requests.studentId, users.id))
      .orderBy(desc(requests.createdAt));
    return result.map(row => ({ ...row, student: row.student! })) as RequestWithStudent[];
  }

  async getPendingRequests(): Promise<RequestWithStudent[]> {
    const result = await db
      .select({
        id: requests.id,
        studentId: requests.studentId,
        requestType: requests.requestType,
        priority: requests.priority,
        description: requests.description,
        status: requests.status,
        adminResponse: requests.adminResponse,
        createdAt: requests.createdAt,
        updatedAt: requests.updatedAt,
        student: users,
      })
      .from(requests)
      .leftJoin(users, eq(requests.studentId, users.id))
      .where(eq(requests.status, "pending"))
      .orderBy(desc(requests.createdAt));
    return result.map(row => ({ ...row, student: row.student! })) as RequestWithStudent[];
  }

  async updateRequestStatus(id: number, status: string, adminResponse?: string): Promise<Request> {
    const [request] = await db
      .update(requests)
      .set({ status, adminResponse, updatedAt: new Date() })
      .where(eq(requests.id, id))
      .returning();
    return request;
  }

  // Announcement operations
  async createAnnouncement(announcementData: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db.insert(announcements).values(announcementData).returning();
    return announcement;
  }

  async getAllAnnouncements(): Promise<AnnouncementWithCreator[]> {
    const result = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        priority: announcements.priority,
        isPublished: announcements.isPublished,
        views: announcements.views,
        createdBy: announcements.createdBy,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
        creator: users,
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.createdBy, users.id))
      .orderBy(desc(announcements.createdAt));
    return result.map(row => ({ ...row, creator: row.creator! })) as AnnouncementWithCreator[];
  }

  async getPublishedAnnouncements(): Promise<AnnouncementWithCreator[]> {
    const result = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        priority: announcements.priority,
        isPublished: announcements.isPublished,
        views: announcements.views,
        createdBy: announcements.createdBy,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
        creator: users,
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.createdBy, users.id))
      .where(eq(announcements.isPublished, true))
      .orderBy(desc(announcements.createdAt));
    return result.map(row => ({ ...row, creator: row.creator! })) as AnnouncementWithCreator[];
  }

  async updateAnnouncementViews(id: number): Promise<void> {
    await db
      .update(announcements)
      .set({ views: sql`${announcements.views} + 1` })
      .where(eq(announcements.id, id));
  }

  async updateAnnouncement(id: number, updates: Partial<InsertAnnouncement>): Promise<Announcement> {
    const [announcement] = await db
      .update(announcements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return announcement;
  }

  // Analytics operations
  async getStudentCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "student"));
    return result.count;
  }

  async getPendingRequestCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(requests)
      .where(eq(requests.status, "pending"));
    return result.count;
  }

  async getTodaysAppointmentCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          eq(appointments.status, "approved"),
          sql`${appointments.preferredDate} >= ${today}`,
          sql`${appointments.preferredDate} < ${tomorrow}`
        )
      );
    return result.count;
  }

  async getUnreadMessagesCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.isRead, false));
    return result.count;
  }
}

export const storage = new DatabaseStorage();
