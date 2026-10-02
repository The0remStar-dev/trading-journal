"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ReportPostButton({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (res.ok) setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setReason(""); setDone(false); } }}>
      <button onClick={() => setOpen(true)} className="text-muted hover:text-loss" title="Signaler">
        <Flag className="h-3.5 w-3.5" />
      </button>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Signaler cette publication</DialogTitle>
          <DialogDescription>Expliquez brièvement pourquoi ce contenu pose problème.</DialogDescription>
        </DialogHeader>
        {done ? (
          <p className="text-sm text-win">Signalement envoyé, merci.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Raison du signalement..." />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button variant="destructive" onClick={handleSubmit} disabled={!reason.trim() || submitting}>
                {submitting ? "Envoi..." : "Signaler"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}