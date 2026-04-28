import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import Anthropic from "@anthropic-ai/sdk";

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

  readFromImage: adminProcedure.input(z.object({
    imageBase64: z.string(),
    mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  })).mutation(async ({ input }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada no servidor.");

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: input.mediaType,
                data: input.imageBase64,
              },
            },
            {
              type: "text",
              text: `Analise este contrato de locação imobiliária e extraia as informações em JSON com exatamente estas chaves (deixe vazio "" se não encontrar):
{
  "tenantName": "nome completo do inquilino",
  "tenantCpf": "CPF do inquilino (apenas números)",
  "tenantPhone": "telefone do inquilino",
  "ownerName": "nome completo do proprietário",
  "ownerCpf": "CPF do proprietário (apenas números)",
  "propertyAddress": "endereço completo do imóvel",
  "rentValue": "valor do aluguel em reais (apenas números e vírgula, ex: 1500,00)",
  "condoFee": "valor do condomínio (apenas números e vírgula)",
  "iptuValue": "valor do IPTU mensal (apenas números e vírgula)",
  "startDate": "data de início no formato DD/MM/AAAA",
  "endDate": "data de término no formato DD/MM/AAAA",
  "observations": "observações relevantes do contrato"
}
Responda APENAS com o JSON, sem texto adicional.`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Não foi possível extrair dados do contrato.");
      return JSON.parse(jsonMatch[0]) as {
        tenantName: string; tenantCpf: string; tenantPhone: string;
        ownerName: string; ownerCpf: string;
        propertyAddress: string;
        rentValue: string; condoFee: string; iptuValue: string;
        startDate: string; endDate: string; observations: string;
      };
    } catch {
      throw new Error("Erro ao interpretar o contrato. Tente uma foto mais nítida.");
    }
  }),
});
