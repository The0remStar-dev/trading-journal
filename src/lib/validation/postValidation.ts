import type { PostInput } from "@/types/post";

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation côté serveur, dépendante du type de post — chaque type a ses
 * propres champs obligatoires. Jamais de confiance dans une validation
 * frontend seule.
 */
export function validatePostInput(body: Partial<PostInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!body.title || !body.title.trim()) {
    errors.push({ field: "title", message: "Le titre est obligatoire." });
  }
  if (!body.type || !["TRADE", "MISTAKE", "LESSON", "SETUP", "WEEKLY_REVIEW"].includes(body.type)) {
    errors.push({ field: "type", message: "Type de publication invalide." });
    return errors; // impossible de valider le reste sans type connu
  }

  switch (body.type) {
    case "TRADE":
      if (!body.linkedTradeId) {
        errors.push({ field: "linkedTradeId", message: "Un post de type Trade doit être lié à un trade de votre journal." });
      }
      break;
    case "MISTAKE":
      if (!body.mistakeSummary || !body.mistakeSummary.trim()) {
        errors.push({ field: "mistakeSummary", message: "Le résumé de l'erreur est obligatoire pour ce type de post." });
      }
      break;
    case "LESSON":
      if ((!body.lessonLearned || !body.lessonLearned.trim()) && (!body.body || !body.body.trim())) {
        errors.push({ field: "lessonLearned", message: "Décrivez la leçon apprise." });
      }
      break;
    case "SETUP":
    case "WEEKLY_REVIEW":
      if (!body.body || !body.body.trim()) {
        errors.push({ field: "body", message: "Le contenu de la publication est obligatoire." });
      }
      break;
  }

  return errors;
}