"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/useToast";
import { createClient } from "@/lib/supabase/client";

export function SecurityTab({ email }: { email: string }) {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast({ title: "Mot de passe trop court", description: "Minimum 8 caractères.", variant: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "error" });
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ title: "Mot de passe mis à jour", variant: "success" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast({
        title: "Échec de la mise à jour",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label>Adresse e-mail</Label>
        <Input value={email} disabled className="max-w-sm opacity-70" />
        <p className="text-xs text-muted">Géré via votre compte Supabase, non modifiable ici.</p>
      </div>

      <form onSubmit={handlePasswordChange} className="flex max-w-sm flex-col gap-4 border-t border-border pt-5">
        <p className="text-sm font-medium text-foreground">Changer le mot de passe</p>
        <div className="flex flex-col gap-1.5">
          <Label>Nouveau mot de passe</Label>
          <Input
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Confirmer le mot de passe</Label>
          <Input
            type="password"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" variant="outline" disabled={saving} className="w-fit">
          {saving ? "Mise à jour..." : "Mettre à jour le mot de passe"}
        </Button>
      </form>
    </div>
  );
}