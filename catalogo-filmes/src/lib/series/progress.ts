// Regras do acompanhamento de séries: progresso, próximo episódio e situação.
// Nada disso é guardado: é calculado a partir dos episódios marcados e do "formato" da série
// no TMDB. Assim, quando sai episódio novo, a série volta sozinha para "Acompanhando".
// Funções puras, usadas no servidor e no navegador.

export type EpisodeRef = { season: number; episode: number };

/** O que o TMDB diz da série: temporadas regulares, último episódio exibido, se terminou. */
export type SeriesShape = {
  /** Só temporadas regulares (os especiais, temporada 0, não contam). */
  seasons: { number: number; episodeCount: number }[];
  lastAired: EpisodeRef | null;
  finished: boolean;
  /** AAAA-MM-DD do próximo episódio anunciado, se houver. */
  nextAirDate: string | null;
};

export type SeriesSituation = "quero" | "acompanhando" | "assisti" | "parei";

export type Progress = { watched: number; total: number; next: EpisodeRef | null };

type Flags = { want: boolean; stopped: boolean };

export function episodeKey(e: EpisodeRef): string {
  return `${e.season}:${e.episode}`;
}

const isRegular = (e: EpisodeRef) => e.season > 0;

/** Episódios regulares já exibidos, em ordem (T1E1, T1E2… até o último exibido). */
export function airedEpisodes(shape: SeriesShape): EpisodeRef[] {
  const last = shape.lastAired;
  if (!last) return [];
  const result: EpisodeRef[] = [];
  for (const s of [...shape.seasons].filter((x) => x.number > 0).sort((a, b) => a.number - b.number)) {
    if (s.number > last.season) break;
    const upTo = s.number === last.season ? Math.min(last.episode, s.episodeCount || last.episode) : s.episodeCount;
    for (let ep = 1; ep <= upTo; ep++) result.push({ season: s.number, episode: ep });
  }
  return result;
}

/** Quantos dos exibidos a pessoa viu e qual é o próximo (o primeiro depois do último marcado). */
export function seriesProgress(shape: SeriesShape, watched: EpisodeRef[]): Progress {
  const aired = airedEpisodes(shape);
  const seen = new Set(watched.filter(isRegular).map(episodeKey));
  let lastIndex = -1;
  let count = 0;
  aired.forEach((e, i) => {
    if (seen.has(episodeKey(e))) {
      count++;
      lastIndex = i;
    }
  });
  return { watched: count, total: aired.length, next: aired[lastIndex + 1] ?? null };
}

/** Em que lista a série está. null = em nenhuma. */
export function seriesSituation(flags: Flags, shape: SeriesShape, watched: EpisodeRef[]): SeriesSituation | null {
  if (!watched.some(isRegular)) return flags.want ? "quero" : null;
  if (flags.stopped) return "parei";
  const p = seriesProgress(shape, watched);
  if (shape.finished && p.total > 0 && p.watched >= p.total) return "assisti";
  return "acompanhando";
}

/** Situação quando o TMDB não respondeu: decide só pelo que está guardado. */
export function situationWithoutShape(flags: Flags, watched: EpisodeRef[]): SeriesSituation | null {
  if (!watched.some(isRegular)) return flags.want ? "quero" : null;
  return flags.stopped ? "parei" : "acompanhando";
}

/** Episódios regulares exibidos antes de `target` que ainda não foram marcados. */
export function previousUnwatched(shape: SeriesShape, watched: EpisodeRef[], target: EpisodeRef): EpisodeRef[] {
  if (!isRegular(target)) return [];
  const seen = new Set(watched.map(episodeKey));
  const before = (e: EpisodeRef) => e.season < target.season || (e.season === target.season && e.episode < target.episode);
  return airedEpisodes(shape).filter((e) => before(e) && !seen.has(episodeKey(e)));
}

function brDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** O texto do progresso: "Próximo: T2 E6 · título", "Em dia · novo episódio em 12/03/2027"... */
export function progressLabel(
  p: Progress,
  situation: SeriesSituation | null,
  shape: SeriesShape,
  nextTitle?: string,
): string {
  if (situation === "parei") return "Você parou de assistir";
  if (situation === "assisti") return "✓ Você assistiu tudo";
  if (p.next) return `Próximo: T${p.next.season} E${p.next.episode}${nextTitle ? ` · ${nextTitle}` : ""}`;
  return shape.nextAirDate && /^\d{4}-\d{2}-\d{2}$/.test(shape.nextAirDate)
    ? `Em dia · novo episódio em ${brDate(shape.nextAirDate)}`
    : "Em dia";
}
