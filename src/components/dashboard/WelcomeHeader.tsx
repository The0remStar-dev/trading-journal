import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { PeriodPreset } from "@/types/analytics";

const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
];

interface WelcomeHeaderProps {
  firstName: string;
  period: PeriodPreset;
  onPeriodChange: (value: PeriodPreset) => void;
}

export function WelcomeHeader({ firstName, period, onPeriodChange }: WelcomeHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Bonjour {firstName}</h1>
        <p className="mt-1 text-sm text-muted">Voici comment se passe ton trading.</p>
      </div>
      <Select value={period} onValueChange={(v) => onPeriodChange(v as PeriodPreset)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}