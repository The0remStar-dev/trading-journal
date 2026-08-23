"use client";

import { useMemo, useState } from "react";
import { Eye, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, DirectionBadge } from "@/components/trades/StatusBadge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Trade, TradeStatus, Direction, AccountType } from "@/types/trade";

type SortKey = "entryDate" | "symbol" | "pnl";

interface TradeTableProps {
  trades: Trade[];
  onView: (trade: Trade) => void;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
}

export function TradeTable({ trades, onView, onEdit, onDelete }: TradeTableProps) {
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState<Direction | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<TradeStatus | "ALL">("ALL");
  const [accountFilter, setAccountFilter] = useState<AccountType | "ALL">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("entryDate");
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = useMemo(() => {
    let result = trades;
    if (search.trim()) {
      const q = search.trim().toUpperCase();
      result = result.filter(
        (t) => t.symbol.includes(q) || t.tags.some((tag) => tag.toUpperCase().includes(q))
      );
    }
    if (directionFilter !== "ALL") result = result.filter((t) => t.direction === directionFilter);
    if (statusFilter !== "ALL") result = result.filter((t) => t.status === statusFilter);
    if (accountFilter !== "ALL") result = result.filter((t) => t.accountType === accountFilter);

    const sorted = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "entryDate") cmp = new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
      if (sortKey === "symbol") cmp = a.symbol.localeCompare(b.symbol);
      if (sortKey === "pnl") cmp = a.pnl - b.pnl;
      return sortDesc ? -cmp : cmp;
    });
    return sorted;
  }, [trades, search, directionFilter, statusFilter, accountFilter, sortKey, sortDesc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDesc((d) => !d);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search symbol or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-[220px]"
        />
        <FilterSelect
          value={directionFilter}
          onChange={(v) => setDirectionFilter(v as Direction | "ALL")}
          placeholder="Direction"
          options={[
            { value: "ALL", label: "All Directions" },
            { value: "LONG", label: "Long" },
            { value: "SHORT", label: "Short" },
          ]}
        />
        <FilterSelect
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as TradeStatus | "ALL")}
          placeholder="Status"
          options={[
            { value: "ALL", label: "All Statuses" },
            { value: "WIN", label: "Win" },
            { value: "LOSS", label: "Loss" },
            { value: "BREAKEVEN", label: "Breakeven" },
            { value: "OPEN", label: "Open" },
          ]}
        />
        <FilterSelect
          value={accountFilter}
          onChange={(v) => setAccountFilter(v as AccountType | "ALL")}
          placeholder="Account"
          options={[
            { value: "ALL", label: "All Accounts" },
            { value: "LIVE", label: "Live" },
            { value: "BACKTEST", label: "Backtest" },
            { value: "EVALUATION", label: "Evaluation" },
          ]}
        />
        <span className="ml-auto text-xs text-muted">{filtered.length} trades</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <SortableHeader label="Entry Date" active={sortKey === "entryDate"} desc={sortDesc} onClick={() => toggleSort("entryDate")} />
              <SortableHeader label="Symbol" active={sortKey === "symbol"} desc={sortDesc} onClick={() => toggleSort("symbol")} />
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Entry</th>
              <th className="px-3 py-2 font-medium">Exit</th>
              <th className="px-3 py-2 font-medium">Size</th>
              <SortableHeader label="Net PnL" active={sortKey === "pnl"} desc={sortDesc} onClick={() => toggleSort("pnl")} />
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Tags</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-10 text-center text-sm text-muted">
                  No trades match your filters yet.
                </td>
              </tr>
            ) : (
              filtered.map((trade) => (
                <tr
                  key={trade.id}
                  className="cursor-pointer border-b border-border/60 transition-colors hover:bg-surface/60"
                  onClick={() => onView(trade)}
                >
                  <td className="px-3 py-2 text-foreground">{formatDate(trade.entryDate)}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{trade.symbol}</td>
                  <td className="px-3 py-2">
                    <DirectionBadge direction={trade.direction} />
                  </td>
                  <td className="px-3 py-2 text-mono-num text-muted">{trade.entryPrice}</td>
                  <td className="px-3 py-2 text-mono-num text-muted">{trade.exitPrice ?? "—"}</td>
                  <td className="px-3 py-2 text-mono-num text-muted">{trade.positionSize}</td>
                  <td
                    className={cn(
                      "px-3 py-2 text-mono-num font-medium",
                      trade.pnl > 0 ? "text-win" : trade.pnl < 0 ? "text-loss" : "text-muted"
                    )}
                  >
                    {formatCurrency(trade.pnl)}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={trade.status} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex max-w-[160px] flex-wrap gap-1">
                      {trade.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="tag">
                          {tag}
                        </Badge>
                      ))}
                      {trade.tags.length > 2 && (
                        <Badge variant="tag">+{trade.tags.length - 2}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => onView(trade)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onEdit(trade)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onDelete(trade)}>
                        <Trash2 className="h-4 w-4 text-loss" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  active,
  desc,
  onClick,
}: {
  label: string;
  active: boolean;
  desc: boolean;
  onClick: () => void;
}) {
  return (
    <th className="px-3 py-2 font-medium">
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-1 transition-colors hover:text-foreground",
          active && "text-foreground"
        )}
      >
        {label}
        <ArrowUpDown className={cn("h-3 w-3", active && !desc && "rotate-180")} />
      </button>
    </th>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[150px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
