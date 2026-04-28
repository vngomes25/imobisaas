import { eq, and, desc, sql, inArray, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import path from "path";
import {
  InsertUser, users,
  owners, InsertOwner,
  properties, InsertProperty,
  tenants, InsertTenant,
  contracts, InsertContract,
  payments, InsertPayment,
  ownerTransfers, InsertOwnerTransfer,
  maintenances, InsertMaintenance,
  inspections, InsertInspection,
  inspectionItems, InsertInspectionItem,
  documents, InsertDocument,
  agencySettings, InsertAgencySettings,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Migrations ──────────────────────────────────────────────────────────
export async function runMigrations(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.warn("[DB] DATABASE_URL not set, skipping migrations.");
    return;
  }
  const db = await getDb();
  if (!db) return;
  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  await migrate(db as any, { migrationsFolder });
}

// ─── Users ───────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(id: number, role: "user" | "admin" | "owner" | "tenant") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function linkUserToOwner(userId: number, ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Remove existing links for this userId
  await db.update(owners).set({ userId: null }).where(eq(owners.userId, userId));
  await db.update(owners).set({ userId }).where(eq(owners.id, ownerId));
  await db.update(users).set({ role: "owner" }).where(eq(users.id, userId));
}

export async function linkUserToTenant(userId: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Remove existing links for this userId
  await db.update(tenants).set({ userId: null }).where(eq(tenants.userId, userId));
  await db.update(tenants).set({ userId }).where(eq(tenants.id, tenantId));
  await db.update(users).set({ role: "tenant" }).where(eq(users.id, userId));
}

// ─── Owners ──────────────────────────────────────────────────────────────
export async function listOwners() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(owners).orderBy(desc(owners.createdAt));
}

export async function getOwnerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(owners).where(eq(owners.id, id)).limit(1);
  return result[0];
}

export async function getOwnerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(owners).where(eq(owners.userId, userId)).limit(1);
  return result[0];
}

export async function createOwner(data: Omit<InsertOwner, "id">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(owners).values(data);
  return { id: result[0].insertId };
}

export async function updateOwner(id: number, data: Partial<InsertOwner>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(owners).set(data).where(eq(owners.id, id));
}

export async function deleteOwner(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(owners).where(eq(owners.id, id));
}

// ─── Properties ──────────────────────────────────────────────────────────
export async function listProperties(filters?: { ownerId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.ownerId) conditions.push(eq(properties.ownerId, filters.ownerId));
  if (filters?.status) conditions.push(eq(properties.status, filters.status as any));
  if (conditions.length > 0) {
    return db.select().from(properties).where(and(...conditions)).orderBy(desc(properties.createdAt));
  }
  return db.select().from(properties).orderBy(desc(properties.createdAt));
}

export async function getPropertyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  return result[0];
}

export async function createProperty(data: Omit<InsertProperty, "id">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(properties).values(data);
  return { id: result[0].insertId };
}

export async function updateProperty(id: number, data: Partial<InsertProperty>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(properties).set(data).where(eq(properties.id, id));
}

export async function deleteProperty(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(properties).where(eq(properties.id, id));
}

// ─── Tenants ─────────────────────────────────────────────────────────────
export async function listTenants() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tenants).orderBy(desc(tenants.createdAt));
}

export async function getTenantById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return result[0];
}

export async function getTenantByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tenants).where(eq(tenants.userId, userId)).limit(1);
  return result[0];
}

export async function createTenant(data: Omit<InsertTenant, "id">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(tenants).values(data);
  return { id: result[0].insertId };
}

export async function updateTenant(id: number, data: Partial<InsertTenant>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(tenants).set(data).where(eq(tenants.id, id));
}

export async function deleteTenant(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(tenants).where(eq(tenants.id, id));
}

// ─── Contracts ───────────────────────────────────────────────────────────
export async function listContracts(filters?: { ownerId?: number; tenantId?: number; propertyId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.ownerId) conditions.push(eq(contracts.ownerId, filters.ownerId));
  if (filters?.tenantId) conditions.push(eq(contracts.tenantId, filters.tenantId));
  if (filters?.propertyId) conditions.push(eq(contracts.propertyId, filters.propertyId));
  if (filters?.status) conditions.push(eq(contracts.status, filters.status as any));
  if (conditions.length > 0) {
    return db.select().from(contracts).where(and(...conditions)).orderBy(desc(contracts.createdAt));
  }
  return db.select().from(contracts).orderBy(desc(contracts.createdAt));
}

export async function getContractById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return result[0];
}

export async function createContract(data: Omit<InsertContract, "id">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(contracts).values(data);
  return { id: result[0].insertId };
}

export async function updateContract(id: number, data: Partial<InsertContract>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(contracts).set(data).where(eq(contracts.id, id));
}

// ─── Payments ────────────────────────────────────────────────────────────
export async function listPayments(filters?: { contractId?: number; tenantId?: number; ownerId?: number; status?: string; referenceMonth?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.contractId) conditions.push(eq(payments.contractId, filters.contractId));
  if (filters?.tenantId) conditions.push(eq(payments.tenantId, filters.tenantId));
  if (filters?.ownerId) conditions.push(eq(payments.ownerId, filters.ownerId));
  if (filters?.status) conditions.push(eq(payments.status, filters.status as any));
  if (filters?.referenceMonth) conditions.push(eq(payments.referenceMonth, filters.referenceMonth));
  const rows = conditions.length > 0
    ? await db.select({ payment: payments, tenantName: tenants.name, ownerName: owners.name, propertyTitle: properties.title })
        .from(payments)
        .leftJoin(tenants, eq(payments.tenantId, tenants.id))
        .leftJoin(owners, eq(payments.ownerId, owners.id))
        .leftJoin(contracts, eq(payments.contractId, contracts.id))
        .leftJoin(properties, eq(contracts.propertyId, properties.id))
        .where(and(...conditions))
        .orderBy(desc(payments.dueDate))
    : await db.select({ payment: payments, tenantName: tenants.name, ownerName: owners.name, propertyTitle: properties.title })
        .from(payments)
        .leftJoin(tenants, eq(payments.tenantId, tenants.id))
        .leftJoin(owners, eq(payments.ownerId, owners.id))
        .leftJoin(contracts, eq(payments.contractId, contracts.id))
        .leftJoin(properties, eq(contracts.propertyId, properties.id))
        .orderBy(desc(payments.dueDate));
  return rows.map(r => ({ ...r.payment, tenantName: r.tenantName, ownerName: r.ownerName, propertyTitle: r.propertyTitle }));
}

export async function getPaymentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return result[0];
}

export async function createPayment(data: Omit<InsertPayment, "id">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(payments).values(data);
  return { id: result[0].insertId };
}

export async function updatePayment(id: number, data: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(payments).set(data).where(eq(payments.id, id));
}

// ─── Owner Transfers ─────────────────────────────────────────────────────
export async function listOwnerTransfers(filters?: { ownerId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.ownerId) conditions.push(eq(ownerTransfers.ownerId, filters.ownerId));
  if (filters?.status) conditions.push(eq(ownerTransfers.status, filters.status as any));
  const rows = conditions.length > 0
    ? await db.select({ transfer: ownerTransfers, ownerName: owners.name, ownerPixKey: owners.pixKey })
        .from(ownerTransfers)
        .leftJoin(owners, eq(ownerTransfers.ownerId, owners.id))
        .where(and(...conditions))
        .orderBy(desc(ownerTransfers.createdAt))
    : await db.select({ transfer: ownerTransfers, ownerName: owners.name, ownerPixKey: owners.pixKey })
        .from(ownerTransfers)
        .leftJoin(owners, eq(ownerTransfers.ownerId, owners.id))
        .orderBy(desc(ownerTransfers.createdAt));
  return rows.map(r => ({ ...r.transfer, ownerName: r.ownerName, ownerPixKey: r.ownerPixKey }));
}

export async function createOwnerTransfer(data: Omit<InsertOwnerTransfer, "id">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(ownerTransfers).values(data);
  return { id: result[0].insertId };
}

export async function updateOwnerTransfer(id: number, data: Partial<InsertOwnerTransfer>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(ownerTransfers).set(data).where(eq(ownerTransfers.id, id));
}

// ─── Maintenances ────────────────────────────────────────────────────────
export async function listMaintenances(filters?: { propertyId?: number; status?: string; requestedById?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.propertyId) conditions.push(eq(maintenances.propertyId, filters.propertyId));
  if (filters?.status) conditions.push(eq(maintenances.status, filters.status as any));
  if (filters?.requestedById) conditions.push(eq(maintenances.requestedById, filters.requestedById));
  const rows = conditions.length > 0
    ? await db.select({ maintenance: maintenances, propertyTitle: properties.title })
        .from(maintenances)
        .leftJoin(properties, eq(maintenances.propertyId, properties.id))
        .where(and(...conditions))
        .orderBy(desc(maintenances.createdAt))
    : await db.select({ maintenance: maintenances, propertyTitle: properties.title })
        .from(maintenances)
        .leftJoin(properties, eq(maintenances.propertyId, properties.id))
        .orderBy(desc(maintenances.createdAt));
  return rows.map((r: { maintenance: typeof maintenances.$inferSelect; propertyTitle: string | null }) => ({ ...r.maintenance, propertyTitle: r.propertyTitle }));
}

export async function getMaintenanceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(maintenances).where(eq(maintenances.id, id)).limit(1);
  return result[0];
}

export async function createMaintenance(data: Omit<InsertMaintenance, "id">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(maintenances).values(data);
  return { id: result[0].insertId };
}

export async function updateMaintenance(id: number, data: Partial<InsertMaintenance>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(maintenances).set(data).where(eq(maintenances.id, id));
}

// ─── Inspections ─────────────────────────────────────────────────────────
export async function listInspections(filters?: { propertyId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.propertyId) conditions.push(eq(inspections.propertyId, filters.propertyId));
  if (filters?.status) conditions.push(eq(inspections.status, filters.status as any));
  if (conditions.length > 0) {
    return db.select().from(inspections).where(and(...conditions)).orderBy(desc(inspections.scheduledDate));
  }
  return db.select().from(inspections).orderBy(desc(inspections.scheduledDate));
}

export async function getInspectionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inspections).where(eq(inspections.id, id)).limit(1);
  return result[0];
}

export async function createInspection(data: Omit<InsertInspection, "id">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(inspections).values(data);
  return { id: result[0].insertId };
}

export async function updateInspection(id: number, data: Partial<InsertInspection>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(inspections).set(data).where(eq(inspections.id, id));
}

// ─── Inspection Items ────────────────────────────────────────────────────
export async function listInspectionItems(inspectionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inspectionItems).where(eq(inspectionItems.inspectionId, inspectionId));
}

export async function createInspectionItem(data: Omit<InsertInspectionItem, "id">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(inspectionItems).values(data);
  return { id: result[0].insertId };
}

export async function updateInspectionItem(id: number, data: Partial<InsertInspectionItem>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(inspectionItems).set(data).where(eq(inspectionItems.id, id));
}

export async function deleteInspectionItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(inspectionItems).where(eq(inspectionItems.id, id));
}

// ─── Documents ───────────────────────────────────────────────────────────
export async function listDocuments(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(
    and(eq(documents.entityType, entityType as any), eq(documents.entityId, entityId))
  ).orderBy(desc(documents.createdAt));
}

export async function createDocument(data: Omit<InsertDocument, "id">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(documents).values(data);
  return { id: result[0].insertId };
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(documents).where(eq(documents.id, id));
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return {
    totalProperties: 0, availableProperties: 0, rentedProperties: 0, maintenanceProperties: 0,
    activeContracts: 0, totalOwners: 0, totalTenants: 0, pendingPayments: 0, overduePayments: 0,
    totalRevenue: "0", pendingMaintenances: 0, expiringContracts: 0, monthlyRevenue: [] as { month: string; revenue: string }[],
  };

  const [propStats] = await db.select({
    total: sql<number>`COUNT(*)`,
    available: sql<number>`SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END)`,
    rented: sql<number>`SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END)`,
    maintenance: sql<number>`SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END)`,
  }).from(properties);

  const [contractStats] = await db.select({
    active: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
  }).from(contracts);

  // Contracts expiring in next 60 days
  const now = Date.now();
  const in60days = now + 60 * 24 * 60 * 60 * 1000;
  const [expiringStats] = await db.select({
    expiring: sql<number>`SUM(CASE WHEN status = 'active' AND endDate BETWEEN ${now} AND ${in60days} THEN 1 ELSE 0 END)`,
  }).from(contracts);

  const [ownerCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(owners);
  const [tenantCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(tenants);

  const [paymentStats] = await db.select({
    pending: sql<number>`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`,
    overdue: sql<number>`SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END)`,
    totalRevenue: sql<string>`COALESCE(SUM(CASE WHEN status = 'paid' THEN totalAmount ELSE 0 END), 0)`,
  }).from(payments);

  const [maintenanceStats] = await db.select({
    pending: sql<number>`SUM(CASE WHEN status IN ('open', 'in_progress', 'waiting_parts') THEN 1 ELSE 0 END)`,
  }).from(maintenances);

  // Monthly revenue — last 6 months
  const monthlyRevenue = await db.select({
    month: sql<string>`DATE_FORMAT(FROM_UNIXTIME(paidAt / 1000), '%Y-%m')`,
    revenue: sql<string>`COALESCE(SUM(totalAmount), 0)`,
  }).from(payments)
    .where(and(
      eq(payments.status, "paid"),
      sql`paidAt >= ${now - 180 * 24 * 60 * 60 * 1000}`,
    ))
    .groupBy(sql`DATE_FORMAT(FROM_UNIXTIME(paidAt / 1000), '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(FROM_UNIXTIME(paidAt / 1000), '%Y-%m')`);

  // Monthly overdue amounts — last 6 months (by dueDate)
  const monthlyOverdue = await db.select({
    month: sql<string>`DATE_FORMAT(FROM_UNIXTIME(dueDate / 1000), '%Y-%m')`,
    overdue: sql<string>`COALESCE(SUM(totalAmount), 0)`,
  }).from(payments)
    .where(and(
      eq(payments.status, "overdue"),
      sql`dueDate >= ${now - 180 * 24 * 60 * 60 * 1000}`,
    ))
    .groupBy(sql`DATE_FORMAT(FROM_UNIXTIME(dueDate / 1000), '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(FROM_UNIXTIME(dueDate / 1000), '%Y-%m')`);

  // Payments status summary for current month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const [currentMonthPayments] = await db.select({
    paid: sql<number>`SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)`,
    pending: sql<number>`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`,
    overdue: sql<number>`SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END)`,
    paidAmount: sql<string>`COALESCE(SUM(CASE WHEN status = 'paid' THEN totalAmount ELSE 0 END), 0)`,
    pendingAmount: sql<string>`COALESCE(SUM(CASE WHEN status = 'pending' THEN totalAmount ELSE 0 END), 0)`,
    overdueAmount: sql<string>`COALESCE(SUM(CASE WHEN status = 'overdue' THEN totalAmount ELSE 0 END), 0)`,
  }).from(payments).where(sql`dueDate >= ${startOfMonth}`);

  return {
    totalProperties: propStats?.total ?? 0,
    availableProperties: propStats?.available ?? 0,
    rentedProperties: propStats?.rented ?? 0,
    maintenanceProperties: propStats?.maintenance ?? 0,
    activeContracts: contractStats?.active ?? 0,
    totalOwners: ownerCount?.count ?? 0,
    totalTenants: tenantCount?.count ?? 0,
    pendingPayments: paymentStats?.pending ?? 0,
    overduePayments: paymentStats?.overdue ?? 0,
    totalRevenue: paymentStats?.totalRevenue ?? "0",
    pendingMaintenances: maintenanceStats?.pending ?? 0,
    expiringContracts: expiringStats?.expiring ?? 0,
    monthlyRevenue: monthlyRevenue as { month: string; revenue: string }[],
    monthlyOverdue: monthlyOverdue as { month: string; overdue: string }[],
    currentMonthPayments: {
      paid: currentMonthPayments?.paid ?? 0,
      pending: currentMonthPayments?.pending ?? 0,
      overdue: currentMonthPayments?.overdue ?? 0,
      paidAmount: parseFloat(currentMonthPayments?.paidAmount ?? "0"),
      pendingAmount: parseFloat(currentMonthPayments?.pendingAmount ?? "0"),
      overdueAmount: parseFloat(currentMonthPayments?.overdueAmount ?? "0"),
    },
  };
}

// ─── Generate Monthly Payments ───────────────────────────────────────────
export async function generateMonthlyPayments(referenceMonth: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const activeContracts = await db.select().from(contracts).where(eq(contracts.status, "active"));
  const results: { contractId: number; paymentId: number }[] = [];

  for (const contract of activeContracts) {
    // Check if payment already exists for this month
    const existing = await db.select().from(payments).where(
      and(eq(payments.contractId, contract.id), eq(payments.referenceMonth, referenceMonth))
    ).limit(1);
    if (existing.length > 0) continue;

    const [year, month] = referenceMonth.split("-").map(Number);
    const dueDate = new Date(year, month - 1, contract.paymentDueDay).getTime();
    const rentAmount = parseFloat(contract.rentValue);
    const condoAmount = contract.condoFee ? parseFloat(contract.condoFee) : 0;
    const iptuAmount = contract.iptuValue ? parseFloat(contract.iptuValue) : 0;
    const totalAmount = rentAmount + condoAmount + iptuAmount;
    const adminFeeAmount = rentAmount * (parseFloat(contract.adminFeePercent) / 100);
    const ownerTransferAmount = totalAmount - adminFeeAmount;

    const result = await db.insert(payments).values({
      contractId: contract.id,
      tenantId: contract.tenantId,
      ownerId: contract.ownerId,
      referenceMonth,
      dueDate,
      rentAmount: rentAmount.toFixed(2),
      condoAmount: condoAmount.toFixed(2),
      iptuAmount: iptuAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      adminFeeAmount: adminFeeAmount.toFixed(2),
      ownerTransferAmount: ownerTransferAmount.toFixed(2),
      status: "pending",
    });
    results.push({ contractId: contract.id, paymentId: result[0].insertId });
  }
  return results;
}

// ─── Contract Renewal ────────────────────────────────────────────────────
export async function renewContract(id: number, newEndDate: number, newRentValue?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const contract = await getContractById(id);
  if (!contract) throw new Error("Contract not found");
  const updateData: Partial<InsertContract> = {
    startDate: contract.endDate,
    endDate: newEndDate,
    status: "active",
  };
  if (newRentValue) updateData.rentValue = newRentValue;
  await db.update(contracts).set(updateData).where(eq(contracts.id, id));
}

// ─── Agency Settings ─────────────────────────────────────────────────────
export async function getSettings() {
  const db = await getDb();
  if (!db) return { id: 1, agencyName: "Imobiliária", agencySlogan: null, agencyCnpj: null, agencyPhone: null, agencyEmail: null, agencyAddress: null, agencyPixKey: null, agencyBank: null, agencyBankAgency: null, agencyBankAccount: null, updatedAt: new Date() };
  const rows = await db.select().from(agencySettings).limit(1);
  if (rows.length === 0) {
    // Create default settings row
    await db.insert(agencySettings).values({ agencyName: "Imobiliária" });
    const [row] = await db.select().from(agencySettings).limit(1);
    return row;
  }
  return rows[0];
}

export async function updateSettings(data: Partial<InsertAgencySettings>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const rows = await db.select().from(agencySettings).limit(1);
  if (rows.length === 0) {
    await db.insert(agencySettings).values({ agencyName: "Imobiliária", ...data });
  } else {
    await db.update(agencySettings).set(data).where(eq(agencySettings.id, rows[0].id));
  }
}
