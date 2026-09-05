"use client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { AvailableMonth } from "@/types/monthlyStats";

interface MonthSelectorProps {
  months: AvailableMonth[];
  value: string;
  onChange: (value: string) => void;
}

export function MonthSelector({ months, value, onChange }: MonthSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Sélectionner un mois" />
      </SelectTrigger>
      <SelectContent>
        {months.map((m) => (
          <SelectItem key={m.value} value={m.value}>
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}