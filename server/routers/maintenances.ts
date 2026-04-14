import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { storagePut } from "../storage";

export const maintenancesRouter = router({
  list: adminProcedure.input(z.object({
    propertyId: z.number().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.listMaintenances(input);
  }),

  listByProperty: protectedProcedure.input(z.object({ propertyId: z.number() })).query(async ({ input }) => {
    return db.listMaintenances({ propertyId: input.propertyId });
  }),

  listMyRequests: protectedProcedure.query(async ({ ctx }) => {
    return db.listMaintenances({ requestedById: ctx.user.id });
  }),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getMaintenanceById(input.id);
  }),

  create: protectedProcedure.input(z.object({
    propertyId: z.number(),
    contractId: z.number().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    category: z.enum(["plumbing", "electrical", "structural", "painting", "appliance", "general", "other"]).default("general"),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    photos: z.array(z.string()).optional(),
  })).mutation(async ({ ctx, input }) => {
    return db.createMaintenance({
      ...input,
      requestedById: ctx.user.id,
      status: "open",
    });
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.enum(["plumbing", "electrical", "structural", "painting", "appliance", "general", "other"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    status: z.enum(["open", "in_progress", "waiting_parts", "completed", "cancelled"]).optional(),
    cost: z.string().optional(),
    notes: z.string().optional(),
    photos: z.array(z.string()).optional(),
    resolvedAt: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    if (data.status === "completed" && !data.resolvedAt) {
      (data as any).resolvedAt = Date.now();
    }
    await db.updateMaintenance(id, data);
    return { success: true };
  }),

  uploadPhoto: protectedProcedure.input(z.object({
    maintenanceId: z.number(),
    fileName: z.string(),
    base64Data: z.string(),
    mimeType: z.string(),
  })).mutation(async ({ input }) => {
    const buffer = Buffer.from(input.base64Data, "base64");
    const key = `maintenances/${input.maintenanceId}/${input.fileName}`;
    const { url } = await storagePut(key, buffer, input.mimeType);
    return { url };
  }),
});
