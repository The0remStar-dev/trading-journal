"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, Info, Lock, UserX } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfilePerformanceSection } from "@/components/profile/ProfilePerformanceSection";
import { ProfilePostsSection } from "@/components/profile/ProfilePostsSection";
import { ProfileTradesTable } from "@/components/profile/ProfileTradesTable";
import { usePublicProfile } from "@/lib/usePublicProfile";

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const { data, loading, error, notFound, refetch } = usePublicProfile(username);

  return (
    <AppShell>
      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-64" />
        </div>
      ) : notFound ? (
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState
            icon={UserX}
            title="Profil introuvable"
            description="Ce nom d'utilisateur n'existe pas ou a changé."
            className="py-16"
          />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-md border border-loss/30 bg-loss-dim px-4 py-3 text-sm text-loss">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : data ? (
        <div className="flex flex-col gap-5">
          <ProfileHeader
            profile={data.profile}
            postCount={data.postCount}
            onFollowChanged={() => refetch(true)}
          />

          {data.profile.isOwnProfile && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-textSecondary">
              <Info className="h-4 w-4 shrink-0 text-accent" />
              <span>
                Tu vois ton profil complet. Les autres voient uniquement ce que tu as choisi de partager —{" "}
                <Link href="/settings" className="font-medium text-accent hover:underline">
                  gérer la confidentialité
                </Link>
                .
              </span>
            </div>
          )}

          {!data.access.canViewContent ? (
            <Card>
              <EmptyState
                icon={Lock}
                title="Ce profil est privé"
                description={`Suis @${data.profile.username} pour voir ses publications et ses statistiques.`}
                className="py-14"
              />
            </Card>
          ) : (
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="posts">Publications</TabsTrigger>
                <TabsTrigger value="trades">Trades</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="flex flex-col gap-5">
                  <ProfilePerformanceSection
                    access={data.access}
                    performance={data.performance}
                    stats={data.stats}
                    history={data.history}
                  />
                </div>
              </TabsContent>

              <TabsContent value="posts">
                <ProfilePostsSection username={data.profile.username} />
              </TabsContent>

              <TabsContent value="trades">
                <ProfileTradesTable trades={data.trades} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      ) : null}
    </AppShell>
  );
}