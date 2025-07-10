import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, uuid, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'resident', 'guard', 'auditor']);
export const visitorStatusEnum = pgEnum('visitor_status', ['pending', 'approved', 'inside', 'exited', 'blocked']);
export const visitorTypeEnum = pgEnum('visitor_type', ['guest', 'delivery', 'service', 'cab', 'vendor', 'family']);
export const complaintStatusEnum = pgEnum('complaint_status', ['open', 'in_progress', 'resolved', 'escalated', 'closed']);
export const complaintPriorityEnum = pgEnum('complaint_priority', ['low', 'medium', 'high', 'critical']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'overdue', 'partial']);
export const staffCategoryEnum = pgEnum('staff_category', ['housekeeping', 'security', 'maintenance', 'gardening', 'management']);

// Core Tables
export const societies = pgTable("societies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  pincode: varchar("pincode", { length: 10 }).notNull(),
  phone: varchar("phone", { length: 15 }),
  email: varchar("email", { length: 255 }),
  totalFlats: integer("total_flats").default(0),
  adminName: varchar("admin_name", { length: 255 }),
  adminPhone: varchar("admin_phone", { length: 15 }),
  settings: jsonb("settings").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 15 }).notNull(),
  role: userRoleEnum("role").notNull().default('resident'),
  societyId: integer("society_id").references(() => societies.id),
  flatNumber: varchar("flat_number", { length: 20 }),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const buildings = pgTable("buildings", {
  id: serial("id").primaryKey(),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  floors: integer("floors").notNull(),
  flatsPerFloor: integer("flats_per_floor").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const flats = pgTable("flats", {
  id: serial("id").primaryKey(),
  buildingId: integer("building_id").references(() => buildings.id).notNull(),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  flatNumber: varchar("flat_number", { length: 20 }).notNull(),
  floor: integer("floor").notNull(),
  type: varchar("type", { length: 50 }), // 1BHK, 2BHK, etc.
  area: decimal("area", { precision: 8, scale: 2 }),
  ownerId: integer("owner_id").references(() => users.id),
  tenantId: integer("tenant_id").references(() => users.id),
  monthlyMaintenance: decimal("monthly_maintenance", { precision: 10, scale: 2 }),
  isOccupied: boolean("is_occupied").default(false),
  parkingSlots: integer("parking_slots").default(0),
  createdAt: timestamp("created_at").defaultNow()
});

// Visitor Management
export const visitors = pgTable("visitors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  visitorType: visitorTypeEnum("visitor_type").notNull(),
  flatId: integer("flat_id").references(() => flats.id).notNull(),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  purpose: text("purpose"),
  vehicleNumber: varchar("vehicle_number", { length: 20 }),
  photoUrl: text("photo_url"),
  idProofUrl: text("id_proof_url"),
  status: visitorStatusEnum("status").default('pending'),
  approvedBy: integer("approved_by").references(() => users.id),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  expectedDuration: integer("expected_duration_minutes"),
  qrCode: text("qr_code"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Staff Management
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  category: staffCategoryEnum("category").notNull(),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  shiftTiming: varchar("shift_timing", { length: 50 }),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  joiningDate: timestamp("joining_date"),
  idProofType: varchar("id_proof_type", { length: 50 }),
  idProofNumber: varchar("id_proof_number", { length: 100 }),
  photoUrl: text("photo_url"),
  address: text("address"),
  emergencyContact: varchar("emergency_contact", { length: 15 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const staffAttendance = pgTable("staff_attendance", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").references(() => staff.id).notNull(),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  date: timestamp("date").notNull(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  hoursWorked: decimal("hours_worked", { precision: 4, scale: 2 }),
  status: varchar("status", { length: 20 }).default('present'), // present, absent, late, half_day
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// Complaints
export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  priority: complaintPriorityEnum("priority").default('medium'),
  status: complaintStatusEnum("status").default('open'),
  flatId: integer("flat_id").references(() => flats.id).notNull(),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  raisedBy: integer("raised_by").references(() => users.id).notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  location: varchar("location", { length: 255 }),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
  images: jsonb("images").default([]),
  resolutionNotes: text("resolution_notes"),
  satisfactionRating: integer("satisfaction_rating"), // 1-5
  escalationLevel: integer("escalation_level").default(0),
  dueDate: timestamp("due_date"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Announcements & Community
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // emergency, event, general, poll
  priority: varchar("priority", { length: 20 }).default('medium'),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  targetAudience: jsonb("target_audience").default('all'), // all, specific_buildings, specific_flats
  attachments: jsonb("attachments").default([]),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcement_id").references(() => announcements.id),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // array of options
  allowMultiple: boolean("allow_multiple").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const pollVotes = pgTable("poll_votes", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").references(() => polls.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  selectedOptions: jsonb("selected_options").notNull(), // array of selected option indices
  createdAt: timestamp("created_at").defaultNow()
});

// Maintenance & Finance
export const maintenanceBills = pgTable("maintenance_bills", {
  id: serial("id").primaryKey(),
  flatId: integer("flat_id").references(() => flats.id).notNull(),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }).notNull(),
  additionalCharges: jsonb("additional_charges").default({}),
  lateFee: decimal("late_fee", { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").default('pending'),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  transactionId: varchar("transaction_id", { length: 255 }),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  vendor: varchar("vendor", { length: 255 }),
  billNumber: varchar("bill_number", { length: 100 }),
  billDate: timestamp("bill_date"),
  paymentDate: timestamp("payment_date"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  approvedBy: integer("approved_by").references(() => users.id),
  attachments: jsonb("attachments").default([]),
  createdAt: timestamp("created_at").defaultNow()
});

// Amenities
export const amenities = pgTable("amenities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  dailyRate: decimal("daily_rate", { precision: 10, scale: 2 }),
  capacity: integer("capacity"),
  availableHours: jsonb("available_hours").default({}), // {start: "06:00", end: "22:00"}
  rules: text("rules"),
  images: jsonb("images").default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

export const amenityBookings = pgTable("amenity_bookings", {
  id: serial("id").primaryKey(),
  amenityId: integer("amenity_id").references(() => amenities.id).notNull(),
  flatId: integer("flat_id").references(() => flats.id).notNull(),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  bookedBy: integer("booked_by").references(() => users.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  purpose: text("purpose"),
  guests: integer("guests").default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 20 }).default('confirmed'), // confirmed, cancelled, completed
  paymentStatus: paymentStatusEnum("payment_status").default('pending'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  accessLevel: varchar("access_level", { length: 20 }).default('all'), // all, admin, specific
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Messaging
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 20 }).default('text'), // text, image, file, voice
  attachmentUrl: text("attachment_url"),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  isGroupMessage: boolean("is_group_message").default(false),
  groupId: varchar("group_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow()
});

// Security & Audit
export const securityAlerts = pgTable("security_alerts", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(), // panic, intrusion, fire, medical
  description: text("description"),
  location: varchar("location", { length: 255 }),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  triggeredBy: integer("triggered_by").references(() => users.id),
  priority: varchar("priority", { length: 20 }).default('high'),
  status: varchar("status", { length: 20 }).default('active'), // active, acknowledged, resolved
  acknowledgedBy: integer("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: integer("entity_id"),
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow()
});

// Inventory
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  purchaseDate: timestamp("purchase_date"),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }),
  currentValue: decimal("current_value", { precision: 10, scale: 2 }),
  condition: varchar("condition", { length: 50 }),
  location: varchar("location", { length: 255 }),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  addedBy: integer("added_by").references(() => users.id).notNull(),
  warrantyExpiry: timestamp("warranty_expiry"),
  maintenanceSchedule: jsonb("maintenance_schedule"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Relations
export const societiesRelations = relations(societies, ({ many }) => ({
  users: many(users),
  buildings: many(buildings),
  flats: many(flats),
  visitors: many(visitors),
  staff: many(staff),
  complaints: many(complaints),
  announcements: many(announcements),
  expenses: many(expenses),
  amenities: many(amenities),
  documents: many(documents),
  messages: many(messages),
  auditLogs: many(auditLogs)
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  society: one(societies, {
    fields: [users.societyId],
    references: [societies.id]
  }),
  ownedFlats: many(flats, { relationName: "owner" }),
  tenantFlats: many(flats, { relationName: "tenant" }),
  raisedComplaints: many(complaints, { relationName: "complainant" }),
  assignedComplaints: many(complaints, { relationName: "assignee" }),
  announcements: many(announcements),
  amenityBookings: many(amenityBookings),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" })
}));

export const flatsRelations = relations(flats, ({ one, many }) => ({
  building: one(buildings, {
    fields: [flats.buildingId],
    references: [buildings.id]
  }),
  society: one(societies, {
    fields: [flats.societyId],
    references: [societies.id]
  }),
  owner: one(users, {
    fields: [flats.ownerId],
    references: [users.id],
    relationName: "owner"
  }),
  tenant: one(users, {
    fields: [flats.tenantId],
    references: [users.id],
    relationName: "tenant"
  }),
  visitors: many(visitors),
  complaints: many(complaints),
  maintenanceBills: many(maintenanceBills),
  amenityBookings: many(amenityBookings)
}));

export const visitorsRelations = relations(visitors, ({ one }) => ({
  flat: one(flats, {
    fields: [visitors.flatId],
    references: [flats.id]
  }),
  society: one(societies, {
    fields: [visitors.societyId],
    references: [societies.id]
  }),
  approver: one(users, {
    fields: [visitors.approvedBy],
    references: [users.id]
  })
}));

export const complaintsRelations = relations(complaints, ({ one, many }) => ({
  flat: one(flats, {
    fields: [complaints.flatId],
    references: [flats.id]
  }),
  society: one(societies, {
    fields: [complaints.societyId],
    references: [societies.id]
  }),
  complainant: one(users, {
    fields: [complaints.raisedBy],
    references: [users.id],
    relationName: "complainant"
  }),
  assignee: one(users, {
    fields: [complaints.assignedTo],
    references: [users.id],
    relationName: "assignee"
  })
}));

// Insert/Select schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true
});

export const insertVisitorSchema = createInsertSchema(visitors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  qrCode: true,
  checkInTime: true,
  checkOutTime: true
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAmenityBookingSchema = createInsertSchema(amenityBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type Visitor = typeof visitors.$inferSelect;

export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staff.$inferSelect;

export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaints.$inferSelect;

export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

export type InsertAmenityBooking = z.infer<typeof insertAmenityBookingSchema>;
export type AmenityBooking = typeof amenityBookings.$inferSelect;

export type Society = typeof societies.$inferSelect;
export type Flat = typeof flats.$inferSelect;
export type Building = typeof buildings.$inferSelect;
export type MaintenanceBill = typeof maintenanceBills.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Amenity = typeof amenities.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type SecurityAlert = typeof securityAlerts.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
