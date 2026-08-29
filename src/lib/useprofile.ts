"use client";

import { useCallback, useEffect, useState } from "react";
import type { Profile, ProfileInput } from "@/types/profile";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/settings");
      if (!res.ok) throw new Error("Impossible de charger le profil.");
      const data = await res.json();
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateProfile = useCallback(async (input: ProfileInput) => {
    const res = await fetch("/api/user/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Échec de la mise à jour.");
    setProfile(data.profile);
    return data.profile as Profile;
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/user/avatar", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Échec de l'upload.");
    setProfile((prev) => (prev ? { ...prev, avatarUrl: data.avatarUrl } : prev));
    return data.avatarUrl as string;
  }, []);

  return { profile, loading, error, refetch, updateProfile, uploadAvatar };
}