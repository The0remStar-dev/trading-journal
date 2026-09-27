"use client";

import { useEffect, useState } from "react";

export function useTradeFacets() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trades/facets", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setSymbols(data.symbols ?? []);
        setTags(data.tags ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return { symbols, tags, loading };
}