"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useTradeFacets } from "@/lib/useTradeFacets";
import { cn } from "@/lib/utils";
import { TIMEFRAME_LABELS } from "@/types/trade";
import type { PeriodPreset, SessionName } from "@/types/analytics";
import type { AnalyticsFilterState } from "@/lib/useAnalytics";
import type { Direction, TradeStatus } from "@/types/trade";

const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: "today", label: "Aujourd'hui" },
  { key: "7d", label: "7J" },
  { key: "30d", label: "30J" },
  { key: "90d", label: "90J" },
  { key: "year", label: "1A" },
  { key: "all", label: "Tout" },
  { key: "custom", label: "Personnalisé" },
];

const SESSIONS: SessionName[] = ["Asie", "Londres", "New York", "Autres"];

interface AnalyticsFilterBarProps {
  preset: PeriodPreset;
  onPresetChange: (preset: PeriodPreset) => void;
  customFrom: string | null;
  customTo: string | null;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  filters: AnalyticsFilterState;
  onFiltersChange: (filters: AnalyticsFilterState) => void;
  onReset: () => void;
}

export function AnalyticsFilterBar({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  filters,
  onFiltersChange,
  onReset,
}: AnalyticsFilterBarProps) {
  const { symbols, tags } = useTradeFacets();

  function update<K extends keyof AnalyticsFilterState>(key: K, value: AnalyticsFilterState[K]) {
    onFiltersChange({ ...filters, [key]: value });
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== null);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-md bg-secondary p-1">
          {PRESETS.map((p) => (
            <Button
              key={p.key}
              size="sm"
              variant={preset === p.key ? "primary" : "ghost"}
              className={cn("h-7 px-2.5 text-xs", preset !== p.key && "text-textSecondary")}
              onClick={() => onPresetChange(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        {preset === "custom" && (
          <div className="flex items-center gap-2">
            <Input type="date" value={customFrom ?? ""} onChange={(e) => onCustomFromChange(e.target.value)} className="h-8 w-36 text-xs" />
            <span className="text-xs text-muted">à</span>
            <Input type="date" value={customTo ?? ""} onChange={(e) => onCustomToChange(e.target.value)} className="h-8 w-36 text-xs" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FacetSelect
          placeholder="Instrument"
          value={filters.instrument}
          onChange={(v) => update("instrument", v)}
          options={symbols.map((s) => ({ value: s, label: s }))}
        />
        <FacetSelect
          placeholder="Setup"
          value={filters.setup}
          onChange={(v) => update("setup", v)}
          options={tags.map((t) => ({ value: t, label: t }))}
        />
        <FacetSelect
          placeholder="Session"
          value={filters.session}
          onChange={(v) => update("session", v as SessionName | null)}
          options={SESSIONS.map((s) => ({ value: s, label: s }))}
        />
        <FacetSelect
          placeholder="Timeframe"
          value={filters.timeframe}
          onChange={(v) => update("timeframe", v as any)}
          options={Object.entries(TIMEFRAME_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <FacetSelect
          placeholder="Direction"
          value={filters.direction}
          onChange={(v) => update("direction", v as Direction | null)}
          options={[
            { value: "LONG", label: "Long" },
            { value: "SHORT", label: "Short" },
          ]}
        />
        <FacetSelect
          placeholder="Résultat"
          value={filters.result}
          onChange={(v) => update("result", v as TradeStatus | null)}
          options={[
            { value: "WIN", label: "Win" },
            { value: "LOSS", label: "Loss" },
            { value: "BREAKEVEN", label: "Breakeven" },
          ]}
        />
        {hasActiveFilters && (
          <Button size="sm" variant="ghost" onClick={onReset} className="text-textSecondary">
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );
}

function FacetSelect({
  placeholder,
  value,
  onChange,
  options,
}: {
  placeholder: string;
  value: string | null;
  onChange: (v: string | null) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value ?? "ALL"} onValueChange={(v) => onChange(v === "ALL" ? null : v)}>
      <SelectTrigger className="h-8 w-[150px] text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{placeholder} (tous)</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}