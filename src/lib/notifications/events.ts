// Petit bus d'événements navigateur : quand une notification est lue, le badge
// de la navigation se resynchronise immédiatement avec le serveur.
export const NOTIFICATIONS_CHANGED_EVENT = "tradeshare:notifications-changed";

export function notifyNotificationsChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  }
}