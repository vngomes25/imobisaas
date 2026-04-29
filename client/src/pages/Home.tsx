import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Shield, Home as HomeIcon, UserCheck, ArrowRight, Loader2, Eye, EyeOff, Building2, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: settings } = trpc.settings.get.useQuery();
  const agencySlogan = settings?.agencySlogan ?? "Gestão Imobiliária Profissional";

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") setLocation("/admin");
      else if (user.role === "owner") setLocation("/owner");
      else if (user.role === "tenant") setLocation("/tenant");
      else setLocation("/admin");
    }
  }, [loading, user, setLocation]);

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d2137" }}>
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Painel esquerdo — Identidade JR ─────────────────────────── */}
      <div
        className="relative flex flex-col justify-between lg:w-[52%] overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0d2137 0%, #0f3352 60%, #123d63 100%)" }}
      >
        {/* Padrão decorativo de fundo */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-[0.06]" style={{ background: "#29ABE2" }} />
          <div className="absolute top-1/2 -right-24 w-72 h-72 rounded-full opacity-[0.05]" style={{ background: "#29ABE2" }} />
          <div className="absolute -bottom-20 left-1/3 w-64 h-64 rounded-full opacity-[0.04]" style={{ background: "#29ABE2" }} />
          {/* Grid sutil */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Conteúdo do painel esquerdo */}
        <div className="relative z-10 flex flex-col justify-between min-h-[420px] lg:min-h-screen p-8 sm:p-12 lg:p-14">

          {/* Topo: Logo */}
          <div>
            <div className="flex items-center gap-4 mb-10">
              <img
                src="/logojr.jpg"
                alt="JR Consultoria Imobiliária"
                className="h-16 w-16 rounded-xl object-cover shadow-lg ring-2 ring-white/10"
              />
              <div>
                <h2 className="text-white font-bold text-xl leading-tight">JR Consultoria</h2>
                <p className="text-white/50 text-sm">Imobiliária</p>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-4 mb-10">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
                style={{ color: "#29ABE2", borderColor: "rgba(41,171,226,0.3)", background: "rgba(41,171,226,0.08)" }}
              >
                <Building2 className="h-3 w-3" />
                {agencySlogan}
              </div>
              <h1 className="text-white text-3xl sm:text-4xl font-bold leading-tight">
                Gerencie seus<br />
                <span style={{ color: "#29ABE2" }}>imóveis com</span><br />
                inteligência
              </h1>
              <p className="text-white/50 text-base leading-relaxed max-w-sm">
                Plataforma completa para administradores, proprietários e inquilinos da JR Consultoria Imobiliária.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <FeatureRow
                icon={Shield}
                color="#29ABE2"
                title="Painel Administrativo"
                desc="Dashboard, imóveis, contratos, financeiro e vistorias."
              />
              <FeatureRow
                icon={HomeIcon}
                color="#34c98a"
                title="Portal do Proprietário"
                desc="Acompanhe repasses e contratos em tempo real."
              />
              <FeatureRow
                icon={UserCheck}
                color="#f5a623"
                title="Portal do Inquilino"
                desc="Boletos, manutenções e contratos com praticidade."
              />
            </div>
          </div>

          {/* Rodapé do painel */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-white/30 text-xs">
              Desenvolvido por{" "}
              <span className="text-white/60 font-semibold">VewTech</span>
              {" "}· {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>

      {/* ── Painel direito — Formulário de login ─────────────────────── */}
      <div className="flex-1 flex flex-col justify-center bg-white dark:bg-background px-6 py-12 sm:px-12 lg:px-16 xl:px-24">

        {/* Mobile: logo topo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <img src="/logojr.jpg" alt="JR Consultoria" className="h-10 w-10 rounded-lg object-cover" />
          <span className="font-bold text-lg text-foreground">JR Consultoria Imobiliária</span>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-8">
          {/* Cabeçalho do form */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(41,171,226,0.1)" }}>
                <KeyRound className="h-4 w-4" style={{ color: "#29ABE2" }} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="text-muted-foreground text-sm">Entre na sua conta ou crie uma nova</p>
          </div>

          <LoginCard />

          {/* Desenvolvido por (mobile) */}
          <p className="lg:hidden text-center text-xs text-muted-foreground/60 pt-4">
            Desenvolvido por <span className="font-semibold text-muted-foreground">VewTech</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginCard() {
  const [, setLocation] = useLocation();
  const { refresh } = useAuth();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
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
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="login" className="flex-1">Entrar</TabsTrigger>
          <TabsTrigger value="register" className="flex-1">Criar conta</TabsTrigger>
        </TabsList>

        {/* ── Login ── */}
        <TabsContent value="login" className="mt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-sm font-medium">E-mail</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                autoComplete="email"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-pass" className="text-sm font-medium">Senha</Label>
              <div className="relative">
                <Input
                  id="login-pass"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  autoComplete="current-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPass(v => !v)}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold mt-2"
              style={{ background: "linear-gradient(135deg, #0d2137, #123d63)" }}
              disabled={loading}
            >
              {loading
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <ArrowRight className="h-4 w-4 mr-2" />}
              Entrar na plataforma
            </Button>
          </form>
        </TabsContent>

        {/* ── Register ── */}
        <TabsContent value="register" className="mt-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reg-name" className="text-sm font-medium">Nome completo</Label>
              <Input
                id="reg-name"
                placeholder="João Silva"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                autoComplete="name"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-email" className="text-sm font-medium">E-mail</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="seu@email.com"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                autoComplete="email"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-pass" className="text-sm font-medium">Senha</Label>
              <div className="relative">
                <Input
                  id="reg-pass"
                  type={showPass ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={regPass}
                  onChange={e => setRegPass(e.target.value)}
                  autoComplete="new-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPass(v => !v)}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              O primeiro usuário registrado se torna <strong>Administrador</strong> automaticamente.
            </p>
            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #0d2137, #123d63)" }}
              disabled={loading}
            >
              {loading
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <ArrowRight className="h-4 w-4 mr-2" />}
              Criar conta
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {/* Segurança */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60 pt-2">
        <Shield className="h-3 w-3" />
        Acesso seguro e criptografado
      </div>
    </div>
  );
}

function FeatureRow({ icon: Icon, color, title, desc }: { icon: any; color: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${color}18` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div>
        <p className="text-white/90 text-sm font-semibold">{title}</p>
        <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
