import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { storagePut } from "../storage";

export const inspectionsRouter = router({
  list: adminProcedure.input(z.object({
    propertyId: z.number().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.listInspections(input);
  }),

  listByProperty: protectedProcedure.input(z.object({ propertyId: z.number() })).query(async ({ input }) => {
    return db.listInspections({ propertyId: input.propertyId });
  }),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getInspectionById(input.id);
  }),

  create: adminProcedure.input(z.object({
    propertyId: z.number(),
    contractId: z.number().optional(),
    inspectorId: z.number().optional(),
    type: z.enum(["entry", "exit", "periodic", "maintenance"]).default("periodic"),
    scheduledDate: z.number(),
    overallNotes: z.string().optional(),
  })).mutation(async ({ input }) => {
    return db.createInspection({ ...input, status: "scheduled" });
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
    generalCondition: z.enum(["excellent", "good", "fair", "poor"]).optional(),
    overallNotes: z.string().optional(),
    photos: z.array(z.string()).optional(),
    completedDate: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    if (data.status === "completed" && !data.completedDate) {
      (data as any).completedDate = Date.now();
    }
    await db.updateInspection(id, data);
    return { success: true };
  }),

  // ─── Inspection Items ──────────────────────────────────────────
  listItems: protectedProcedure.input(z.object({ inspectionId: z.number() })).query(async ({ input }) => {
    return db.listInspectionItems(input.inspectionId);
  }),

  createItem: adminProcedure.input(z.object({
    inspectionId: z.number(),
    area: z.string().min(1),
    item: z.string().min(1),
    condition: z.enum(["excellent", "good", "fair", "poor", "damaged"]).default("good"),
    notes: z.string().optional(),
    photos: z.array(z.string()).optional(),
  })).mutation(async ({ input }) => {
    return db.createInspectionItem(input);
  }),

  updateItem: adminProcedure.input(z.object({
    id: z.number(),
    condition: z.enum(["excellent", "good", "fair", "poor", "damaged"]).optional(),
    notes: z.string().optional(),
    photos: z.array(z.string()).optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateInspectionItem(id, data);
    return { success: true };
  }),

  deleteItem: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteInspectionItem(input.id);
    return { success: true };
  }),

  uploadPhoto: adminProcedure.input(z.object({
    inspectionId: z.number(),
    fileName: z.string(),
    base64Data: z.string(),
    mimeType: z.string(),
  })).mutation(async ({ input }) => {
    const buffer = Buffer.from(input.base64Data, "base64");
    const key = `inspections/${input.inspectionId}/${input.fileName}`;
    const { url } = await storagePut(key, buffer, input.mimeType);
    return { url };
  }),
});
