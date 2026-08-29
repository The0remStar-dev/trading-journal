import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { ProfileInput } from "@/types/profile";

interface TradingCapitalTabProps {
  form: ProfileInput;
  onChange: <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => void;
}

export function TradingCapitalTab({ form, onChange }: TradingCapitalTabProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-md border border-accent-cyan/30 bg-accent-cyan/5 px-4 py-3 text-sm text-foreground">
        Ce paramètre est au cœur de l'expérience TradeShare : il permet de convertir automatiquement
        vos gains et pertes en <strong>multiples de R</strong>, pour que la communauté juge votre
        gestion du risque plutôt que la taille brute de votre capital.
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <Label>Capital Initial de Référence</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-muted hover:text-foreground">
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              Ce montant reste strictement confidentiel et sert uniquement à normaliser vos
              performances en "R" pour protéger la communauté et valoriser la gestion du risque.
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="relative max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
            $
          </span>
          <Input
            required
            type="number"
            min={1}
            step="any"
            placeholder="10000"
            className="pl-6"
            value={form.initialCapital ?? ""}
            onChange={(e) => onChange("initialCapital", e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <p className="text-xs text-muted">
          Non visible publiquement. Modifiable à tout moment si votre taille de compte évolue.
        </p>
      </div>
    </div>
  );
}