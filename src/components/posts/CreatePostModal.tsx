"use client";

import { useState } from "react";
import { FolderInput, X } from "lucide-react";
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
import { ImageDropzone } from "@/components/trades/ImageDropzone";
import { DirectionBadge } from "@/components/trades/StatusBadge";
import { TradeSelectorModal } from "@/components/posts/tradeSelectorModal";
import { EMOTION_LABELS } from "@/types/trade";
import { POST_TYPE_LABELS } from "@/types/post";
import { useToast } from "@/lib/useToast";
import { cn } from "@/lib/utils";
import type { TradeEmotion } from "@/types/trade";
import type { Post, PostInput, PostType, SelectableTrade } from "@/types/post";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (post: Post) => void;
}

const EMPTY_FORM: PostInput = {
  type: "TRADE",
  title: "",
  emotion: "NEUTRAL",
  mistakeSummary: null,
  lessonLearned: null,
  body: null,
  beforeImageUrl: null,
  afterImageUrl: null,
  linkedTradeId: null,
};

export function CreatePostModal({ open, onOpenChange, onSuccess }: CreatePostModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<PostInput>(EMPTY_FORM);
  const [linkedTrade, setLinkedTrade] = useState<SelectableTrade | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof PostInput>(key: K, value: PostInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTypeChange(type: PostType) {
    update("type", type);
    if (type !== "TRADE") {
      setLinkedTrade(null);
      update("linkedTradeId", null);
    }
  }

  function handleTradeSelected(trade: SelectableTrade) {
    setLinkedTrade(trade);
    update("linkedTradeId", trade.id);
  }

  function removeLinkedTrade() {
    setLinkedTrade(null);
    update("linkedTradeId", null);
  }

  function resetAndClose() {
    setForm(EMPTY_FORM);
    setLinkedTrade(null);
    onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const details = Array.isArray(data.details)
          ? data.details.map((item: { message?: string }) => item.message).filter(Boolean).join(" ")
          : "";
        throw new Error(details || data.error || "Échec de la publication.");
      }

      toast({ title: "Publication créée", variant: "success" });
      onSuccess?.(data.post as Post);
      resetAndClose();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>Créer une publication</DialogTitle>
            <DialogDescription>
              Les montants bruts ne sont jamais affichés — seule votre performance en R est visible.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field label="Type de publication">
              <Select value={form.type} onValueChange={(v) => handleTypeChange(v as PostType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(POST_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {form.type === "TRADE" && (
              linkedTrade ? (
                <div className="flex items-center justify-between rounded-md border border-accent/30 bg-accent/5 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">{linkedTrade.symbol}</span>
                    <DirectionBadge direction={linkedTrade.direction} />
                    <span className={cn("text-sm font-semibold", linkedTrade.rMultiple !== null && linkedTrade.rMultiple >= 0 ? "text-win" : "text-loss")}>
                      {linkedTrade.rMultiple !== null ? `${linkedTrade.rMultiple >= 0 ? "+" : ""}${linkedTrade.rMultiple.toFixed(2)}R` : "—"}
                    </span>
                  </div>
                  <button type="button" onClick={removeLinkedTrade} className="text-muted hover:text-loss">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-start gap-2">
                  <Button type="button" variant="subtle" onClick={() => setSelectorOpen(true)} className="w-fit">
                    <FolderInput className="h-4 w-4" />
                    Importer depuis mon journal
                  </Button>
                  <p className="text-sm text-muted">Sélectionnez un trade clôturé pour publier ce type de post.</p>
                </div>
              )
            )}

            <Field label="Titre">
              <Input
                required
                placeholder="Ex: Ce que ce trade raté m'a appris sur la patience"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </Field>

            <Field label="État émotionnel dominant">
              <div className="flex flex-wrap gap-2">
                {Object.entries(EMOTION_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update("emotion", value as TradeEmotion)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      form.emotion === value
                        ? "border-win/40 bg-win-dim text-win"
                        : "border-border bg-secondary text-muted hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            {form.type === "MISTAKE" && (
              <Field label="Résumé de l'erreur">
                <Textarea
                  required
                  rows={3}
                  placeholder="Qu'est-ce qui n'a pas fonctionné ?"
                  value={form.mistakeSummary ?? ""}
                  onChange={(e) => update("mistakeSummary", e.target.value || null)}
                />
              </Field>
            )}

            {form.type === "LESSON" && (
              <Field label="Leçon apprise">
                <Textarea
                  required
                  rows={3}
                  placeholder="Qu'en retenez-vous pour la suite ?"
                  value={form.lessonLearned ?? ""}
                  onChange={(e) => update("lessonLearned", e.target.value || null)}
                />
              </Field>
            )}

            {(form.type === "SETUP" || form.type === "WEEKLY_REVIEW" || form.type === "TRADE") && (
              <Field label={form.type === "TRADE" ? "Commentaire (optionnel)" : "Contenu"}>
                <Textarea
                  required={form.type !== "TRADE"}
                  rows={4}
                  placeholder={
                    form.type === "SETUP"
                      ? "Décrivez votre setup, les conditions, la logique..."
                      : form.type === "WEEKLY_REVIEW"
                      ? "Bilan de la semaine : ce qui a marché, ce qui n'a pas marché..."
                      : "Contexte additionnel sur ce trade..."
                  }
                  value={form.body ?? ""}
                  onChange={(e) => update("body", e.target.value || null)}
                />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              <ImageDropzone
                label="Graphique avant"
                value={form.beforeImageUrl}
                onChange={(url) => update("beforeImageUrl", url)}
                uploadUrl="/api/posts/upload-image"
              />
              <ImageDropzone
                label="Graphique après"
                value={form.afterImageUrl}
                onChange={(url) => update("afterImageUrl", url)}
                uploadUrl="/api/posts/upload-image"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={resetAndClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving || (form.type === "TRADE" && !form.linkedTradeId)}>
                {saving ? "Publication..." : "Publier"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <TradeSelectorModal
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        onSelect={handleTradeSelected}
      />
    </>
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