import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { storagePut } from "../storage";

export const propertiesRouter = router({
  list: adminProcedure.input(z.object({
    ownerId: z.number().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.listProperties(input);
  }),

  listByOwner: protectedProcedure.input(z.object({ ownerId: z.number() })).query(async ({ input }) => {
    return db.listProperties({ ownerId: input.ownerId });
  }),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getPropertyById(input.id);
  }),

  create: adminProcedure.input(z.object({
    ownerId: z.number(),
    title: z.string().min(1),
    type: z.enum(["apartment", "house", "commercial", "land", "other"]).default("apartment"),
    status: z.enum(["available", "rented", "maintenance"]).default("available"),
    addressStreet: z.string().optional(),
    addressNumber: z.string().optional(),
    addressComplement: z.string().optional(),
    addressNeighborhood: z.string().optional(),
    addressCity: z.string().optional(),
    addressState: z.string().optional(),
    addressZip: z.string().optional(),
    bedrooms: z.number().default(0),
    bathrooms: z.number().default(0),
    parkingSpaces: z.number().default(0),
    area: z.string().optional(),
    rentValue: z.string().optional(),
    condoFee: z.string().optional(),
    iptuValue: z.string().optional(),
    description: z.string().optional(),
    photos: z.array(z.string()).optional(),
  })).mutation(async ({ input }) => {
    return db.createProperty(input);
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    ownerId: z.number().optional(),
    title: z.string().min(1).optional(),
    type: z.enum(["apartment", "house", "commercial", "land", "other"]).optional(),
    status: z.enum(["available", "rented", "maintenance"]).optional(),
    addressStreet: z.string().optional(),
    addressNumber: z.string().optional(),
    addressComplement: z.string().optional(),
    addressNeighborhood: z.string().optional(),
    addressCity: z.string().optional(),
    addressState: z.string().optional(),
    addressZip: z.string().optional(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    parkingSpaces: z.number().optional(),
    area: z.string().optional(),
    rentValue: z.string().optional(),
    condoFee: z.string().optional(),
    iptuValue: z.string().optional(),
    description: z.string().optional(),
    photos: z.array(z.string()).optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateProperty(id, data);
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteProperty(input.id);
    return { success: true };
  }),

  uploadPhoto: adminProcedure.input(z.object({
    propertyId: z.number(),
    fileName: z.string(),
    base64Data: z.string(),
    mimeType: z.string(),
  })).mutation(async ({ input }) => {
    const buffer = Buffer.from(input.base64Data, "base64");
    const key = `properties/${input.propertyId}/${input.fileName}`;
    const { url } = await storagePut(key, buffer, input.mimeType);
    return { url };
  }),
});
