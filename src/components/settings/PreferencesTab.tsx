import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { LANGUAGE_LABELS } from "@/types/profile";
import type { ProfileInput, Language } from "@/types/profile";

interface PreferencesTabProps {
  form: ProfileInput;
  onChange: <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => void;
}

export function PreferencesTab({ form, onChange }: PreferencesTabProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>Langue de la plateforme</Label>
      <Select value={form.language} onValueChange={(v) => onChange("language", v as Language)}>
        <SelectTrigger className="max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}