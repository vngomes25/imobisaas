import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

export const financialRouter = router({
  // ─── Payments ────────────────────────────────────────────────────
  listPayments: adminProcedure.input(z.object({
    contractId: z.number().optional(),
    tenantId: z.number().optional(),
    ownerId: z.number().optional(),
    status: z.string().optional(),
    referenceMonth: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.listPayments(input);
  }),

  listPaymentsByTenant: protectedProcedure.input(z.object({ tenantId: z.number() })).query(async ({ input }) => {
    return db.listPayments({ tenantId: input.tenantId });
  }),

  listPaymentsByOwner: protectedProcedure.input(z.object({ ownerId: z.number() })).query(async ({ input }) => {
    return db.listPayments({ ownerId: input.ownerId });
  }),

  getPayment: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getPaymentById(input.id);
  }),

  generateMonthlyPayments: adminProcedure.input(z.object({
    referenceMonth: z.string().regex(/^\d{4}-\d{2}$/),
  })).mutation(async ({ input }) => {
    const results = await db.generateMonthlyPayments(input.referenceMonth);
    return { generated: results.length, payments: results };
  }),

  markAsPaid: adminProcedure.input(z.object({
    id: z.number(),
    paidAmount: z.string(),
    paidAt: z.number().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updatePayment(id, {
      status: "paid",
      paidAmount: data.paidAmount,
      paidAt: data.paidAt || Date.now(),
      notes: data.notes,
    });

    // Create owner transfer record
    const payment = await db.getPaymentById(id);
    if (payment) {
      await db.createOwnerTransfer({
        ownerId: payment.ownerId,
        paymentId: id,
        amount: payment.ownerTransferAmount,
        status: "pending",
      });
    }
    return { success: true };
  }),

  cancelPayment: adminProcedure.input(z.object({
    id: z.number(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    await db.updatePayment(input.id, { status: "cancelled", notes: input.notes });
    return { success: true };
  }),

  // ─── Owner Transfers ─────────────────────────────────────────────
  listTransfers: adminProcedure.input(z.object({
    ownerId: z.number().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.listOwnerTransfers(input);
  }),

  listTransfersByOwner: protectedProcedure.input(z.object({ ownerId: z.number() })).query(async ({ input }) => {
    return db.listOwnerTransfers({ ownerId: input.ownerId });
  }),

  markTransferCompleted: adminProcedure.input(z.object({
    id: z.number(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    await db.updateOwnerTransfer(input.id, {
      status: "completed",
      transferredAt: Date.now(),
      notes: input.notes,
    });
    return { success: true };
  }),
});
