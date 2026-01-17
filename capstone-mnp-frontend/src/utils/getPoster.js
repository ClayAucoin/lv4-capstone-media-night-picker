// src/utils/getPoster.js

export async function getTraktMovie(slug) {
  // console.log(`getTraktMovie: ${slug}`)

  const res = await fetch(`https://api.trakt.tv/movies/${slug}`, {
    headers: {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key": import.meta.env.VITE_TRAKT_CLIENT_ID,
    },
  });

  const body = await res.text();
  if (!res.ok) {
    console.error("Trakt error:", res.status, body);
    throw new Error("Trakt request failed");
  }

  return JSON.parse(body);
}

async function traktMovieBySlug(slug) {
  // console.log(`traktMovieBySlug: ${slug}`)

  const res = await fetch(`https://api.trakt.tv/movies/${slug}?extended=full`, {
    headers: {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key": import.meta.env.VITE_TRAKT_CLIENT_ID, // your client_id (not secret)
    },
  });

  if (!res.ok) throw new Error(`Trakt error ${res.status}`);
  return res.json(); // includes ids.tmdb
}

async function tmdbMoviePosters(tmdbId) {
  // console.log(`tmdbMoviePosters: ${tmdbId}`)

  const url = new URL(`https://api.themoviedb.org/3/movie/${tmdbId}/images`);
  // key trick: ask for English AND "no language" images to avoid foreign posters
  url.searchParams.set("include_image_language", "en,null");

  const res = await fetch(url.toString(), {
    headers: {
      // Prefer TMDB v4 read token if you have it:
      Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`TMDB error ${res.status}`);
  return res.json(); // { posters: [...] }
}

function tmdbImg(path, size = "w342") {
  // console.log(`tmdbImg: path: ${path}, size: ${size}`)

  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export async function posterFromTraktMovieSlug(slug) {
  // console.log(`posterFromTraktMovieSlug: ${slug}`)

  const trakt = await traktMovieBySlug(slug);
  const tmdbId = trakt?.ids?.tmdb;
  if (!tmdbId) return null;

  const images = await tmdbMoviePosters(tmdbId);

  // pick first English, else first null-language, else first poster
  const posters = images?.posters ?? [];
  const pick =
    posters.find(p => p.iso_639_1 === "en") ||
    posters.find(p => p.iso_639_1 == null) ||
    posters[0];

  return pick ? tmdbImg(pick.file_path, "w342") : null;
}
