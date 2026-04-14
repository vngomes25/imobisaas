import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProperties from "./pages/admin/Properties";
import AdminPropertyDetail from "./pages/admin/PropertyDetail";
import AdminOwners from "./pages/admin/Owners";
import AdminTenants from "./pages/admin/Tenants";
import AdminContracts from "./pages/admin/Contracts";
import AdminContractDetail from "./pages/admin/ContractDetail";
import AdminFinancial from "./pages/admin/Financial";
import AdminMaintenances from "./pages/admin/Maintenances";
import AdminInspections from "./pages/admin/Inspections";
import AdminUsers from "./pages/admin/Users";
import AdminSettings from "./pages/admin/Settings";

// Tenant portal
import TenantDashboard from "./pages/tenant/Dashboard";
import TenantPayments from "./pages/tenant/Payments";
import TenantMaintenance from "./pages/tenant/Maintenance";
import TenantContract from "./pages/tenant/Contract";

// Owner portal
import OwnerDashboard from "./pages/owner/Dashboard";
import OwnerProperties from "./pages/owner/Properties";
import OwnerFinancial from "./pages/owner/Financial";
import OwnerContracts from "./pages/owner/Contracts";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />

      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/properties" component={AdminProperties} />
      <Route path="/admin/properties/:id" component={AdminPropertyDetail} />
      <Route path="/admin/owners" component={AdminOwners} />
      <Route path="/admin/tenants" component={AdminTenants} />
      <Route path="/admin/contracts" component={AdminContracts} />
      <Route path="/admin/contracts/:id" component={AdminContractDetail} />
      <Route path="/admin/financial" component={AdminFinancial} />
      <Route path="/admin/maintenances" component={AdminMaintenances} />
      <Route path="/admin/inspections" component={AdminInspections} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/settings" component={AdminSettings} />

      {/* Tenant portal routes */}
      <Route path="/tenant" component={TenantDashboard} />
      <Route path="/tenant/payments" component={TenantPayments} />
      <Route path="/tenant/maintenance" component={TenantMaintenance} />
      <Route path="/tenant/contract" component={TenantContract} />

      {/* Owner portal routes */}
      <Route path="/owner" component={OwnerDashboard} />
      <Route path="/owner/properties" component={OwnerProperties} />
      <Route path="/owner/financial" component={OwnerFinancial} />
      <Route path="/owner/contracts" component={OwnerContracts} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
