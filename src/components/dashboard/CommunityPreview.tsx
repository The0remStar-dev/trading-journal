import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCommunityPreview } from "@/lib/useCommunityPreview";

export function CommunityPreview() {
  const { posts, loading } = useCommunityPreview(3);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-foreground">Communauté</CardTitle>
        <Link href="/feed" className="text-xs font-medium text-accent hover:underline">
          Voir tout
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState icon={Users} title="Aucune publication récente" />
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href="/feed"
                className="block rounded-md border border-border p-3 transition-colors hover:bg-secondary"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{post.title}</p>
                  {post.rMultiple !== null && (
                    <Badge variant={post.rMultiple >= 0 ? "win" : "loss"}>
                      {post.rMultiple >= 0 ? "+" : ""}
                      {post.rMultiple.toFixed(2)}R
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted">par {post.author.username}</p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}