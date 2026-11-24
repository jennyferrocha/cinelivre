import { describe, expect, it } from "vitest";
import { pickLogo } from "@/lib/movies/logo";
import type { TmdbImage } from "@/lib/tmdb/types";

const logo = (file_path: string, iso_639_1: string | null): TmdbImage => ({
  file_path,
  iso_639_1,
  aspect_ratio: 3,
  vote_average: 0,
});

describe("pickLogo", () => {
  it("prefere português, depois inglês", () => {
    expect(pickLogo([logo("/en.png", "en"), logo("/pt.png", "pt")])?.file_path).toBe("/pt.png");
    expect(pickLogo([logo("/x.png", null), logo("/en.png", "en")])?.file_path).toBe("/en.png");
  });

  it("ignora SVG e volta null sem opção", () => {
    expect(pickLogo([logo("/pt.svg", "pt")])).toBeNull();
    expect(pickLogo([])).toBeNull();
  });
});
