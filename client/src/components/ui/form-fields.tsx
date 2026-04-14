/**
 * Campos de formulário com máscara e formatação brasileira.
 * - InputPhone: (11) 99999-9999
 * - InputCpfCnpj: 000.000.000-00 / 00.000.000/0001-00
 * - InputCEP: 00000-000 com auto-preenchimento via ViaCEP
 * - InputCurrency: R$ 1.234,56
 * - SelectUF: dropdown de estados brasileiros
 */
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useState } from "react";

// ─── Máscara de telefone ─────────────────────────────────────────────────────
export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    // (11) 1234-5678
    return d
      .replace(/^(\d{0,2})/, "($1")
      .replace(/^(\(\d{2})(\d)/, "$1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  // (11) 91234-5678
  return d
    .replace(/^(\d{2})/, "($1) ")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function InputPhone({
  value,
  onChange,
  placeholder = "(11) 99999-9999",
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Input
      type="tel"
      inputMode="numeric"
      value={value}
      placeholder={placeholder}
      className={className}
      onChange={(e) => onChange(maskPhone(e.target.value))}
    />
  );
}

// ─── Máscara CPF / CNPJ ──────────────────────────────────────────────────────
export function maskCpfCnpj(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    // CPF: 000.000.000-00
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  // CNPJ: 00.000.000/0001-00
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function InputCpfCnpj({
  value,
  onChange,
  placeholder = "CPF ou CNPJ",
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Input
      inputMode="numeric"
      value={value}
      placeholder={placeholder}
      className={className}
      onChange={(e) => onChange(maskCpfCnpj(e.target.value))}
    />
  );
}

// ─── CEP com auto-preenchimento ──────────────────────────────────────────────
export function maskCEP(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d.replace(/(\d{5})(\d{1,3})/, "$1-$2");
}

type AddressResult = {
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

export function InputCEP({
  value,
  onChange,
  onAddressFound,
  placeholder = "00000-000",
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  onAddressFound?: (addr: AddressResult) => void;
  placeholder?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleChange = async (raw: string) => {
    const masked = maskCEP(raw);
    onChange(masked);

    const digits = masked.replace(/\D/g, "");
    if (digits.length === 8 && onAddressFound) {
      setLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (!data.erro) {
          onAddressFound({
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          });
        }
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="relative">
      <Input
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        className={className}
        onChange={(e) => handleChange(e.target.value)}
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}

// ─── Moeda (R$) ──────────────────────────────────────────────────────────────
export function formatCurrency(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Converte "2.500,00" → "2500.00" para salvar no banco */
export function parseCurrency(display: string): string {
  if (!display) return "";
  return display.replace(/\./g, "").replace(",", ".");
}

/** Inicializa o display a partir de um valor decimal do banco "2500.00" → "2.500,00" */
export function initCurrency(dbValue: string | null | undefined): string {
  if (!dbValue) return "";
  const num = parseFloat(dbValue);
  if (isNaN(num)) return "";
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function InputCurrency({
  value,
  onChange,
  placeholder = "0,00",
  className,
}: {
  value: string;
  onChange: (display: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none">
        R$
      </span>
      <Input
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        className={`pl-9 ${className ?? ""}`}
        onChange={(e) => onChange(formatCurrency(e.target.value))}
      />
    </div>
  );
}

// ─── Estado (UF) ─────────────────────────────────────────────────────────────
const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
];

export function SelectUF({
  value,
  onChange,
  placeholder = "UF",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {UFS.map((uf) => (
          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
