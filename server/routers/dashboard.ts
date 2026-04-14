import { router, adminProcedure } from "../_core/trpc";
import * as db from "../db";

export const dashboardRouter = router({
  stats: adminProcedure.query(async () => {
    return db.getDashboardStats();
  }),
});
