import { Lock, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { ProfileInput } from "@/types/profile";

interface PrivacyTabProps {
  form: ProfileInput;
  onChange: <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => void;
}

function SettingRow({
  title,
  description,
  checked,
  onChange,
  icon,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border p-3">
      <div className="mt-0.5">
        <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
      </div>
      <div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          {icon}
          {title}
        </div>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
    </div>
  );
}

export function PrivacyTab({ form, onChange }: PrivacyTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-border bg-secondary px-4 py-3 text-sm text-textSecondary">
        Tes montants ($, €) ne sont <strong>jamais</strong> publics, quel que soit le réglage. Seuls
        les résultats en R de tes trades de compte Live peuvent être partagés.
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Visibilité du profil</p>
        <SettingRow
          title="Profil privé"
          description={
            form.isPrivate
              ? "Seuls tes followers voient tes publications, tes badges et tes statistiques. Les autres ne voient que ton identité."
              : "Tout utilisateur de TradeShare peut voir tes publications, tes badges et les statistiques que tu choisis de partager."
          }
          checked={form.isPrivate}
          onChange={(v) => onChange("isPrivate", v)}
          icon={form.isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Ce que les autres peuvent voir</p>
        <SettingRow
          title="Performance"
          description="Ton R total et ton win rate."
          checked={form.showPerformance}
          onChange={(v) => onChange("showPerformance", v)}
        />
        <SettingRow
          title="Statistiques détaillées"
          description="Nombre de trades, profit factor, expectancy, R moyen et drawdown maximal."
          checked={form.showStats}
          onChange={(v) => onChange("showStats", v)}
        />
        <SettingRow
          title="Historique"
          description="Ta courbe d'équité en R. Chaque point de la courbe correspond à un trade."
          checked={form.showHistory}
          onChange={(v) => onChange("showHistory", v)}
        />
        <SettingRow
          title="Trades"
          description="La liste de tes 20 derniers trades clôturés : symbole, direction, résultat en R et setup. Jamais les prix, tailles, captures ni notes."
          checked={form.showTrades}
          onChange={(v) => onChange("showTrades", v)}
        />
      </div>
    </div>
  );
}