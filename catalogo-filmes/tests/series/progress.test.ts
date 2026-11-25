import { describe, expect, it } from "vitest";
import {
  adoptServerState,
  airedEpisodes,
  canMark,
  episodeKey,
  previousUnwatched,
  progressLabel,
  seriesProgress,
  seriesSituation,
  situationWithoutShape,
  type SeriesShape,
} from "@/lib/series/progress";

const e = (season: number, episode: number) => ({ season, episode });
const shape: SeriesShape = {
  seasons: [
    { number: 1, episodeCount: 3 },
    { number: 2, episodeCount: 3 },
  ],
  lastAired: e(2, 2),
  finished: false,
  nextAirDate: "2027-03-12",
};
const none = { want: false, stopped: false };

describe("airedEpisodes", () => {
  it("episódios regulares exibidos, em ordem, até o último exibido", () => {
    expect(airedEpisodes(shape)).toEqual([e(1, 1), e(1, 2), e(1, 3), e(2, 1), e(2, 2)]);
    expect(airedEpisodes({ ...shape, lastAired: null })).toEqual([]);
  });
});

describe("seriesProgress", () => {
  it("próximo é o depois do último marcado, não o primeiro buraco", () => {
    expect(seriesProgress(shape, [e(1, 3)])).toEqual({ watched: 1, total: 5, next: e(2, 1) });
    expect(seriesProgress(shape, [])).toEqual({ watched: 0, total: 5, next: e(1, 1) });
  });

  it("especiais e marcas além do exibido não contam; nunca passa do total", () => {
    expect(seriesProgress(shape, [e(0, 1), e(2, 3), e(9, 1), ...airedEpisodes(shape)])).toEqual({
      watched: 5,
      total: 5,
      next: null,
    });
  });
});

describe("seriesSituation", () => {
  it("sem nada: fora das listas; só 'quero': Quero assistir", () => {
    expect(seriesSituation(none, shape, [])).toBeNull();
    expect(seriesSituation({ want: true, stopped: false }, shape, [])).toBe("quero");
    expect(seriesSituation({ want: true, stopped: false }, shape, [e(0, 1)])).toBe("quero");
  });

  it("com episódios: acompanhando; em dia mas a série continua: acompanhando", () => {
    expect(seriesSituation(none, shape, [e(1, 1)])).toBe("acompanhando");
    expect(seriesSituation(none, shape, airedEpisodes(shape))).toBe("acompanhando");
  });

  it("tudo visto e série terminada: Já assisti; saiu episódio novo: volta a acompanhando", () => {
    expect(seriesSituation(none, { ...shape, finished: true }, airedEpisodes(shape))).toBe("assisti");
    expect(seriesSituation(none, { ...shape, finished: true, lastAired: e(2, 3) }, airedEpisodes(shape))).toBe(
      "acompanhando",
    );
  });

  it("parei só vale com episódios marcados", () => {
    expect(seriesSituation({ want: false, stopped: true }, shape, [e(1, 1)])).toBe("parei");
    expect(seriesSituation({ want: true, stopped: true }, shape, [])).toBe("quero");
  });
});

describe("situationWithoutShape (TMDB fora do ar)", () => {
  it("decide só pelo que está guardado", () => {
    expect(situationWithoutShape(none, [e(1, 1)])).toBe("acompanhando");
    expect(situationWithoutShape({ want: true, stopped: false }, [])).toBe("quero");
    expect(situationWithoutShape({ want: false, stopped: true }, [e(1, 1)])).toBe("parei");
    expect(situationWithoutShape(none, [e(0, 1)])).toBeNull();
  });
});

describe("previousUnwatched", () => {
  it("atravessa temporadas e pula os já marcados", () => {
    expect(previousUnwatched(shape, [e(1, 2)], e(2, 2))).toEqual([e(1, 1), e(1, 3), e(2, 1)]);
    expect(previousUnwatched(shape, [], e(1, 1))).toEqual([]);
    expect(previousUnwatched(shape, [], e(0, 1))).toEqual([]);
  });
});

describe("progressLabel", () => {
  it("próximo, em dia, tudo visto e parei", () => {
    expect(progressLabel({ watched: 1, total: 5, next: e(2, 1) }, "acompanhando", shape, "O retorno")).toBe(
      "Próximo: T2 E1 · O retorno",
    );
    expect(progressLabel({ watched: 1, total: 5, next: e(2, 1) }, "acompanhando", shape)).toBe("Próximo: T2 E1");
    expect(progressLabel({ watched: 5, total: 5, next: null }, "acompanhando", shape)).toBe(
      "Em dia · novo episódio em 12/03/2027",
    );
    expect(progressLabel({ watched: 5, total: 5, next: null }, "acompanhando", { ...shape, nextAirDate: null })).toBe(
      "Em dia",
    );
    expect(progressLabel({ watched: 5, total: 5, next: null }, "assisti", shape)).toBe("✓ Você assistiu tudo");
    expect(progressLabel({ watched: 1, total: 5, next: e(1, 2) }, "parei", shape)).toBe("Você parou de assistir");
  });
});

describe("episodeKey", () => {
  it("temporada:episódio", () => {
    expect(episodeKey(e(2, 6))).toBe("2:6");
  });
});

describe("especial como último episódio exibido", () => {
  it("não zera os episódios já exibidos", () => {
    const withSpecial = { ...shape, lastAired: e(0, 4) };
    expect(airedEpisodes(withSpecial)).toEqual([e(1, 1), e(1, 2), e(1, 3), e(2, 1), e(2, 2), e(2, 3)]);
  });
});

describe("canMark", () => {
  it("regular: só o que o servidor também aceita; especial: pela data do episódio", () => {
    expect(canMark(shape, e(2, 2), true)).toBe(true);
    expect(canMark(shape, e(2, 3), true)).toBe(false); // data diz que saiu hoje, o TMDB ainda não
    expect(canMark(shape, e(0, 1), true)).toBe(true);
    expect(canMark(shape, e(0, 1), false)).toBe(false);
  });
});

describe("adoptServerState", () => {
  it("só adota o estado do servidor quando nada está sendo salvo", () => {
    expect(adoptServerState("a", "b", 0)).toBe(true);
    expect(adoptServerState("a", "b", 1)).toBe(false);
    expect(adoptServerState("a", "a", 0)).toBe(false);
  });
});
