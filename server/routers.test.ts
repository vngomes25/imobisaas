import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ────────────────────────────────────────────────────────────────

type CookieCall = { name: string; options: Record<string, unknown> };

function createAdminContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  const ctx: TrpcContext = {
    user: {
      id: 1,
      openId: "admin-001",
      email: "admin@imobisaas.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createTenantContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: {
      id: 2,
      openId: "tenant-001",
      email: "tenant@test.com",
      name: "Tenant User",
      loginMethod: "manus",
      role: "tenant",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

function createOwnerContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: {
      id: 3,
      openId: "owner-001",
      email: "owner@test.com",
      name: "Owner User",
      loginMethod: "manus",
      role: "owner",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

function createUnauthContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

// ─── Auth Tests ─────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("auth.me", () => {
  it("returns user for authenticated context", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.role).toBe("admin");
    expect(result?.name).toBe("Admin User");
  });

  it("returns null for unauthenticated context", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

// ─── Admin Procedure Access Control ─────────────────────────────────────────

describe("admin procedure access control", () => {
  it("allows admin to access admin-only endpoints", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // dashboard.stats is admin-only
    // Should not throw (may fail due to DB, but should not throw FORBIDDEN)
    try {
      await caller.dashboard.stats();
    } catch (e: any) {
      // DB errors are OK, but FORBIDDEN is not
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });

  it("blocks tenant from admin-only endpoints", async () => {
    const { ctx } = createTenantContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.dashboard.stats();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("blocks owner from admin-only endpoints", async () => {
    const { ctx } = createOwnerContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.dashboard.stats();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("blocks unauthenticated users from admin endpoints", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.dashboard.stats();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });
});

// ─── Protected Procedure Access Control ─────────────────────────────────────

describe("protected procedure access control", () => {
  it("allows authenticated users to access protected endpoints", async () => {
    const { ctx } = createTenantContext();
    const caller = appRouter.createCaller(ctx);
    // getMyProfile is protected, should not throw UNAUTHORIZED
    try {
      await caller.tenants.getMyProfile();
    } catch (e: any) {
      // DB errors are OK, but UNAUTHORIZED is not
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });

  it("blocks unauthenticated users from protected endpoints", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.tenants.getMyProfile();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });
});

// ─── Router Structure Tests ─────────────────────────────────────────────────

describe("router structure", () => {
  it("has all expected routers", () => {
    const routerKeys = Object.keys(appRouter._def.procedures);
    // Check top-level namespaces exist
    expect(routerKeys).toContain("auth.me");
    expect(routerKeys).toContain("auth.logout");
    expect(routerKeys).toContain("owners.list");
    expect(routerKeys).toContain("owners.getMyProfile");
    expect(routerKeys).toContain("properties.list");
    expect(routerKeys).toContain("properties.listByOwner");
    expect(routerKeys).toContain("tenants.list");
    expect(routerKeys).toContain("tenants.getMyProfile");
    expect(routerKeys).toContain("contracts.list");
    expect(routerKeys).toContain("contracts.listByOwner");
    expect(routerKeys).toContain("contracts.listByTenant");
    expect(routerKeys).toContain("financial.listPayments");
    expect(routerKeys).toContain("financial.listPaymentsByTenant");
    expect(routerKeys).toContain("financial.listTransfersByOwner");
    expect(routerKeys).toContain("financial.generateMonthlyPayments");
    expect(routerKeys).toContain("financial.markAsPaid");
    expect(routerKeys).toContain("financial.markTransferCompleted");
    expect(routerKeys).toContain("maintenances.list");
    expect(routerKeys).toContain("maintenances.listMyRequests");
    expect(routerKeys).toContain("maintenances.create");
    expect(routerKeys).toContain("inspections.list");
    expect(routerKeys).toContain("inspections.create");
    expect(routerKeys).toContain("documents.list");
    expect(routerKeys).toContain("documents.upload");
    expect(routerKeys).toContain("dashboard.stats");
  });

  it("has CRUD operations for owners", () => {
    const routerKeys = Object.keys(appRouter._def.procedures);
    expect(routerKeys).toContain("owners.list");
    expect(routerKeys).toContain("owners.getById");
    expect(routerKeys).toContain("owners.create");
    expect(routerKeys).toContain("owners.update");
    expect(routerKeys).toContain("owners.delete");
  });

  it("has CRUD operations for properties", () => {
    const routerKeys = Object.keys(appRouter._def.procedures);
    expect(routerKeys).toContain("properties.list");
    expect(routerKeys).toContain("properties.getById");
    expect(routerKeys).toContain("properties.create");
    expect(routerKeys).toContain("properties.update");
    expect(routerKeys).toContain("properties.delete");
  });

  it("has CRUD operations for tenants", () => {
    const routerKeys = Object.keys(appRouter._def.procedures);
    expect(routerKeys).toContain("tenants.list");
    expect(routerKeys).toContain("tenants.getById");
    expect(routerKeys).toContain("tenants.create");
    expect(routerKeys).toContain("tenants.update");
    expect(routerKeys).toContain("tenants.delete");
  });

  it("has CRUD operations for contracts", () => {
    const routerKeys = Object.keys(appRouter._def.procedures);
    expect(routerKeys).toContain("contracts.list");
    expect(routerKeys).toContain("contracts.getById");
    expect(routerKeys).toContain("contracts.create");
    expect(routerKeys).toContain("contracts.update");
  });

  it("has financial workflow operations", () => {
    const routerKeys = Object.keys(appRouter._def.procedures);
    expect(routerKeys).toContain("financial.generateMonthlyPayments");
    expect(routerKeys).toContain("financial.markAsPaid");
    expect(routerKeys).toContain("financial.cancelPayment");
    expect(routerKeys).toContain("financial.listTransfers");
    expect(routerKeys).toContain("financial.markTransferCompleted");
  });

  it("has inspection item sub-procedures", () => {
    const routerKeys = Object.keys(appRouter._def.procedures);
    expect(routerKeys).toContain("inspections.listItems");
    expect(routerKeys).toContain("inspections.createItem");
    expect(routerKeys).toContain("inspections.updateItem");
    expect(routerKeys).toContain("inspections.deleteItem");
  });
});

// ─── Input Validation Tests ─────────────────────────────────────────────────

describe("input validation", () => {
  it("rejects invalid referenceMonth format for generateMonthlyPayments", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.financial.generateMonthlyPayments({ referenceMonth: "invalid" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      // Should be a validation error (BAD_REQUEST)
      expect(e.code).toBe("BAD_REQUEST");
    }
  });

  it("accepts valid referenceMonth format", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.financial.generateMonthlyPayments({ referenceMonth: "2026-04" });
    } catch (e: any) {
      // DB errors are OK, but validation errors are not
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("rejects empty name for tenant creation", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.tenants.create({ name: "" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });

  it("rejects empty name for owner creation", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.owners.create({ name: "" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });
});
