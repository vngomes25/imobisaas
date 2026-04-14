import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

export const tenantsRouter = router({
  list: adminProcedure.query(async () => {
    return db.listTenants();
  }),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getTenantById(input.id);
  }),

  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    return db.getTenantByUserId(ctx.user.id);
  }),

  create: adminProcedure.input(z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    cpfCnpj: z.string().optional(),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
    emergencyPhone: z.string().optional(),
    notes: z.string().optional(),
    userId: z.number().optional(),
  })).mutation(async ({ input }) => {
    return db.createTenant(input);
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    cpfCnpj: z.string().optional(),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
    emergencyPhone: z.string().optional(),
    notes: z.string().optional(),
    userId: z.number().nullable().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateTenant(id, data);
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteTenant(input.id);
    return { success: true };
  }),
});
