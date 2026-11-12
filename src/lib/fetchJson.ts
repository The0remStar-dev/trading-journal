export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * fetch + JSON avec erreurs lisibles : réseau coupé (status 0), session
 * expirée (401) et message d'erreur renvoyé par l'API.
 */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", ...init });
  } catch {
    throw new ApiError(0, "Connexion impossible. Vérifie ta connexion internet.");
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      res.status === 401
        ? "Ta session a expiré. Reconnecte-toi pour continuer."
        : (body as { error?: string }).error ?? "Une erreur est survenue.";
    throw new ApiError(res.status, message);
  }

  return body as T;
}