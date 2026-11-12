declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;
declare const expect: (value: any) => {
  toBe: (expected: any) => void;
  toBeNull: () => void;
  not: {
    toBe: (expected: any) => void;
  };
  toEqual: (expected: any) => void;
  toMatch: (matcher: RegExp | string) => void;
  startsWith: (expected: string) => void;
};

import {
  commentDedupeKey,
  describeNotification,
  followDedupeKey,
  formatBadgeCount,
  getNotificationHref,
  likeDedupeKey,
  truncate,
} from "./helpers";
import { timeAgo } from "../timeAgo";

const actor = { username: "alex_fx", avatarUrl: null, avatarVersion: "v1" };

describe("clés anti-doublon", () => {
  it("sont déterministes : le même événement donne toujours la même clé", () => {
    expect(likeDedupeKey("u1", "p1")).toBe(likeDedupeKey("u1", "p1"));
    expect(followDedupeKey("u1", "u2")).toBe(followDedupeKey("u1", "u2"));
    expect(commentDedupeKey("c1")).toBe(commentDedupeKey("c1"));
  });

  it("distinguent auteur, publication et destinataire", () => {
    expect(likeDedupeKey("u1", "p1")).not.toBe(likeDedupeKey("u2", "p1"));
    expect(likeDedupeKey("u1", "p1")).not.toBe(likeDedupeKey("u1", "p2"));
    expect(followDedupeKey("u1", "u2")).not.toBe(followDedupeKey("u2", "u1"));
  });

  it("ne collisionnent pas entre types d'événements", () => {
    const keys = [likeDedupeKey("a", "b"), commentDedupeKey("a"), followDedupeKey("a", "b")];
    expect(new Set(keys).size).toBe(3);
  });
});

describe("describeNotification", () => {
  it("LIKE et COMMENT citent la publication", () => {
    expect(describeNotification({ type: "LIKE", postTitle: "Mon trade" })).toEqual({
      verb: "a aimé ta publication",
      subject: "Mon trade",
    });
    expect(describeNotification({ type: "COMMENT", postTitle: "Mon trade" })).toEqual({
      verb: "a commenté ta publication",
      subject: "Mon trade",
    });
  });

  it("FOLLOW n'a pas de sujet", () => {
    expect(describeNotification({ type: "FOLLOW", postTitle: null })).toEqual({
      verb: "a commencé à te suivre",
      subject: null,
    });
  });
});

describe("getNotificationHref", () => {
  it("FOLLOW mène au profil de l'auteur", () => {
    expect(getNotificationHref({ type: "FOLLOW", postId: null, commentId: null, actor })).toBe("/u/alex_fx");
  });

  it("LIKE mène à la publication", () => {
    expect(getNotificationHref({ type: "LIKE", postId: "p1", commentId: null, actor })).toBe("/posts/p1");
  });

  it("COMMENT mène à la publication avec le commentaire ciblé", () => {
    expect(getNotificationHref({ type: "COMMENT", postId: "p1", commentId: "c9", actor })).toBe(
      "/posts/p1?comment=c9"
    );
  });

  it("encode les valeurs et ne casse jamais la navigation", () => {
    expect(
      getNotificationHref({ type: "FOLLOW", postId: null, commentId: null, actor: { ...actor, username: "a b" } })
    ).toBe("/u/a%20b");
    expect(getNotificationHref({ type: "LIKE", postId: null, commentId: null, actor })).toBe("/feed");
  });
});

describe("formatBadgeCount", () => {
  it("masque le badge à 0 ou pour une valeur invalide", () => {
    expect(formatBadgeCount(0)).toBeNull();
    expect(formatBadgeCount(-3)).toBeNull();
    expect(formatBadgeCount(Number.NaN)).toBeNull();
  });

  it("affiche le nombre exact jusqu'à 99, puis plafonne", () => {
    expect(formatBadgeCount(1)).toBe("1");
    expect(formatBadgeCount(99)).toBe("99");
    expect(formatBadgeCount(100)).toBe("99+");
    expect(formatBadgeCount(2500)).toBe("99+");
  });
});

describe("truncate", () => {
  it("laisse les textes courts intacts et coupe les longs", () => {
    expect(truncate("court", 10)).toBe("court");
    expect(truncate("abcdefghijkl", 6)).toBe("abcde…");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-23T12:00:00.000Z").getTime();
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it("formate les durées récentes", () => {
    expect(timeAgo(ago(30_000), now)).toBe("à l'instant");
    expect(timeAgo(ago(5 * 60_000), now)).toBe("il y a 5 min");
    expect(timeAgo(ago(3 * 3_600_000), now)).toBe("il y a 3 h");
    expect(timeAgo(ago(2 * 86_400_000), now)).toBe("il y a 2 j");
  });

  it("bascule sur une date au-delà de 30 jours", () => {
    const result = timeAgo(ago(45 * 86_400_000), now);
    expect(result.startsWith("il y a")).toBe(false);
    expect(result).toMatch(/\d/);
  });

  it("tolère une date invalide ou une horloge en avance", () => {
    expect(timeAgo("pas-une-date", now)).toBe("");
    expect(timeAgo(new Date(now + 60_000).toISOString(), now)).toBe("à l'instant");
  });
});