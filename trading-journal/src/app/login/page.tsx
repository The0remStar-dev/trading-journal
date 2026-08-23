"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const dest = searchParams.get("from") || "/dashboard";
      router.push(dest);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Incorrect password.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-win-dim">
            <Lock className="h-5 w-5 text-win" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              TRADE<span className="text-win">JOURNAL</span>
            </h1>
            <p className="mt-1 text-xs text-muted">Enter your master password to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="password"
            placeholder="Master password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-xs text-loss">{error}</p>}
          <Button type="submit" disabled={loading || !password} className="w-full">
            {loading ? "Verifying..." : "Unlock Journal"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
