import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Building2,
  LogOut,
  PanelLeft,
  type LucideIcon,
} from "lucide-react";
import { CSSProperties } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { PWAInstallPrompt } from "./PWAInstallPrompt";

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface PortalLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  portalTitle: string;
  portalRole: string;
  requiredRole: string;
}

export default function PortalLayout({ children, navItems, portalTitle, portalRole, requiredRole }: PortalLayoutProps) {
  const { loading, user } = useAuth();

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center">{portalTitle}</h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Aceda ao seu portal. Autenticação necessária.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = "/"; }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  // Role-based access control
  if (user.role !== requiredRole && user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full">
          <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-center">Acesso Restrito</h1>
          <p className="text-sm text-muted-foreground text-center">Não tem permissão para aceder a este portal.</p>
          <Button variant="outline" onClick={() => window.location.href = "/"}>Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "260px" } as CSSProperties}>
      <PortalSidebarContent navItems={navItems} portalTitle={portalTitle} portalRole={portalRole}>
        {children}
      </PortalSidebarContent>
    </SidebarProvider>
  );
}

function PortalSidebarContent({ children, navItems, portalTitle, portalRole }: {
  children: React.ReactNode;
  navItems: NavItem[];
  portalTitle: string;
  portalRole: string;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

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
              {portalTitle}
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0 pt-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
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
        </SidebarContent>

        <SidebarFooter className="p-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-sidebar-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-8 w-8 border border-sidebar-border shrink-0">
                  <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium truncate leading-none text-sidebar-foreground">
                    {user?.name || "Utilizador"}
                  </p>
                  <p className="text-[11px] text-sidebar-foreground/50 truncate mt-1">
                    {portalRole}
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
        {isMobile && (
          <div className="flex border-b h-14 items-center bg-background/95 px-3 backdrop-blur sticky top-0 z-40">
            <SidebarTrigger className="h-9 w-9 rounded-lg" />
          </div>
        )}
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
      <PWAInstallPrompt />
    </>
  );
}
