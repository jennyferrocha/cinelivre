import type { DiscoverFilters } from "@/lib/movies/discover";
import { RATING_OPTIONS, RUNTIME_OPTIONS, SINCE_OPTIONS } from "@/lib/movies/filters";
import type { TmdbGenre } from "@/lib/tmdb/types";

const chip =
  "cursor-pointer rounded-full border border-foreground/20 px-3.5 py-1.5 text-sm font-medium transition-colors select-none hover:border-foreground/40 has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-background has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent";

function Choice({ name, value, label, checked, type = "radio" }: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  type?: "radio" | "checkbox";
}) {
  return (
    <label className={chip}>
      <input type={type} name={name} value={value} defaultChecked={checked} className="sr-only" />
      {label}
    </label>
  );
}

function Group({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold text-muted">{legend}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/** Filtros num formulário GET: ao enviar, tudo vai para a URL (dá para recarregar e compartilhar). */
export function FilterForm({ genres, filters }: { genres: TmdbGenre[]; filters: DiscoverFilters }) {
  const since = filters.releasedFrom?.slice(0, 4);
  return (
    <form method="get" action="/sugestoes" className="flex flex-col gap-5">
      <Group legend="Gêneros">
        {genres.map((g) => (
          <Choice key={g.id} type="checkbox" name="generos" value={String(g.id)} label={g.name} checked={!!filters.genres?.includes(g.id)} />
        ))}
      </Group>
      <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:gap-10">
        <Group legend="Duração">
          <Choice name="duracao" value="" label="Qualquer" checked={!filters.maxRuntime} />
          {RUNTIME_OPTIONS.map((o) => (
            <Choice key={o.value} name="duracao" value={String(o.value)} label={o.label} checked={filters.maxRuntime === o.value} />
          ))}
        </Group>
        <Group legend="Nota mínima">
          <Choice name="nota" value="" label="Qualquer" checked={!filters.minRating} />
          {RATING_OPTIONS.map((n) => (
            <Choice key={n} name="nota" value={String(n)} label={`★ ${n}+`} checked={filters.minRating === n} />
          ))}
        </Group>
        <Group legend="Época">
          <Choice name="desde" value="" label="Qualquer" checked={!since} />
          {SINCE_OPTIONS.map((o) => (
            <Choice key={o.value} name="desde" value={String(o.value)} label={o.label} checked={since === String(o.value)} />
          ))}
        </Group>
      </div>
      <div className="flex gap-3">
        <button type="submit" className="rounded-md bg-foreground px-5 py-2.5 font-semibold text-background hover:bg-foreground/85">
          Ver filmes
        </button>
        <a href="/sugestoes" className="rounded-md px-4 py-2.5 text-sm font-medium text-foreground/80 hover:bg-foreground/10">
          Limpar filtros
        </a>
      </div>
    </form>
  );
}
