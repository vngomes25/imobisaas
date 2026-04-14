import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, bigint, json } from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "owner", "tenant"]).default("user").notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Owners (Proprietários) ──────────────────────────────────────────────
export const owners = mysqlTable("owners", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  cpfCnpj: varchar("cpfCnpj", { length: 20 }),
  address: text("address"),
  bankName: varchar("bankName", { length: 128 }),
  bankAgency: varchar("bankAgency", { length: 20 }),
  bankAccount: varchar("bankAccount", { length: 32 }),
  pixKey: varchar("pixKey", { length: 128 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Owner = typeof owners.$inferSelect;
export type InsertOwner = typeof owners.$inferInsert;

// ─── Properties (Imóveis) ────────────────────────────────────────────────
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").references(() => owners.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["apartment", "house", "commercial", "land", "other"]).default("apartment").notNull(),
  status: mysqlEnum("status", ["available", "rented", "maintenance"]).default("available").notNull(),
  addressStreet: varchar("addressStreet", { length: 255 }),
  addressNumber: varchar("addressNumber", { length: 20 }),
  addressComplement: varchar("addressComplement", { length: 128 }),
  addressNeighborhood: varchar("addressNeighborhood", { length: 128 }),
  addressCity: varchar("addressCity", { length: 128 }),
  addressState: varchar("addressState", { length: 64 }),
  addressZip: varchar("addressZip", { length: 16 }),
  bedrooms: int("bedrooms").default(0),
  bathrooms: int("bathrooms").default(0),
  parkingSpaces: int("parkingSpaces").default(0),
  area: decimal("area", { precision: 10, scale: 2 }),
  rentValue: decimal("rentValue", { precision: 12, scale: 2 }),
  condoFee: decimal("condoFee", { precision: 12, scale: 2 }),
  iptuValue: decimal("iptuValue", { precision: 12, scale: 2 }),
  description: text("description"),
  photos: json("photos").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

// ─── Tenants (Inquilinos) ────────────────────────────────────────────────
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  cpfCnpj: varchar("cpfCnpj", { length: 20 }),
  address: text("address"),
  emergencyContact: varchar("emergencyContact", { length: 255 }),
  emergencyPhone: varchar("emergencyPhone", { length: 32 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

// ─── Contracts (Contratos) ───────────────────────────────────────────────
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").references(() => properties.id).notNull(),
  tenantId: int("tenantId").references(() => tenants.id).notNull(),
  ownerId: int("ownerId").references(() => owners.id).notNull(),
  status: mysqlEnum("status", ["active", "expired", "terminated", "pending"]).default("pending").notNull(),
  startDate: bigint("startDate", { mode: "number" }).notNull(),
  endDate: bigint("endDate", { mode: "number" }).notNull(),
  rentValue: decimal("rentValue", { precision: 12, scale: 2 }).notNull(),
  adminFeePercent: decimal("adminFeePercent", { precision: 5, scale: 2 }).notNull(),
  condoFee: decimal("condoFee", { precision: 12, scale: 2 }),
  iptuValue: decimal("iptuValue", { precision: 12, scale: 2 }),
  paymentDueDay: int("paymentDueDay").default(10).notNull(),
  adjustmentIndex: varchar("adjustmentIndex", { length: 32 }).default("IGPM"),
  guaranteeType: mysqlEnum("guaranteeType", ["deposit", "guarantor", "insurance", "none"]).default("none"),
  guaranteeDetails: text("guaranteeDetails"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

// ─── Payments (Cobranças / Boletos) ──────────────────────────────────────
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").references(() => contracts.id).notNull(),
  tenantId: int("tenantId").references(() => tenants.id).notNull(),
  ownerId: int("ownerId").references(() => owners.id).notNull(),
  referenceMonth: varchar("referenceMonth", { length: 7 }).notNull(),
  dueDate: bigint("dueDate", { mode: "number" }).notNull(),
  rentAmount: decimal("rentAmount", { precision: 12, scale: 2 }).notNull(),
  condoAmount: decimal("condoAmount", { precision: 12, scale: 2 }),
  iptuAmount: decimal("iptuAmount", { precision: 12, scale: 2 }),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  adminFeeAmount: decimal("adminFeeAmount", { precision: 12, scale: 2 }).notNull(),
  ownerTransferAmount: decimal("ownerTransferAmount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "overdue", "cancelled"]).default("pending").notNull(),
  paidAt: bigint("paidAt", { mode: "number" }),
  paidAmount: decimal("paidAmount", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ─── Owner Transfers (Repasses) ──────────────────────────────────────────
export const ownerTransfers = mysqlTable("ownerTransfers", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").references(() => owners.id).notNull(),
  paymentId: int("paymentId").references(() => payments.id).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed"]).default("pending").notNull(),
  transferredAt: bigint("transferredAt", { mode: "number" }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OwnerTransfer = typeof ownerTransfers.$inferSelect;
export type InsertOwnerTransfer = typeof ownerTransfers.$inferInsert;

// ─── Maintenances (Manutenções) ──────────────────────────────────────────
export const maintenances = mysqlTable("maintenances", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").references(() => properties.id).notNull(),
  contractId: int("contractId").references(() => contracts.id),
  requestedById: int("requestedById").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["plumbing", "electrical", "structural", "painting", "appliance", "general", "other"]).default("general").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "waiting_parts", "completed", "cancelled"]).default("open").notNull(),
  photos: json("photos").$type<string[]>(),
  cost: decimal("cost", { precision: 12, scale: 2 }),
  resolvedAt: bigint("resolvedAt", { mode: "number" }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Maintenance = typeof maintenances.$inferSelect;
export type InsertMaintenance = typeof maintenances.$inferInsert;

// ─── Inspections (Vistorias) ─────────────────────────────────────────────
export const inspections = mysqlTable("inspections", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").references(() => properties.id).notNull(),
  contractId: int("contractId").references(() => contracts.id),
  inspectorId: int("inspectorId").references(() => users.id),
  type: mysqlEnum("type", ["entry", "exit", "periodic", "maintenance"]).default("periodic").notNull(),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled").notNull(),
  scheduledDate: bigint("scheduledDate", { mode: "number" }).notNull(),
  completedDate: bigint("completedDate", { mode: "number" }),
  generalCondition: mysqlEnum("generalCondition", ["excellent", "good", "fair", "poor"]),
  overallNotes: text("overallNotes"),
  photos: json("photos").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;

// ─── Inspection Items (Itens da Vistoria) ────────────────────────────────
export const inspectionItems = mysqlTable("inspectionItems", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspectionId").references(() => inspections.id).notNull(),
  area: varchar("area", { length: 128 }).notNull(),
  item: varchar("item", { length: 255 }).notNull(),
  condition: mysqlEnum("condition", ["excellent", "good", "fair", "poor", "damaged"]).default("good").notNull(),
  notes: text("notes"),
  photos: json("photos").$type<string[]>(),
});

export type InspectionItem = typeof inspectionItems.$inferSelect;
export type InsertInspectionItem = typeof inspectionItems.$inferInsert;

// ─── Documents ───────────────────────────────────────────────────────────
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["property", "contract", "owner", "tenant", "inspection", "maintenance"]).notNull(),
  entityId: int("entityId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 512 }),
  mimeType: varchar("mimeType", { length: 128 }),
  uploadedById: int("uploadedById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ─── Agency Settings ─────────────────────────────────────────────────────
export const agencySettings = mysqlTable("agencySettings", {
  id: int("id").autoincrement().primaryKey(),
  agencyName: varchar("agencyName", { length: 255 }).default("Imobiliária").notNull(),
  agencySlogan: varchar("agencySlogan", { length: 255 }),
  agencyCnpj: varchar("agencyCnpj", { length: 20 }),
  agencyPhone: varchar("agencyPhone", { length: 32 }),
  agencyEmail: varchar("agencyEmail", { length: 320 }),
  agencyAddress: text("agencyAddress"),
  agencyPixKey: varchar("agencyPixKey", { length: 128 }),
  agencyBank: varchar("agencyBank", { length: 128 }),
  agencyBankAgency: varchar("agencyBankAgency", { length: 20 }),
  agencyBankAccount: varchar("agencyBankAccount", { length: 32 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgencySettings = typeof agencySettings.$inferSelect;
export type InsertAgencySettings = typeof agencySettings.$inferInsert;
