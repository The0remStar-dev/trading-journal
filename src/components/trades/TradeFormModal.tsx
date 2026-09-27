"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ImageDropzone } from "@/components/trades/ImageDropzone";
import { calculatePnl, calculatePnlPercentage, deriveStatus } from "@/lib/calculations";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { X } from "lucide-react";
import { EMOTION_LABELS, TIMEFRAME_LABELS } from "@/types/trade";
import type { Trade, TradeInput, AccountType, Direction, TradeEmotion, Timeframe } from "@/types/trade";

interface TradeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTrade?: Trade | null;
  onSubmit: (input: TradeInput) => Promise<void>;
}

const EMPTY_FORM: TradeInput = {
  accountType: "LIVE",
  symbol: "",
  direction: "LONG",
  entryDate: new Date().toISOString().slice(0, 16),
  exitDate: null,
  entryPrice: 0,
  exitPrice: null,
  stopLoss: null,
  takeProfit: null,
  positionSize: 1,
  fees: 0,
  riskRewardRatio: null,
  tags: [],
  timeframe: null,
  setupQuality: null,
  planRespected: null,
  stopMoved: false,
  tpMoved: false,
  errorType: null,
  mistake: null,
  lesson: null,
  notes: "",
  emotion: null,
  beforeImageUrl: null,
  afterImageUrl: null,
};

export function TradeFormModal({ open, onOpenChange, initialTrade, onSubmit }: TradeFormModalProps) {
  const [form, setForm] = useState<TradeInput>(EMPTY_FORM);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTrade) {
      setForm({
        accountType: initialTrade.accountType,
        symbol: initialTrade.symbol,
        direction: initialTrade.direction,
        entryDate: initialTrade.entryDate.slice(0, 16),
        exitDate: initialTrade.exitDate ? initialTrade.exitDate.slice(0, 16) : null,
        entryPrice: initialTrade.entryPrice,
        exitPrice: initialTrade.exitPrice,
        stopLoss: initialTrade.stopLoss,
        takeProfit: initialTrade.takeProfit,
        positionSize: initialTrade.positionSize,
        fees: initialTrade.fees,
        riskRewardRatio: initialTrade.riskRewardRatio,
        tags: initialTrade.tags,
        timeframe: initialTrade.timeframe,
        setupQuality: initialTrade.setupQuality,
        planRespected: initialTrade.planRespected,
        stopMoved: initialTrade.stopMoved,
        tpMoved: initialTrade.tpMoved,
        errorType: initialTrade.errorType,
        mistake: initialTrade.mistake,
        lesson: initialTrade.lesson,
        notes: initialTrade.notes ?? "",
        emotion: initialTrade.emotion,
        beforeImageUrl: initialTrade.beforeImageUrl,
        afterImageUrl: initialTrade.afterImageUrl,
      });
    } else if (open) {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [initialTrade, open]);

  const preview = useMemo(() => {
    const pnl = calculatePnl(form);
    const pnlPercentage = calculatePnlPercentage(form);
    const status = deriveStatus({ exitPrice: form.exitPrice, pnl });
    return { pnl, pnlPercentage, status };
  }, [form]);

  function update<K extends keyof TradeInput>(key: K, value: TradeInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addTag() {
    const value = tagInput.trim();
    if (value && !form.tags.includes(value)) {
      update("tags", [...form.tags, value]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    update("tags", form.tags.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        ...form,
        entryDate: new Date(form.entryDate).toISOString(),
        exitDate: form.exitDate ? new Date(form.exitDate).toISOString() : null,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement du trade.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{initialTrade ? "Modifier le trade" : "Logger un nouveau trade"}</DialogTitle>
          <DialogDescription>
            PnL, statut et R-multiple sont calculés automatiquement — le R utilise ton Stop Loss
            quand il est renseigné, sinon ton risque configuré dans Paramètres.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="rounded-md border border-loss/30 bg-loss-dim px-4 py-2.5 text-sm text-loss">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Symbole">
              <Input
                required
                placeholder="EURUSD"
                value={form.symbol}
                onChange={(e) => update("symbol", e.target.value.toUpperCase())}
              />
            </Field>
            <Field label="Direction">
              <Select value={form.direction} onValueChange={(v) => update("direction", v as Direction)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LONG">Long</SelectItem>
                  <SelectItem value="SHORT">Short</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Type de compte">
              <Select value={form.accountType} onValueChange={(v) => update("accountType", v as AccountType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIVE">Live</SelectItem>
                  <SelectItem value="BACKTEST">Backtest</SelectItem>
                  <SelectItem value="EVALUATION">Evaluation</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Timeframe">
              <Select
                value={form.timeframe ?? "NONE"}
                onValueChange={(v) => update("timeframe", v === "NONE" ? null : (v as Timeframe))}
              >
                <SelectTrigger><SelectValue placeholder="Non renseigné" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Non renseigné</SelectItem>
                  {Object.entries(TIMEFRAME_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Date & heure d'entrée">
              <Input required type="datetime-local" value={form.entryDate} onChange={(e) => update("entryDate", e.target.value)} />
            </Field>
            <Field label="Date & heure de sortie">
              <Input type="datetime-local" value={form.exitDate ?? ""} onChange={(e) => update("exitDate", e.target.value || null)} />
            </Field>
            <Field label="Prix d'entrée">
              <Input required type="number" step="any" value={form.entryPrice} onChange={(e) => update("entryPrice", Number(e.target.value))} />
            </Field>
            <Field label="Prix de sortie">
              <Input type="number" step="any" value={form.exitPrice ?? ""} onChange={(e) => update("exitPrice", e.target.value ? Number(e.target.value) : null)} />
            </Field>

            <Field label="Stop Loss">
              <Input type="number" step="any" placeholder="Utilisé pour calculer ton R réel" value={form.stopLoss ?? ""} onChange={(e) => update("stopLoss", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Field label="Take Profit">
              <Input type="number" step="any" placeholder="Optionnel" value={form.takeProfit ?? ""} onChange={(e) => update("takeProfit", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Field label="Taille de position">
              <Input required type="number" step="any" value={form.positionSize} onChange={(e) => update("positionSize", Number(e.target.value))} />
            </Field>
            <Field label="Frais">
              <Input type="number" step="any" value={form.fees} onChange={(e) => update("fees", Number(e.target.value))} />
            </Field>

            <Field label="Risk:Reward">
              <Input type="number" step="0.01" placeholder="2.0" value={form.riskRewardRatio ?? ""} onChange={(e) => update("riskRewardRatio", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Field label="Qualité du setup (1-5)">
              <Select
                value={form.setupQuality?.toString() ?? "NONE"}
                onValueChange={(v) => update("setupQuality", v === "NONE" ? null : Number(v))}
              >
                <SelectTrigger><SelectValue placeholder="Non noté" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Non noté</SelectItem>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} / 5</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Émotion dominante">
              <Select
                value={form.emotion ?? "NONE"}
                onValueChange={(v) => update("emotion", v === "NONE" ? null : (v as TradeEmotion))}
              >
                <SelectTrigger><SelectValue placeholder="Non renseignée" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Non renseignée</SelectItem>
                  {Object.entries(EMOTION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Type d'erreur (court)">
              <Input placeholder="Ex: Entrée anticipée" value={form.errorType ?? ""} onChange={(e) => update("errorType", e.target.value || null)} />
            </Field>
          </div>

          <div className="flex flex-wrap gap-4 rounded-md border border-border bg-secondary px-4 py-3">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.planRespected === true} onChange={(e) => update("planRespected", e.target.checked)} className="h-4 w-4 rounded border-border accent-win" />
              Plan de trading respecté
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.stopMoved} onChange={(e) => update("stopMoved", e.target.checked)} className="h-4 w-4 rounded border-border accent-loss" />
              Stop déplacé en cours de trade
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.tpMoved} onChange={(e) => update("tpMoved", e.target.checked)} className="h-4 w-4 rounded border-border accent-loss" />
              Take Profit déplacé en cours de trade
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-md border border-border bg-secondary px-4 py-3">
            <PreviewStat label="Net PnL" value={formatCurrency(preview.pnl)} tone={preview.pnl >= 0 ? "win" : "loss"} />
            <PreviewStat label="PnL %" value={formatPercent(preview.pnlPercentage)} tone={preview.pnlPercentage >= 0 ? "win" : "loss"} />
            <PreviewStat label="Statut" value={preview.status} tone={preview.status === "WIN" ? "win" : preview.status === "LOSS" ? "loss" : "neutral"} />
          </div>

          <Field label="Tags (Setup / Stratégie)">
            <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-secondary p-2">
              {form.tags.map((tag) => (
                <Badge key={tag} variant="tag" className="gap-1">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                onBlur={addTag}
                placeholder="Ex: Liquidity Sweep, ICT, Breakout..."
                className="min-w-[160px] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
              />
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Erreur identifiée">
              <Textarea rows={3} placeholder="Qu'est-ce qui n'a pas fonctionné ?" value={form.mistake ?? ""} onChange={(e) => update("mistake", e.target.value || null)} />
            </Field>
            <Field label="Leçon retenue">
              <Textarea rows={3} placeholder="Qu'en retiens-tu pour la suite ?" value={form.lesson ?? ""} onChange={(e) => update("lesson", e.target.value || null)} />
            </Field>
          </div>

          <Field label="Notes (Markdown supporté)">
            <Textarea rows={4} placeholder="Contexte du setup, exécution, ressenti général..." value={form.notes ?? ""} onChange={(e) => update("notes", e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <ImageDropzone label="Capture pré-trade" value={form.beforeImageUrl} onChange={(url) => update("beforeImageUrl", url)} />
            <ImageDropzone label="Capture post-trade" value={form.afterImageUrl} onChange={(url) => update("afterImageUrl", url)} />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? "Enregistrement..." : initialTrade ? "Enregistrer" : "Logger le trade"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function PreviewStat({ label, value, tone }: { label: string; value: string; tone: "win" | "loss" | "neutral" }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">{label}:</span>
      <span className={cn("text-mono-num text-sm font-semibold", tone === "win" && "text-win", tone === "loss" && "text-loss", tone === "neutral" && "text-accent")}>
        {value}
      </span>
    </div>
  );
}