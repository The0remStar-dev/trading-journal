export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
export type Language = "FR" | "EN" | "ES";

export interface Profile {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  experienceLevel: ExperienceLevel;
  initialCapital: number | null;
  language: Language;
  createdAt: string;
  updatedAt: string;
}

// Payload envoyé par le formulaire de paramètres (PUT /api/user/settings).
export interface ProfileInput {
  username: string;
  fullName: string | null;
  bio: string | null;
  experienceLevel: ExperienceLevel;
  initialCapital: number | null;
  language: Language;
}

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  BEGINNER: "Débutant (< 1 an)",
  INTERMEDIATE: "Intermédiaire (1-3 ans)",
  ADVANCED: "Avancé (3-5 ans)",
  EXPERT: "Expert (> 5 ans)",
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  FR: "Français",
  EN: "English",
  ES: "Español",
};