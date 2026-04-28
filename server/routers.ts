import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { ownersRouter } from "./routers/owners";
import { propertiesRouter } from "./routers/properties";
import { tenantsRouter } from "./routers/tenants";
import { contractsRouter } from "./routers/contracts";
import { financialRouter } from "./routers/financial";
import { maintenancesRouter } from "./routers/maintenances";
import { inspectionsRouter } from "./routers/inspections";
import { documentsRouter } from "./routers/documents";
import { dashboardRouter } from "./routers/dashboard";
import { usersRouter } from "./routers/users";
import { settingsRouter } from "./routers/settings";
import { aiRouter } from "./routers/ai";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => {
      if (!opts.ctx.user) return null;
      const { passwordHash: _ph, ...safeUser } = opts.ctx.user;
      return safeUser;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  owners: ownersRouter,
  properties: propertiesRouter,
  tenants: tenantsRouter,
  contracts: contractsRouter,
  financial: financialRouter,
  maintenances: maintenancesRouter,
  inspections: inspectionsRouter,
  documents: documentsRouter,
  dashboard: dashboardRouter,
  users: usersRouter,
  settings: settingsRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
