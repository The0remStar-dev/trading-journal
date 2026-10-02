import { Lock, Globe } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AvatarUpload } from "@/components/settings/AvatarUpload";
import { EXPERIENCE_LEVEL_LABELS } from "@/types/profile";
import { cn } from "@/lib/utils";
import type { ProfileInput, ExperienceLevel } from "@/types/profile";

interface ProfileTabProps {
  form: ProfileInput;
  avatarUrl: string | null;
  avatarVersion?: string;
  onChange: <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => void;
  onAvatarUpload: (file: File) => Promise<string>;
  onAvatarError: (message: string) => void;
}

export function ProfileTab({
  form,
  avatarUrl,
  avatarVersion,
  onChange,
  onAvatarUpload,
  onAvatarError,
}: ProfileTabProps) {
  return (
    <div className="flex flex-col gap-5">
      <AvatarUpload
        currentUrl={avatarUrl}
        version={avatarVersion}
        onUpload={onAvatarUpload}
        onError={onAvatarError}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Nom d'utilisateur</Label>
          <Input
            required
            minLength={3}
            placeholder="ex: swing_trader_fr"
            value={form.username}
            onChange={(e) => onChange("username", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Nom complet</Label>
          <Input
            placeholder="ex: Julien Dupont"
            value={form.fullName ?? ""}
            onChange={(e) => onChange("fullName", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Niveau d'expérience</Label>
        <Select
          value={form.experienceLevel}
          onValueChange={(v) => onChange("experienceLevel", v as ExperienceLevel)}
        >
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(EXPERIENCE_LEVEL_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Bio</Label>
        <Textarea
          rows={4}
          placeholder="Décrivez votre stratégie, votre approche du risque, votre psychologie de trading..."
          value={form.bio ?? ""}
          onChange={(e) => onChange("bio", e.target.value)}
        />
      </div>

      <div className="flex items-start gap-3 rounded-md border border-border p-3">
        <button
          type="button"
          onClick={() => onChange("isPrivate", !form.isPrivate)}
          className={cn(
            "mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full border border-border transition-colors",
            form.isPrivate ? "justify-end bg-accent" : "justify-start bg-secondary"
          )}
        >
          <span className="mx-0.5 h-4 w-4 rounded-full bg-white shadow-sm" />
        </button>
        <div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            {form.isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
            Profil privé
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {form.isPrivate
              ? "Seuls vos followers peuvent voir vos publications dans la Communauté."
              : "Vos publications sont visibles par tous les utilisateurs de TradeShare."}
          </p>
        </div>
      </div>
    </div>
  );
}