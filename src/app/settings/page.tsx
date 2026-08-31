// filepath: src/app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { SecurityTab } from "@/components/settings/SecurityTab";
import { TradingCapitalTab } from "@/components/settings/TradingCapitalTab";
import { PreferencesTab } from "@/components/settings/PreferencesTab";
import { useProfile } from "@/lib/useprofile";
import { useToast } from "@/lib/useToast";
import { createClient } from "@/lib/supabase/client";
import type { ProfileInput } from "@/types/profile";

const DEFAULT_FORM: ProfileInput = {
  username: "",
  fullName: null,
  bio: null,
  experienceLevel: "BEGINNER",
  initialCapital: null,
  language: "FR",
};

export default function SettingsPage() {
  const { profile, loading, error, updateProfile, uploadAvatar } = useProfile();
  const { toast } = useToast();

  const [form, setForm] = useState<ProfileInput>(DEFAULT_FORM);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        username: profile.username,
        fullName: profile.fullName,
        bio: profile.bio,
        experienceLevel: profile.experienceLevel,
        initialCapital: profile.initialCapital,
        language: profile.language,
      });
    }
  }, [profile]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  function updateField<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAvatarUpload(file: File) {
    const url = await uploadAvatar(file);
    toast({ title: "Photo de profil mise à jour", variant: "success" });
    return url;
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile(form);
      toast({ title: "Modifications enregistrées", variant: "success" });
    } catch (err) {
      toast({
        title: "Échec de l'enregistrement",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-foreground">Paramètres</h1>
            <p className="text-sm text-muted">Gérez votre identité, votre sécurité et vos préférences.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-loss/30 bg-loss-dim px-4 py-3 text-sm text-loss">
              {error}
            </div>
          )}

          {loading ? (
            <div className="h-96 animate-pulse rounded-lg border border-border bg-surface" />
          ) : (
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="profile">
                  <TabsList>
                    <TabsTrigger value="profile">Profil</TabsTrigger>
                    <TabsTrigger value="security">Sécurité & Compte</TabsTrigger>
                    <TabsTrigger value="capital">Trading & Capital</TabsTrigger>
                    <TabsTrigger value="preferences">Préférences</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile">
                    <ProfileTab
                      form={form}
                      avatarUrl={profile?.avatarUrl ?? null}
                      avatarVersion={profile?.updatedAt}
                      onChange={updateField}
                      onAvatarUpload={handleAvatarUpload}
                      onAvatarError={(msg) => toast({ title: "Erreur", description: msg, variant: "error" })}
                    />
                  </TabsContent>

                  <TabsContent value="security">
                    <SecurityTab email={email} />
                  </TabsContent>

                  <TabsContent value="capital">
                    <TradingCapitalTab form={form} onChange={updateField} />
                  </TabsContent>

                  <TabsContent value="preferences">
                    <PreferencesTab form={form} onChange={updateField} />
                  </TabsContent>
                </Tabs>

                <div className="mt-6 flex justify-end border-t border-border pt-5">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}