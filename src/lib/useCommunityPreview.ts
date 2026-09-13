"use client";

import { useEffect, useState } from "react";
import type { Post } from "@/types/post";

export function useCommunityPreview(limit = 3) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setPosts((data.posts ?? []).slice(0, limit)))
      .finally(() => setLoading(false));
  }, [limit]);

  return { posts, loading };
}