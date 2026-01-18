// src/utils/getPoster.js

async function traktMovieBySlug(slug) {
  const res = await fetch(`https://api.trakt.tv/movies/${slug}?extended=full`, {
    headers: {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key": import.meta.env.VITE_TRAKT_CLIENT_ID,
    },
  });

  if (!res.ok) throw new Error(`Trakt error ${res.status}`);
  return res.json(); // includes ids.tmdb
}

async function tmdbMoviePosters(tmdbId) {
  const url = new URL(`https://api.themoviedb.org/3/movie/${tmdbId}/images`);
  url.searchParams.set("include_image_language", "en,null");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`TMDB error ${res.status}`);
  return res.json(); // { posters: [...] }
}

function tmdbImg(path, size = "w342") {
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export async function posterFromTraktMovieSlug(slug) {
  if (!slug) return null

  const trakt = await traktMovieBySlug(slug)
  const tmdbId = trakt?.ids?.tmdb
  if (!tmdbId) return null

  const images = await tmdbMoviePosters(tmdbId)

  const posters = images?.posters ?? []
  const pick =
    posters.find((p) => p.iso_639_1 === "en") ||
    posters.find((p) => p.iso_639_1 == null) ||
    posters[0]

  return pick ? tmdbImg(pick.file_path, "w342") : null
}
