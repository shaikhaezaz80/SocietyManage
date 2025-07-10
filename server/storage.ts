import { 
  users, societies, buildings, flats, visitors, staff, staffAttendance, 
  complaints, announcements, polls, pollVotes, maintenanceBills, expenses,
  amenities, amenityBookings, documents, messages, securityAlerts, auditLogs, inventoryItems,
  type User, type InsertUser, type Visitor, type InsertVisitor, type Staff, type InsertStaff,
  type Complaint, type InsertComplaint, type Announcement, type InsertAnnouncement,
  type Society, type Flat, type Building, type MaintenanceBill, type Expense,
  type Amenity, type AmenityBooking, type InsertAmenityBooking, type Document,
  type Message, type SecurityAlert, type AuditLog, type InventoryItem
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, lte, like, inArray, sql, count } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.SessionStore;
  
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getUsersBySociety(societyId: number): Promise<User[]>;

  // Society management  
  getSocietyById(id: number): Promise<Society | undefined>;
  createSociety(society: any): Promise<Society>;
  
  // Visitor management
  getVisitorById(id: number): Promise<Visitor | undefined>;
  getVisitorsBySociety(societyId: number, filters?: any): Promise<Visitor[]>;
  createVisitor(visitor: InsertVisitor): Promise<Visitor>;
  updateVisitor(id: number, updates: Partial<Visitor>): Promise<Visitor | undefined>;
  getTodaysVisitors(societyId: number): Promise<Visitor[]>;
  
  // Staff management
  getStaffBySociety(societyId: number): Promise<Staff[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: number, updates: Partial<Staff>): Promise<Staff | undefined>;
  markStaffAttendance(staffId: number, status: string, societyId: number): Promise<void>;
  
  // Flat and building management
  getFlatsBySociety(societyId: number): Promise<Flat[]>;
  getFlatById(id: number): Promise<Flat | undefined>;
  getBuildingsBySociety(societyId: number): Promise<Building[]>;
  
  // Complaint management
  getComplaintsBySociety(societyId: number, filters?: any): Promise<Complaint[]>;
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
  updateComplaint(id: number, updates: Partial<Complaint>): Promise<Complaint | undefined>;
  
  // Announcement and community
  getAnnouncementsBySociety(societyId: number): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  
  // Finance management
  getMaintenanceBillsBySociety(societyId: number, filters?: any): Promise<MaintenanceBill[]>;
  getExpensesBySociety(societyId: number, filters?: any): Promise<Expense[]>;
  createMaintenanceBill(bill: any): Promise<MaintenanceBill>;
  
  // Amenity management
  getAmenitiesBySociety(societyId: number): Promise<Amenity[]>;
  getAmenityBookingsBySociety(societyId: number, filters?: any): Promise<AmenityBooking[]>;
  createAmenityBooking(booking: InsertAmenityBooking): Promise<AmenityBooking>;
  
  // Document management
  getDocumentsBySociety(societyId: number, category?: string): Promise<Document[]>;
  createDocument(document: any): Promise<Document>;
  
  // Messaging
  getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]>;
  createMessage(message: any): Promise<Message>;
  
  // Security and audit
  createSecurityAlert(alert: any): Promise<SecurityAlert>;
  logAuditEntry(entry: any): Promise<AuditLog>;
  
  // Inventory
  getInventoryBySociety(societyId: number): Promise<InventoryItem[]>;
  createInventoryItem(item: any): Promise<InventoryItem>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUsersBySociety(societyId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.societyId, societyId));
  }

  async getSocietyById(id: number): Promise<Society | undefined> {
    const [society] = await db.select().from(societies).where(eq(societies.id, id));
    return society || undefined;
  }

  async createSociety(society: any): Promise<Society> {
    const [newSociety] = await db.insert(societies).values(society).returning();
    return newSociety;
  }

  async getVisitorById(id: number): Promise<Visitor | undefined> {
    const [visitor] = await db.select().from(visitors).where(eq(visitors.id, id));
    return visitor || undefined;
  }

  async getVisitorsBySociety(societyId: number, filters?: any): Promise<Visitor[]> {
    let query = db.select().from(visitors).where(eq(visitors.societyId, societyId));
    
    if (filters?.status) {
      query = query.where(eq(visitors.status, filters.status));
    }
    
    if (filters?.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query.where(and(
        gte(visitors.createdAt, startOfDay),
        lte(visitors.createdAt, endOfDay)
      ));
    }
    
    return await query.orderBy(desc(visitors.createdAt));
  }

  async createVisitor(visitor: InsertVisitor): Promise<Visitor> {
    // Generate QR code data
    const qrData = `visitor:${visitor.name}:${visitor.phone}:${Date.now()}`;
    
    const [newVisitor] = await db.insert(visitors)
      .values({ ...visitor, qrCode: qrData })
      .returning();
    return newVisitor;
  }

  async updateVisitor(id: number, updates: Partial<Visitor>): Promise<Visitor | undefined> {
    const [visitor] = await db.update(visitors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(visitors.id, id))
      .returning();
    return visitor || undefined;
  }

  async getTodaysVisitors(societyId: number): Promise<Visitor[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db.select().from(visitors)
      .where(and(
        eq(visitors.societyId, societyId),
        gte(visitors.createdAt, today),
        lte(visitors.createdAt, tomorrow)
      ))
      .orderBy(desc(visitors.createdAt));
  }

  async getStaffBySociety(societyId: number): Promise<Staff[]> {
    return await db.select().from(staff)
      .where(eq(staff.societyId, societyId))
      .orderBy(asc(staff.name));
  }

  async createStaff(staffData: InsertStaff): Promise<Staff> {
    const [newStaff] = await db.insert(staff).values(staffData).returning();
    return newStaff;
  }

  async updateStaff(id: number, updates: Partial<Staff>): Promise<Staff | undefined> {
    const [updatedStaff] = await db.update(staff)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(staff.id, id))
      .returning();
    return updatedStaff || undefined;
  }

  async markStaffAttendance(staffId: number, status: string, societyId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if attendance already exists for today
    const [existing] = await db.select().from(staffAttendance)
      .where(and(
        eq(staffAttendance.staffId, staffId),
        gte(staffAttendance.date, today)
      ));

    if (existing) {
      // Update existing attendance
      await db.update(staffAttendance)
        .set({ 
          status,
          checkOutTime: status === 'present' ? null : new Date(),
          updatedAt: new Date()
        })
        .where(eq(staffAttendance.id, existing.id));
    } else {
      // Create new attendance record
      await db.insert(staffAttendance).values({
        staffId,
        societyId,
        date: today,
        checkInTime: status === 'present' ? new Date() : null,
        status
      });
    }
  }

  async getFlatsBySociety(societyId: number): Promise<Flat[]> {
    return await db.select().from(flats)
      .where(eq(flats.societyId, societyId))
      .orderBy(asc(flats.flatNumber));
  }

  async getFlatById(id: number): Promise<Flat | undefined> {
    const [flat] = await db.select().from(flats).where(eq(flats.id, id));
    return flat || undefined;
  }

  async getBuildingsBySociety(societyId: number): Promise<Building[]> {
    return await db.select().from(buildings)
      .where(eq(buildings.societyId, societyId))
      .orderBy(asc(buildings.name));
  }

  async getComplaintsBySociety(societyId: number, filters?: any): Promise<Complaint[]> {
    let query = db.select().from(complaints).where(eq(complaints.societyId, societyId));
    
    if (filters?.status) {
      query = query.where(eq(complaints.status, filters.status));
    }
    
    if (filters?.category) {
      query = query.where(eq(complaints.category, filters.category));
    }
    
    return await query.orderBy(desc(complaints.createdAt));
  }

  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    const [newComplaint] = await db.insert(complaints).values(complaint).returning();
    return newComplaint;
  }

  async updateComplaint(id: number, updates: Partial<Complaint>): Promise<Complaint | undefined> {
    const [complaint] = await db.update(complaints)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(complaints.id, id))
      .returning();
    return complaint || undefined;
  }

  async getAnnouncementsBySociety(societyId: number): Promise<Announcement[]> {
    return await db.select().from(announcements)
      .where(and(
        eq(announcements.societyId, societyId),
        eq(announcements.isActive, true)
      ))
      .orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async getMaintenanceBillsBySociety(societyId: number, filters?: any): Promise<MaintenanceBill[]> {
    let query = db.select().from(maintenanceBills).where(eq(maintenanceBills.societyId, societyId));
    
    if (filters?.status) {
      query = query.where(eq(maintenanceBills.status, filters.status));
    }
    
    if (filters?.month && filters?.year) {
      query = query.where(and(
        eq(maintenanceBills.month, filters.month),
        eq(maintenanceBills.year, filters.year)
      ));
    }
    
    return await query.orderBy(desc(maintenanceBills.createdAt));
  }

  async getExpensesBySociety(societyId: number, filters?: any): Promise<Expense[]> {
    let query = db.select().from(expenses).where(eq(expenses.societyId, societyId));
    
    if (filters?.category) {
      query = query.where(eq(expenses.category, filters.category));
    }
    
    return await query.orderBy(desc(expenses.createdAt));
  }

  async createMaintenanceBill(bill: any): Promise<MaintenanceBill> {
    const [newBill] = await db.insert(maintenanceBills).values(bill).returning();
    return newBill;
  }

  async getAmenitiesBySociety(societyId: number): Promise<Amenity[]> {
    return await db.select().from(amenities)
      .where(and(
        eq(amenities.societyId, societyId),
        eq(amenities.isActive, true)
      ))
      .orderBy(asc(amenities.name));
  }

  async getAmenityBookingsBySociety(societyId: number, filters?: any): Promise<AmenityBooking[]> {
    let query = db.select().from(amenityBookings).where(eq(amenityBookings.societyId, societyId));
    
    if (filters?.status) {
      query = query.where(eq(amenityBookings.status, filters.status));
    }
    
    return await query.orderBy(desc(amenityBookings.createdAt));
  }

  async createAmenityBooking(booking: InsertAmenityBooking): Promise<AmenityBooking> {
    const [newBooking] = await db.insert(amenityBookings).values(booking).returning();
    return newBooking;
  }

  async getDocumentsBySociety(societyId: number, category?: string): Promise<Document[]> {
    let query = db.select().from(documents)
      .where(and(
        eq(documents.societyId, societyId),
        eq(documents.isActive, true)
      ));
    
    if (category && category !== 'all') {
      query = query.where(eq(documents.category, category));
    }
    
    return await query.orderBy(desc(documents.createdAt));
  }

  async createDocument(document: any): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(and(
        eq(messages.senderId, user1Id),
        eq(messages.receiverId, user2Id)
      ))
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(message: any): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async createSecurityAlert(alert: any): Promise<SecurityAlert> {
    const [newAlert] = await db.insert(securityAlerts).values(alert).returning();
    return newAlert;
  }

  async logAuditEntry(entry: any): Promise<AuditLog> {
    const [newEntry] = await db.insert(auditLogs).values(entry).returning();
    return newEntry;
  }

  async getInventoryBySociety(societyId: number): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems)
      .where(and(
        eq(inventoryItems.societyId, societyId),
        eq(inventoryItems.isActive, true)
      ))
      .orderBy(asc(inventoryItems.name));
  }

  async createInventoryItem(item: any): Promise<InventoryItem> {
    const [newItem] = await db.insert(inventoryItems).values(item).returning();
    return newItem;
  }
}

export const storage = new DatabaseStorage();
