import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { storagePut } from "../storage";

export const documentsRouter = router({
  list: protectedProcedure.input(z.object({
    entityType: z.enum(["property", "contract", "owner", "tenant", "inspection", "maintenance"]),
    entityId: z.number(),
  })).query(async ({ input }) => {
    return db.listDocuments(input.entityType, input.entityId);
  }),

  upload: protectedProcedure.input(z.object({
    entityType: z.enum(["property", "contract", "owner", "tenant", "inspection", "maintenance"]),
    entityId: z.number(),
    name: z.string().min(1),
    fileName: z.string(),
    base64Data: z.string(),
    mimeType: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const buffer = Buffer.from(input.base64Data, "base64");
    const key = `documents/${input.entityType}/${input.entityId}/${input.fileName}`;
    const { url, key: fileKey } = await storagePut(key, buffer, input.mimeType);
    return db.createDocument({
      entityType: input.entityType,
      entityId: input.entityId,
      name: input.name,
      fileUrl: url,
      fileKey,
      mimeType: input.mimeType,
      uploadedById: ctx.user.id,
    });
  }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteDocument(input.id);
    return { success: true };
  }),
});
