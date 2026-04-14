import { z } from "zod";
import { router, adminProcedure, publicProcedure } from "../_core/trpc";
import * as db from "../db";

export const settingsRouter = router({
  get: publicProcedure.query(async () => {
    return db.getSettings();
  }),

  update: adminProcedure.input(z.object({
    agencyName: z.string().min(1).max(255).optional(),
    agencySlogan: z.string().max(255).optional().nullable(),
    agencyCnpj: z.string().max(20).optional().nullable(),
    agencyPhone: z.string().max(32).optional().nullable(),
    agencyEmail: z.string().email().max(320).optional().nullable(),
    agencyAddress: z.string().optional().nullable(),
    agencyPixKey: z.string().max(128).optional().nullable(),
    agencyBank: z.string().max(128).optional().nullable(),
    agencyBankAgency: z.string().max(20).optional().nullable(),
    agencyBankAccount: z.string().max(32).optional().nullable(),
  })).mutation(async ({ input }) => {
    await db.updateSettings(input);
    return { success: true };
  }),
});
