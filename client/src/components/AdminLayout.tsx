import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  FileText,
  DollarSign,
  Wrench,
  ClipboardCheck,
  LogOut,
  PanelLeft,
  ShieldCheck,
  Settings2,
  Bell,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { CSSProperties, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { GlobalSearch } from "./GlobalSearch";

function NotificationBell() {
  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, { refetchInterval: 60_000 });
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  const notifications = [
    stats?.overduePayments && stats.overduePayments > 0
      ? { icon: AlertTriangle, color: "text-destructive", msg: `${stats.overduePayments} cobrança${stats.overduePayments > 1 ? "s" : ""} em atraso`, path: "/admin/financial" }
      : null,
    stats?.expiringContracts && stats.expiringContracts > 0
      ? { icon: CalendarClock, color: "text-warning", msg: `${stats.expiringContracts} contrato${stats.expiringContracts > 1 ? "s" : ""} vencendo em 60 dias`, path: "/admin/contracts" }
      : null,
    stats?.pendingMaintenances && stats.pendingMaintenances > 0
      ? { icon: Wrench, color: "text-primary", msg: `${stats.pendingMaintenances} manutenção${stats.pendingMaintenances > 1 ? "ões" : ""} pendente${stats.pendingMaintenances > 1 ? "s" : ""}`, path: "/admin/maintenances" }
      : null,
  ].filter(Boolean) as Array<{ icon: any; color: string; msg: string; path: string }>;

  const count = notifications.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative h-9 w-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
              {count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b">
          <p className="font-semibold text-sm">Notificações</p>
        </div>
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma notificação pendente</div>
        ) : (
          <div className="divide-y">
            {notifications.map((n, i) => (
              <button key={i} className="w-full flex items-start gap-3 p-3 hover:bg-accent/50 transition-colors text-left"
                onClick={() => { setOpen(false); setLocation(n.path); }}>
                <n.icon className={`h-4 w-4 mt-0.5 shrink-0 ${n.color}`} />
                <p className="text-sm">{n.msg}</p>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

const navGroups = [
  {
    label: "Geral",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { icon: Building2, label: "Imóveis", path: "/admin/properties" },
      { icon: Users, label: "Proprietários", path: "/admin/owners" },
      { icon: UserCheck, label: "Inquilinos", path: "/admin/tenants" },
    ],
  },
  {
    label: "Operações",
    items: [
      { icon: FileText, label: "Contratos", path: "/admin/contracts" },
      { icon: DollarSign, label: "Financeiro", path: "/admin/financial" },
    ],
  },
  {
    label: "Manutenção",
    items: [
      { icon: Wrench, label: "Manutenções", path: "/admin/maintenances" },
      { icon: ClipboardCheck, label: "Vistorias", path: "/admin/inspections" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { icon: ShieldCheck, label: "Usuários", path: "/admin/users" },
      { icon: Settings2, label: "Configurações", path: "/admin/settings" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Sessão expirada</h1>
          <p className="text-muted-foreground">Faça login para continuar.</p>
          <Button onClick={() => { window.location.href = "/"; }}>Ir para o Login</Button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Acesso Restrito</h1>
          <p className="text-muted-foreground">Não tem permissão para aceder ao painel administrativo.</p>
          <Button onClick={() => { window.location.href = "/"; }}>Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "260px" } as CSSProperties}>
      <AdminSidebarContent>{children}</AdminSidebarContent>
    </SidebarProvider>
  );
}

function AdminSidebarContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const { data: settings } = trpc.settings.get.useQuery();
  const agencyName = settings?.agencyName ?? "ImobiSaaS";

  return (
    <>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-2">
            <button
              onClick={toggleSidebar}
              className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors shrink-0"
            >
              <PanelLeft className="h-4 w-4 text-sidebar-foreground/70" />
            </button>
            <span className="font-display font-semibold text-lg text-sidebar-foreground tracking-tight group-data-[collapsible=icon]:hidden">
              {agencyName}
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0 pt-2">
          {navGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-medium">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className="h-9 transition-all font-normal"
                        >
                          <item.icon className={`h-4 w-4 ${isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60"}`} />
                          <span className={isActive ? "font-medium" : ""}>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="p-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-sidebar-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-8 w-8 border border-sidebar-border shrink-0">
                  <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium truncate leading-none text-sidebar-foreground">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-[11px] text-sidebar-foreground/50 truncate mt-1">
                    Administrador
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="flex border-b h-14 items-center bg-background/95 px-3 backdrop-blur sticky top-0 z-40 justify-between gap-4">
          <div className="flex items-center gap-2">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg" />}
            <GlobalSearch />
          </div>
          <NotificationBell />
        </div>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
