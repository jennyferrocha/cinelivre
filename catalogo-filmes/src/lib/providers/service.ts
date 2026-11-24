import "server-only";
import { tmdbFetch } from "@/lib/tmdb/client";
import type { TmdbProvider } from "@/lib/tmdb/types";
import { groupProviders, type ServiceGroup } from "@/lib/providers/grouping";

/** Todos os serviços de streaming de filmes no Brasil, já agrupados. */
export async function getServiceGroups(): Promise<ServiceGroup[]> {
  const data = await tmdbFetch<{ results: TmdbProvider[] }>(
    "/watch/providers/movie",
    { watch_region: "BR" },
    86400,
  );
  return groupProviders(data.results);
}
