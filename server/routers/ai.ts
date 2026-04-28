import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import * as db from "../db";
import Anthropic from "@anthropic-ai/sdk";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada no servidor.");
  return new Anthropic({ apiKey });
}

export const aiRouter = router({

  // ─── 1. Análise de risco de crédito ──────────────────────────────
  analyzeCreditRisk: adminProcedure.input(z.object({
    tenantId: z.number(),
  })).mutation(async ({ input }) => {
    const tenant = await db.getTenantById(input.tenantId);
    if (!tenant) throw new Error("Inquilino não encontrado.");

    const payments = await db.listPayments({ tenantId: input.tenantId });

    const total = payments.length;
    const paid = payments.filter(p => p.status === "paid");
    const overdue = payments.filter(p => p.status === "overdue");
    const pending = payments.filter(p => p.status === "pending");

    const paidOnTime = paid.filter(p => p.paidAt && p.paidAt <= p.dueDate).length;
    const paidLate = paid.filter(p => p.paidAt && p.paidAt > p.dueDate).length;

    const avgDaysLate = paid
      .filter(p => p.paidAt && p.paidAt > p.dueDate)
      .map(p => Math.round((p.paidAt! - p.dueDate) / (1000 * 60 * 60 * 24)))
      .reduce((a, b) => a + b, 0) / (paidLate || 1);

    const summary = `
Inquilino: ${tenant.name}
CPF: ${tenant.document ?? "não informado"}
Total de cobranças: ${total}
Pagas em dia: ${paidOnTime}
Pagas com atraso: ${paidLate} (média de ${Math.round(avgDaysLate)} dias de atraso)
Em aberto/inadimplente: ${overdue.length}
Pendentes: ${pending.length}
    `.trim();

    const client = getClient();
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{
        role: "user",
        content: `Você é um analista de crédito imobiliário. Analise o histórico de pagamentos abaixo e dê um score de risco em JSON.

${summary}

Responda APENAS com JSON neste formato:
{
  "score": "Baixo" | "Médio" | "Alto",
  "titulo": "frase curta de até 8 palavras",
  "resumo": "análise em 2-3 frases diretas e objetivas",
  "recomendacao": "recomendação clara em 1 frase"
}`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const json = text.match(/\{[\s\S]*\}/);
    if (!json) throw new Error("Erro ao processar análise.");
    return JSON.parse(json[0]) as {
      score: "Baixo" | "Médio" | "Alto";
      titulo: string;
      resumo: string;
      recomendacao: string;
    };
  }),

  // ─── 2. Previsão de inadimplência ────────────────────────────────
  predictDelinquency: adminProcedure.input(z.object({
    tenantId: z.number(),
  })).mutation(async ({ input }) => {
    const tenant = await db.getTenantById(input.tenantId);
    if (!tenant) throw new Error("Inquilino não encontrado.");

    const payments = await db.listPayments({ tenantId: input.tenantId });
    if (payments.length === 0) throw new Error("Sem histórico de pagamentos para analisar.");

    const history = payments
      .sort((a, b) => a.dueDate - b.dueDate)
      .map(p => {
        const dueMonth = new Date(p.dueDate).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
        const daysLate = p.paidAt && p.paidAt > p.dueDate
          ? Math.round((p.paidAt - p.dueDate) / (1000 * 60 * 60 * 24))
          : 0;
        return `${dueMonth}: ${p.status === "paid" ? (daysLate > 0 ? `Pago com ${daysLate} dias de atraso` : "Pago em dia") : p.status === "overdue" ? "INADIMPLENTE" : "Pendente"}`;
      })
      .join("\n");

    const client = getClient();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthName = nextMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{
        role: "user",
        content: `Você é um analista financeiro imobiliário. Analise o padrão de pagamentos do inquilino ${tenant.name} e faça uma previsão para ${nextMonthName}.

Histórico:
${history}

Responda APENAS com JSON:
{
  "risco": "Baixo" | "Médio" | "Alto",
  "probabilidadeAtraso": número de 0 a 100,
  "padrao": "descrição do padrão identificado em 1 frase",
  "previsao": "previsão específica para o próximo mês em 1-2 frases",
  "acao": "ação recomendada ao gestor em 1 frase"
}`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const json = text.match(/\{[\s\S]*\}/);
    if (!json) throw new Error("Erro ao processar previsão.");
    return JSON.parse(json[0]) as {
      risco: "Baixo" | "Médio" | "Alto";
      probabilidadeAtraso: number;
      padrao: string;
      previsao: string;
      acao: string;
    };
  }),

  // ─── 3. Sugestão de valor de aluguel ─────────────────────────────
  suggestRentValue: adminProcedure.input(z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    type: z.string(),
    area: z.number().optional(),
    bedrooms: z.number().optional(),
    features: z.array(z.string()).optional(),
  })).mutation(async ({ input }) => {
    const client = getClient();

    const features = input.features?.length
      ? `Características: ${input.features.join(", ")}`
      : "";

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{
        role: "user",
        content: `Você é um especialista no mercado imobiliário brasileiro. Sugira um valor de aluguel para o imóvel abaixo com base no mercado atual.

Tipo: ${input.type}
Endereço: ${input.address}
Cidade: ${input.city} — ${input.state}
${input.area ? `Área: ${input.area}m²` : ""}
${input.bedrooms ? `Quartos: ${input.bedrooms}` : ""}
${features}

Responda APENAS com JSON:
{
  "valorSugerido": número em reais sem formatação,
  "faixaMinima": número em reais,
  "faixaMaxima": número em reais,
  "justificativa": "explicação em 2-3 frases sobre o mercado desta região",
  "fatoresValorizacao": ["fator1", "fator2"],
  "observacao": "aviso sobre limitações desta estimativa em 1 frase"
}`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const json = text.match(/\{[\s\S]*\}/);
    if (!json) throw new Error("Erro ao processar sugestão.");
    return JSON.parse(json[0]) as {
      valorSugerido: number;
      faixaMinima: number;
      faixaMaxima: number;
      justificativa: string;
      fatoresValorizacao: string[];
      observacao: string;
    };
  }),
});
