import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

export const contractsRouter = router({
  list: adminProcedure.input(z.object({
    ownerId: z.number().optional(),
    tenantId: z.number().optional(),
    propertyId: z.number().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.listContracts(input);
  }),

  listByOwner: protectedProcedure.input(z.object({ ownerId: z.number() })).query(async ({ input }) => {
    return db.listContracts({ ownerId: input.ownerId });
  }),

  listByTenant: protectedProcedure.input(z.object({ tenantId: z.number() })).query(async ({ input }) => {
    return db.listContracts({ tenantId: input.tenantId });
  }),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getContractById(input.id);
  }),

  create: adminProcedure.input(z.object({
    propertyId: z.number(),
    tenantId: z.number(),
    ownerId: z.number(),
    status: z.enum(["active", "expired", "terminated", "pending"]).default("pending"),
    startDate: z.number(),
    endDate: z.number(),
    rentValue: z.string(),
    adminFeePercent: z.string(),
    condoFee: z.string().optional(),
    iptuValue: z.string().optional(),
    paymentDueDay: z.number().default(10),
    adjustmentIndex: z.string().default("IGPM"),
    guaranteeType: z.enum(["deposit", "guarantor", "insurance", "none"]).default("none"),
    guaranteeDetails: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const result = await db.createContract(input);
    // Update property status to rented if contract is active
    if (input.status === "active") {
      await db.updateProperty(input.propertyId, { status: "rented" });
    }
    return result;
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["active", "expired", "terminated", "pending"]).optional(),
    rentValue: z.string().optional(),
    adminFeePercent: z.string().optional(),
    condoFee: z.string().optional(),
    iptuValue: z.string().optional(),
    paymentDueDay: z.number().optional(),
    adjustmentIndex: z.string().optional(),
    endDate: z.number().optional(),
    guaranteeType: z.enum(["deposit", "guarantor", "insurance", "none"]).optional(),
    guaranteeDetails: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateContract(id, data);

    // If terminating/expiring, set property back to available
    if (data.status === "terminated" || data.status === "expired") {
      const contract = await db.getContractById(id);
      if (contract) {
        await db.updateProperty(contract.propertyId, { status: "available" });
      }
    }
    if (data.status === "active") {
      const contract = await db.getContractById(id);
      if (contract) {
        await db.updateProperty(contract.propertyId, { status: "rented" });
      }
    }
    return { success: true };
  }),

  renew: adminProcedure.input(z.object({
    id: z.number(),
    newEndDate: z.number(),
    newRentValue: z.string().optional(),
  })).mutation(async ({ input }) => {
    await db.renewContract(input.id, input.newEndDate, input.newRentValue);
    return { success: true };
  }),
});
