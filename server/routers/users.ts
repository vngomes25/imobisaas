import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import * as db from "../db";

export const usersRouter = router({
  list: adminProcedure.query(async () => {
    const users = await db.listUsers();
    return users.map(({ passwordHash: _ph, ...u }) => u);
  }),

  updateRole: adminProcedure.input(z.object({
    id: z.number(),
    role: z.enum(["user", "admin", "owner", "tenant"]),
  })).mutation(async ({ input }) => {
    await db.updateUserRole(input.id, input.role);
    return { success: true };
  }),

  linkToOwner: adminProcedure.input(z.object({
    userId: z.number(),
    ownerId: z.number(),
  })).mutation(async ({ input }) => {
    await db.linkUserToOwner(input.userId, input.ownerId);
    return { success: true };
  }),

  linkToTenant: adminProcedure.input(z.object({
    userId: z.number(),
    tenantId: z.number(),
  })).mutation(async ({ input }) => {
    await db.linkUserToTenant(input.userId, input.tenantId);
    return { success: true };
  }),
});
