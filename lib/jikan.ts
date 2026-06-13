// Jikan API v4 - No API key required
// Docs: https://docs.api.jikan.moe/

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

export interface JikanAnime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
  episodes: number | null;
  score: number | null;
  genres: Array<{ mal_id: number; name: string }>;
  synopsis: string | null;
  status: string;
  year: number | null;
  season: string | null;
}

export interface SearchResult {
  data: JikanAnime[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
  };
}

export async function searchAnime(
  query: string,
  page: number = 1
): Promise<SearchResult> {
  const res = await fetch(
    `${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=20&sfw=true`,
    { next: { revalidate: 300 } } // cache 5 minutes
  );

  if (!res.ok) {
    throw new Error(`Jikan API error: ${res.status}`);
  }

  return res.json();
}

export async function getAnimeById(id: number): Promise<{ data: JikanAnime }> {
  const res = await fetch(`${JIKAN_BASE_URL}/anime/${id}`, {
    next: { revalidate: 3600 }, // cache 1 hour
  });

  if (!res.ok) {
    throw new Error(`Jikan API error: ${res.status}`);
  }

  return res.json();
}

export async function getTopAnime(page: number = 1): Promise<SearchResult> {
  const res = await fetch(
    `${JIKAN_BASE_URL}/top/anime?page=${page}&limit=20`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) {
    throw new Error(`Jikan API error: ${res.status}`);
  }

  return res.json();
}
