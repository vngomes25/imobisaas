import { z } from "zod";
import { router } from "../_core/trpc";
import { adminProcedure, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

export const ownersRouter = router({
  list: adminProcedure.query(async () => {
    return db.listOwners();
  }),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getOwnerById(input.id);
  }),

  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    return db.getOwnerByUserId(ctx.user.id);
  }),

  create: adminProcedure.input(z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    cpfCnpj: z.string().optional(),
    address: z.string().optional(),
    bankName: z.string().optional(),
    bankAgency: z.string().optional(),
    bankAccount: z.string().optional(),
    pixKey: z.string().optional(),
    notes: z.string().optional(),
    userId: z.number().optional(),
  })).mutation(async ({ input }) => {
    return db.createOwner(input);
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    cpfCnpj: z.string().optional(),
    address: z.string().optional(),
    bankName: z.string().optional(),
    bankAgency: z.string().optional(),
    bankAccount: z.string().optional(),
    pixKey: z.string().optional(),
    notes: z.string().optional(),
    userId: z.number().nullable().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateOwner(id, data);
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteOwner(input.id);
    return { success: true };
  }),
});
