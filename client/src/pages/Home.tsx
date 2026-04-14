import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Building2, Shield, Home as HomeIcon, UserCheck, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: settings } = trpc.settings.get.useQuery();
  const agencyName = settings?.agencyName ?? "ImobiSaaS";
  const agencySlogan = settings?.agencySlogan ?? "Gestão Imobiliária Profissional";

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") setLocation("/admin");
      else if (user.role === "owner") setLocation("/owner");
      else if (user.role === "tenant") setLocation("/tenant");
      else setLocation("/admin"); // fallback for "user" role
    }
  }, [loading, user, setLocation]);

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-xl tracking-tight">{agencyName}</span>
        </div>
      </header>

      <div className="container py-16 flex flex-col lg:flex-row gap-16 items-start justify-between max-w-6xl mx-auto">
        {/* Left: pitch */}
        <div className="flex-1 space-y-8 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-sm text-primary font-medium">
            <Building2 className="h-3.5 w-3.5" />
            {agencySlogan}
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-foreground leading-[1.1]">
            {agencyName}<br />
            <span className="text-primary">Portal do Cliente</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
            Acesse seus contratos, boletos, manutenções e extratos com segurança e praticidade.
          </p>

          <div className="grid gap-4">
            <FeatureItem icon={Shield} color="text-primary bg-primary/10" title="Painel Administrativo" desc="Dashboard, imóveis, contratos, financeiro, manutenções e vistorias." />
            <FeatureItem icon={HomeIcon} color="text-chart-4 bg-chart-4/10" title="Portal do Proprietário" desc="Acompanhe imóveis, repasses e contratos em tempo real." />
            <FeatureItem icon={UserCheck} color="text-success bg-success/10" title="Portal do Inquilino" desc="Visualize boletos, solicite manutenções e consulte o contrato." />
          </div>
        </div>

        {/* Right: login / register */}
        <div className="w-full lg:w-[420px] shrink-0">
          <LoginCard />
        </div>
      </div>

      <footer className="border-t py-8 mt-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {agencyName}. {agencySlogan}.</p>
        </div>
      </footer>
    </div>
  );
}

function LoginCard() {
  const [, setLocation] = useLocation();
  const { refresh } = useAuth();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Register form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPass) { toast.error("Preencha e-mail e senha."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erro ao entrar."); return; }
      toast.success("Bem-vindo!");
      await refresh();
      if (data.role === "admin") setLocation("/admin");
      else if (data.role === "owner") setLocation("/owner");
      else if (data.role === "tenant") setLocation("/tenant");
      else setLocation("/admin");
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPass) { toast.error("Preencha todos os campos."); return; }
    if (regPass.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPass }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erro ao criar conta."); return; }
      toast.success("Conta criada com sucesso!");
      await refresh();
      if (data.role === "admin") setLocation("/admin");
      else if (data.role === "owner") setLocation("/owner");
      else if (data.role === "tenant") setLocation("/tenant");
      else setLocation("/admin");
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-xl border">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Acessar plataforma</CardTitle>
        <CardDescription>Entre com sua conta ou crie uma nova</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="login" className="flex-1">Entrar</TabsTrigger>
            <TabsTrigger value="register" className="flex-1">Criar conta</TabsTrigger>
          </TabsList>

          {/* ── Login ── */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-pass">Senha</Label>
                <div className="relative">
                  <Input
                    id="login-pass"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPass(v => !v)}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                Entrar
              </Button>
            </form>
          </TabsContent>

          {/* ── Register ── */}
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name">Nome completo</Label>
                <Input
                  id="reg-name"
                  placeholder="João Silva"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">E-mail</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-pass">Senha</Label>
                <div className="relative">
                  <Input
                    id="reg-pass"
                    type={showPass ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={regPass}
                    onChange={e => setRegPass(e.target.value)}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPass(v => !v)}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                O primeiro usuário registrado se torna <strong>Administrador</strong> automaticamente.
              </p>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                Criar conta
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function FeatureItem({ icon: Icon, color, title, desc }: { icon: any; color: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
