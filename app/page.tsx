"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

const TMDB_MOVIE_GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

const TMDB_TV_GENRES = [
  { id: 10759, name: "Action & Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 10762, name: "Kids" },
  { id: 9648, name: "Mystery" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 37, name: "Western" },
];

const MOVIE_GENRE_MAP: Record<number, string> = Object.fromEntries(
  TMDB_MOVIE_GENRES.map((g) => [g.id, g.name])
);
const TV_GENRE_MAP: Record<number, string> = Object.fromEntries(
  TMDB_TV_GENRES.map((g) => [g.id, g.name])
);

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const IMAGE_LARGE = "https://image.tmdb.org/t/p/original";
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";

const STREAM_PROVIDERS = [
  { provider_id: 8, provider_name: "Netflix" },
  { provider_id: 9, provider_name: "Prime" },
  { provider_id: 15, provider_name: "Hulu" },
  { provider_id: 1899, provider_name: "Max" },
  { provider_id: 337, provider_name: "Disney+" },
  { provider_id: 531, provider_name: "Paramount+" },
  { provider_id: 386, provider_name: "Peacock" },
  { provider_id: 350, provider_name: "Apple TV+" },
  { provider_id: 43, provider_name: "Starz" },
  { provider_id: 528, provider_name: "AMC+" },
];

const FAMILY_CHIPS = [
  { label: "🎨 Animation", genreId: "16" },
  { label: "🗺️ Adventure", genreId: "12" },
  { label: "😄 Comedy", genreId: "35" },
  { label: "🚀 Sci-Fi", genreId: "878" },
];

const MOOD_VIBES = [
  { key: "nostalgic",    label: "Nostalgic",    emoji: "🕰️", tagline: "take me back in time",      activeClasses: "border-amber-500 bg-amber-900/20 text-amber-300",   genres: [18, 10751], yearCap: 2005 },
  { key: "thrilled",    label: "Thrilled",     emoji: "😱", tagline: "keep me on the edge",        activeClasses: "border-red-500 bg-red-900/20 text-red-300",         genres: [53, 28] },
  { key: "emotional",   label: "Emotional",    emoji: "💙", tagline: "make me feel deeply",        activeClasses: "border-blue-500 bg-blue-900/20 text-blue-300",       genres: [18, 10749] },
  { key: "inspired",    label: "Inspired",     emoji: "✨", tagline: "lift my spirits",            activeClasses: "border-purple-500 bg-purple-900/20 text-purple-300", genres: [18, 99] },
  { key: "entertained", label: "Entertained",  emoji: "😂", tagline: "make me laugh out loud",    activeClasses: "border-green-500 bg-green-900/20 text-green-300",    genres: [35, 16] },
  { key: "adventurous", label: "Adventurous",  emoji: "🗺️", tagline: "take me somewhere new",     activeClasses: "border-teal-500 bg-teal-900/20 text-teal-300",      genres: [12, 28] },
  { key: "romantic",    label: "Romantic",     emoji: "💕", tagline: "feel the love",             activeClasses: "border-rose-500 bg-rose-900/20 text-rose-300",      genres: [10749, 18] },
  { key: "scared",      label: "Scared",       emoji: "👻", tagline: "give me the chills",        activeClasses: "border-violet-500 bg-violet-900/20 text-violet-300", genres: [27, 53] },
  { key: "amazed",      label: "Amazed",       emoji: "🤩", tagline: "blow my mind",              activeClasses: "border-cyan-500 bg-cyan-900/20 text-cyan-300",      genres: [878, 14] },
  { key: "cozy",        label: "Cozy",         emoji: "🛋️", tagline: "warm & comfortable",        activeClasses: "border-orange-500 bg-orange-900/20 text-orange-300", genres: [10751, 35] },
] as const;

const ENERGY_LABELS = [
  { label: "Low-key",  sub: "background viewing"   },
  { label: "Relaxed",  sub: "comfy couch session"   },
  { label: "Engaged",  sub: "full attention"        },
  { label: "Pumped",   sub: "edge of your seat"     },
  { label: "Intense",  sub: "white-knuckle"         },
];

interface TMDbMovie {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string;
  overview: string;
  genre_ids: number[];
  vote_average: number;
  media_type?: string;
}

interface TMDbDetail {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string;
  overview: string;
  genres: { id: number; name: string }[];
  vote_average: number;
  runtime?: number;
  status: string;
  tagline?: string;
  release_dates?: {
    results: {
      iso_3166_1: string;
      release_dates: { certification: string; type: number }[];
    }[];
  };
}

interface TMDbWatchProviders {
  results: {
    [country: string]: {
      link: string;
      flatrate?: TMDbProvider[];
      rent?: TMDbProvider[];
      buy?: TMDbProvider[];
    };
  };
}

interface TMDbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface TMDbPopularPerson {
  id: number;
  name: string;
  known_for_department: string;
  profile_path: string;
}

interface TMDbResponse {
  results: TMDbMovie[];
  total_results?: number;
  total_pages?: number;
  page?: number;
}

interface Movie {
  id: number;
  title: string;
  year: string;
  poster: string;
  plot: string;
  genre: string;
  imdb_rating: string;
  mediaType: "movie" | "tv";
}

function mapMovie(movie: TMDbMovie, isTv = false): Movie {
  const genreMap = isTv ? TV_GENRE_MAP : MOVIE_GENRE_MAP;
  return {
    id: movie.id,
    title: movie.title || movie.name || "",
    year: (movie.release_date || movie.first_air_date || "").split("-")[0],
    poster: movie.poster_path ? `${IMAGE_BASE}${movie.poster_path}` : "",
    plot: movie.overview || "",
    genre: (movie.genre_ids || [])
      .slice(0, 3)
      .map((id) => genreMap[id] || "")
      .filter(Boolean)
      .join(", "),
    imdb_rating: movie.vote_average ? movie.vote_average.toFixed(1) : "",
    mediaType: isTv ? "tv" : "movie",
  };
}

function HomeContent() {
  const [query, setQuery] = useState("");
  const [actorSearch, setActorSearch] = useState("");
  const [tvQuery, setTvQuery] = useState("");
  const [searchType, setSearchType] = useState<"movie" | "actor" | "tv">("movie");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [featured, setFeatured] = useState<Movie[]>([]);
  const [apiKey, setApiKey] = useState<string>(API_KEY);

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [movieDetail, setMovieDetail] = useState<TMDbDetail | null>(null);
  const [watchProviders, setWatchProviders] = useState<{
    flatrate: TMDbProvider[];
    rent: TMDbProvider[];
    buy: TMDbProvider[];
  }>({ flatrate: [], rent: [], buy: [] });
  const [detailLoading, setDetailLoading] = useState(false);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [movieCredits, setMovieCredits] = useState<{ name: string; character: string }[]>([]);

  const [showFilters, setShowFilters] = useState(false);
  const [filterGenre, setFilterGenre] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string[]>([]);
  const [filterStream, setFilterStream] = useState<string>("");
  const [filterRatings, setFilterRatings] = useState<string[]>([]);
  const [filterStars, setFilterStars] = useState<string>("");

  const [showMoodTool, setShowMoodTool] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState(3);

  const [sortBy, setSortBy] = useState<string>("popularity");

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [popularActors, setPopularActors] = useState<TMDbPopularPerson[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);

  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Movie[]>([]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const movieId = searchParams.get("movie");
  const mediaType = searchParams.get("type") || "movie";

  useEffect(() => {
    const key = API_KEY || localStorage.getItem("tmdb_api_key") || "";
    if (key) setApiKey(key);

    const storedFavs = localStorage.getItem("favorites");
    if (storedFavs) setFavorites(JSON.parse(storedFavs));

    const storedWL = localStorage.getItem("watchlist");
    if (storedWL) setWatchlist(JSON.parse(storedWL));

    const storedRecent = localStorage.getItem("recentlyViewed");
    if (storedRecent) setRecentlyViewed(JSON.parse(storedRecent));
  }, []);

  useEffect(() => {
    if (apiKey) {
      fetchFeaturedMovies();
      fetchPopularActors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  useEffect(() => {
    if (movieId && apiKey) {
      fetchMovieDetail(parseInt(movieId), mediaType as "movie" | "tv");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, apiKey, mediaType]);

  async function fetchFeaturedMovies() {
    if (!apiKey) return;
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`
      );
      const data: TMDbResponse = await res.json();
      setFeatured((data.results || []).map((m) => mapMovie(m, false)));
    } catch (e) {
      console.error("fetchFeaturedMovies", e);
    }
  }

  async function fetchPopularActors() {
    if (!apiKey) return;
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/person/popular?api_key=${apiKey}&language=en-US&page=1`
      );
      const data = await res.json();
      if (data.results) setPopularActors(data.results.slice(0, 20));
    } catch (e) {
      console.error("fetchPopularActors", e);
    }
  }

  const fetchMovieDetail = useCallback(
    async (id: number, type: "movie" | "tv" = "movie") => {
      setDetailLoading(true);
      setWatchProviders({ flatrate: [], rent: [], buy: [] });
      setSimilarMovies([]);
      setMovieCredits([]);
      const baseEndpoint = type === "tv" ? "tv" : "movie";
      try {
        const [detailRes, providersRes, similarRes, recommendRes, creditsRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/${baseEndpoint}/${id}?api_key=${apiKey}&language=en-US&append_to_response=release_dates`),
          fetch(`https://api.themoviedb.org/3/${baseEndpoint}/${id}/watch/providers?api_key=${apiKey}`),
          fetch(`https://api.themoviedb.org/3/${baseEndpoint}/${id}/similar?api_key=${apiKey}&language=en-US&page=1`),
          fetch(`https://api.themoviedb.org/3/${baseEndpoint}/${id}/recommendations?api_key=${apiKey}&language=en-US&page=1`),
          fetch(`https://api.themoviedb.org/3/${baseEndpoint}/${id}/credits?api_key=${apiKey}&language=en-US`),
        ]);

        const detailData: TMDbDetail = await detailRes.json();
        const providersData: TMDbWatchProviders = await providersRes.json();
        const similarData: TMDbResponse = await similarRes.json();
        const recommendData: TMDbResponse = await recommendRes.json();
        const creditsData = await creditsRes.json();

        if (creditsData.cast) {
          setMovieCredits(
            creditsData.cast.slice(0, 5).map((c: { name: string; character: string }) => ({
              name: c.name,
              character: c.character,
            }))
          );
        }

        const mappedMovie: Movie = {
          id: detailData.id,
          title: detailData.title || detailData.name || "",
          year: detailData.release_date ? detailData.release_date.split("-")[0] : detailData.first_air_date ? detailData.first_air_date.split("-")[0] : "",
          poster: detailData.poster_path ? `${IMAGE_LARGE}${detailData.poster_path}` : "",
          plot: detailData.overview || "",
          genre: detailData.genres?.map((g) => g.name).join(", ") || "",
          imdb_rating: detailData.vote_average ? detailData.vote_average.toFixed(1) : "",
          mediaType: type,
        };
        setMovieDetail(detailData);
        setSelectedMovie(mappedMovie);

        setRecentlyViewed((prev) => {
          const filtered = prev.filter((m) => m.id !== mappedMovie.id);
          const updated = [mappedMovie, ...filtered].slice(0, 10);
          localStorage.setItem("recentlyViewed", JSON.stringify(updated));
          return updated;
        });

        const usProviders = providersData.results?.US;
        setWatchProviders({
          flatrate: usProviders?.flatrate || [],
          rent: usProviders?.rent || [],
          buy: usProviders?.buy || [],
        });

        const seen = new Set<number>([id]);
        const combined: TMDbMovie[] = [];
        for (const m of [...(similarData.results || []), ...(recommendData.results || [])]) {
          if (!seen.has(m.id)) {
            seen.add(m.id);
            combined.push(m);
          }
          if (combined.length >= 6) break;
        }
        setSimilarMovies(combined.map((m) => mapMovie(m, type === "tv")));
      } catch (e) {
        console.error("fetchMovieDetail", e);
      } finally {
        setDetailLoading(false);
      }
    },
    [apiKey]
  );

  function apiSortBy(): string {
    if (sortBy === "vote_average") return "vote_average.desc";
    if (sortBy === "release_date") return "primary_release_date.desc";
    return "popularity.desc";
  }

  async function handleSearch(e: React.FormEvent, newPage = 1, searchTypeParam?: "movie" | "actor" | "tv") {
    e.preventDefault();
    if (!apiKey) { setError("Please enter your TMDB API key first."); return; }
    const type = searchTypeParam || (actorSearch.trim() ? "actor" : tvQuery.trim() ? "tv" : "movie");
    setSearchType(type);
    setLoading(true);
    setError("");
    try {
      const results = await searchWithFilters(newPage, type);
      if (sortBy === "title") results.sort((a, b) => a.title.localeCompare(b.title));
      if (newPage === 1) setMovies(results);
      else setMovies((prev) => [...prev, ...results]);
      setCurrentPage(newPage);
      setHasMore(results.length === 20);
      if (newPage === 1 && results.length === 0) setError(type === "tv" ? "No TV shows found." : type === "actor" ? "No actors found." : "No movies found. Try different filters.");
    } catch (e) {
      console.error(e);
      setError("Failed to search. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function searchWithFilters(page: number, searchType: "movie" | "actor" | "tv" = "movie"): Promise<Movie[]> {
    if (!apiKey) return [];
    const sort = apiSortBy();
    const movieBase = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&sort_by=${sort}&page=${page}`;
    const tvBase = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=en-US&sort_by=${sort}&page=${page}`;

    function addFilters(url: string, isTv: boolean): string {
      if (filterGenre) url += `&with_genres=${filterGenre}`;
      if (filterStream) url += `&with_watch_providers=${filterStream}&watch_region=US`;
      if (filterStars === "6+") url += `&vote_average.gte=6`;
      if (filterStars === "5-") url += `&vote_average.lte=5`;
      if (filterRatings.length > 0 && !isTv) {
        const order = ["G", "PG", "PG-13", "R", "NC-17"];
        const indices = filterRatings.map((r) => order.indexOf(r)).filter((i) => i >= 0);
        if (indices.length > 0) {
          url += `&certification_country=US&certification.gte=${order[Math.min(...indices)]}&certification.lte=${order[Math.max(...indices)]}`;
        }
      }
      return url;
    }

    if (searchType === "tv") {
      if (tvQuery.trim()) {
        const searchRes = await fetch(
          `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(tvQuery)}&language=en-US&page=${page}&include_adult=false`
        );
        const searchData: TMDbResponse = await searchRes.json();
        return (searchData.results || []).map((m) => mapMovie(m, true));
      } else {
        let tvUrl = addFilters(tvBase, true);
        if (filterYear.length === 1) tvUrl += `&first_air_date_year=${filterYear[0]}`;
        const tvRes = await fetch(tvUrl);
        const tvData: TMDbResponse = await tvRes.json();
        return (tvData.results || []).map((m) => mapMovie(m, true));
      }
    }

    if (searchType === "actor") {
      if (!actorSearch.trim()) {
        const movieUrl = addFilters(movieBase, false);
        const res = await fetch(movieUrl);
        const data: TMDbResponse = await res.json();
        return (data.results || []).map((m) => mapMovie(m, false));
      }

      const personRes = await fetch(
        `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(actorSearch)}&language=en-US&page=1`
      );
      const personData = await personRes.json();
      const personId = personData.results?.[0]?.id;
      if (!personId) return [];

      const [movieCredRes, tvCredRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${apiKey}&language=en-US`),
        fetch(`https://api.themoviedb.org/3/person/${personId}/tv_credits?api_key=${apiKey}&language=en-US`),
      ]);
      const movieCredData = await movieCredRes.json();
      const tvCredData = await tvCredRes.json();

      let movieResults: TMDbMovie[] = (movieCredData.cast || []).slice(0, 50);
      let tvResults: TMDbMovie[] = (tvCredData.cast || []).slice(0, 50);

      if (filterStars === "6+") {
        movieResults = movieResults.filter((m) => m.vote_average >= 6);
        tvResults = tvResults.filter((m) => m.vote_average >= 6);
      } else if (filterStars === "5-") {
        movieResults = movieResults.filter((m) => m.vote_average <= 5);
        tvResults = tvResults.filter((m) => m.vote_average <= 5);
      }
      if (filterGenre) {
        movieResults = movieResults.filter((m) => m.genre_ids?.includes(parseInt(filterGenre)));
        tvResults = tvResults.filter((m) => m.genre_ids?.includes(parseInt(filterGenre)));
      }

      return [
        ...movieResults.map((m) => mapMovie(m, false)),
        ...tvResults.map((m) => mapMovie(m, true)),
      ];
    }

    if (
      query.trim() &&
      !filterGenre && filterYear.length === 0 && !filterStream &&
      filterRatings.length === 0 && !filterStars
    ) {
      const searchRes = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=${page}&include_adult=false`
      );
      const searchData: TMDbResponse = await searchRes.json();
      return (searchData.results || []).map((m) => mapMovie(m, false));
    }

    if (filterYear.length > 1) {
      const moviePromises = filterYear.map((year) =>
        fetch(addFilters(`${movieBase}&primary_release_year=${year}`, false)).then((r) => r.json())
      );
      const moviePages = await Promise.all(moviePromises);
      return (moviePages as TMDbResponse[]).flatMap((d) =>
        (d.results || []).map((m) => mapMovie(m, false))
      );
    }

    let movieUrl = addFilters(movieBase, false);
    if (filterYear.length === 1) {
      movieUrl += `&primary_release_year=${filterYear[0]}`;
    }
    const res = await fetch(movieUrl);
    const data: TMDbResponse = await res.json();
    return (data.results || []).map((m) => mapMovie(m, false));
  }

  function saveApiKey(key: string) {
    localStorage.setItem("tmdb_api_key", key);
    setApiKey(key);
  }

  function clearFilters() {
    setFilterGenre(""); setFilterYear([]); setFilterStream("");
    setFilterRatings([]); setFilterStars("");
  }

  function closeDetail() {
    setSelectedMovie(null); setMovieDetail(null);
    setWatchProviders({ flatrate: [], rent: [], buy: [] });
    router.push("/");
  }

  function goHome() {
    setSelectedMovie(null); setMovieDetail(null);
    setWatchProviders({ flatrate: [], rent: [], buy: [] });
    setSimilarMovies([]); setMovieCredits([]);
    setMovies([]); setQuery(""); setActorSearch(""); setTvQuery("");
    setSearchType("movie");
    clearFilters(); setCurrentPage(1); setHasMore(false);
    router.push("/");
  }

  function searchActor(actorName: string) {
    setQuery(""); setTvQuery(""); setActorSearch(actorName);
    setSelectedMovie(null); setMovieDetail(null);
    setWatchProviders({ flatrate: [], rent: [], buy: [] });
    setSimilarMovies([]); setMovieCredits([]);
    setMovies([]); setCurrentPage(1); setHasMore(false);
    router.push("/");
    handleSearch(new Event("submit") as unknown as React.FormEvent, 1, "actor");
  }

  function applyFamilyChip(genreId: string) {
    setFilterGenre(filterGenre === genreId ? "" : genreId);
  }

  function applyMpaaChip(mpaaValue: string) {
    if (mpaaValue === "PG") {
      const isActive = filterRatings.length > 0 && filterRatings.every((r) => ["G", "PG"].includes(r));
      setFilterRatings(isActive ? [] : ["G", "PG"]);
    } else if (mpaaValue === "PG13+") {
      const isActive = filterRatings.length > 0 && filterRatings.every((r) => ["PG-13", "R", "NC-17"].includes(r));
      setFilterRatings(isActive ? [] : ["PG-13", "R", "NC-17"]);
    }
  }

  function pickRandom() {
    const pool = movies.length > 0 ? movies : featured;
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    router.push(`?movie=${pick.id}&type=${pick.mediaType}`);
  }

  async function searchByMood() {
    const vibe = MOOD_VIBES.find((v) => v.key === selectedVibe);
    if (!vibe || !apiKey) return;

    setLoading(true);
    setError("");
    setMovies([]);
    setCurrentPage(1);
    setSearchType("movie");

    // Low energy → sort by acclaim; high energy → sort by popularity/excitement
    const energyConfig = [
      { sort: "vote_average.desc", voteMin: 7.5 },
      { sort: "vote_average.desc", voteMin: 6.5 },
      { sort: "popularity.desc",   voteMin: 6.0 },
      { sort: "popularity.desc",   voteMin: 5.5 },
      { sort: "popularity.desc",   voteMin: 0   },
    ][energyLevel - 1];

    // At high energy, prefer the more action-oriented genre in the pair
    const genreId = energyLevel >= 4 ? vibe.genres[1] ?? vibe.genres[0] : vibe.genres[0];

    let url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&page=1`;
    url += `&sort_by=${energyConfig.sort}`;
    url += `&with_genres=${genreId}`;
    if (energyConfig.voteMin > 0) url += `&vote_average.gte=${energyConfig.voteMin}`;
    if ("yearCap" in vibe && energyLevel <= 2) url += `&primary_release_date.lte=${vibe.yearCap}-12-31`;
    url += `&vote_count.gte=50`;

    try {
      const res = await fetch(url);
      const data: TMDbResponse = await res.json();
      setMovies((data.results || []).map((m) => mapMovie(m, false)));
      setHasMore((data.page || 1) < (data.total_pages || 1));
    } catch {
      setError("Failed to fetch movies. Please try again.");
    } finally {
      setLoading(false);
    }
  }


  function toggleFavorite(movie: Movie) {
    const updated = favorites.some((f) => f.id === movie.id)
      ? favorites.filter((f) => f.id !== movie.id)
      : [...favorites, movie];
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  }

  function toggleWatchlist(movie: Movie) {
    const updated = watchlist.some((f) => f.id === movie.id)
      ? watchlist.filter((f) => f.id !== movie.id)
      : [...watchlist, movie];
    setWatchlist(updated);
    localStorage.setItem("watchlist", JSON.stringify(updated));
  }

  function getRottenTomatoesUrl(): string {
    if (!selectedMovie) return "https://www.rottentomatoes.com";
    return `https://www.rottentomatoes.com/search?search=${encodeURIComponent(selectedMovie.title)}`;
  }

  function scrollCarousel(dir: "left" | "right") {
    carouselRef.current?.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });
  }

  if (detailLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-yellow-400 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (selectedMovie && movieDetail) {
    const hasProviders =
      watchProviders.flatrate.length > 0 || watchProviders.rent.length > 0 || watchProviders.buy.length > 0;
    const inWatchlist = watchlist.some((f) => f.id === selectedMovie.id);
    const isFav = favorites.some((f) => f.id === selectedMovie.id);

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 py-4 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button onClick={closeDetail} className="text-yellow-400 hover:text-yellow-300">← Back</button>
            <button onClick={goHome} className="text-yellow-400 hover:text-yellow-300 font-semibold text-xl">Couch Commander</button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3">
              {selectedMovie.poster ? (
                <Image src={selectedMovie.poster} alt={selectedMovie.title} className="w-full rounded-lg" width={500} height={750} unoptimized />
              ) : (
                <div className="w-full h-80 bg-gray-700 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">No Poster</span>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => toggleFavorite(selectedMovie)}
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm ${isFav ? "bg-yellow-500 text-gray-900" : "bg-gray-700 hover:bg-gray-600 text-white"}`}
                >
                  {isFav ? "❤️ Favorited" : "🤍 Favorite"}
                </button>
                <button
                  onClick={() => toggleWatchlist(selectedMovie)}
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm ${inWatchlist ? "bg-blue-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"}`}
                >
                  {inWatchlist ? "✅ Watchlist" : "➕ Watchlist"}
                </button>
              </div>
              <a
                href={getRottenTomatoesUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-center py-2 bg-red-600 hover:bg-red-500 rounded-lg font-semibold text-sm"
              >
                View on Rotten Tomatoes
              </a>
            </div>

            <div className="md:w-2/3">
              <h1 className="text-3xl font-bold mb-2">{selectedMovie.title}</h1>
              <div className="flex items-center gap-4 text-gray-400 mb-4 flex-wrap">
                <span>{selectedMovie.year}</span>
                {movieDetail.runtime && movieDetail.runtime > 0 && <span>{movieDetail.runtime} min</span>}
                {selectedMovie.mediaType === "movie" && (() => {
                  const cert = movieDetail.release_dates?.results
                    ?.find((r) => r.iso_3166_1 === "US")
                    ?.release_dates.find((rd) => rd.certification)?.certification;
                  return cert ? <span className="border border-gray-500 px-1.5 py-0.5 text-xs rounded text-gray-300">{cert}</span> : null;
                })()}
                {selectedMovie.imdb_rating && <span className="text-yellow-400">★ {selectedMovie.imdb_rating}/10</span>}
              </div>
              {movieDetail.tagline && (
                <p className="text-lg text-gray-300 italic mb-4">&ldquo;{movieDetail.tagline}&rdquo;</p>
              )}
              <p className="text-gray-300 mb-6">{selectedMovie.plot}</p>

              <div className="mb-4">
                <h3 className="font-semibold text-yellow-400 mb-2">Genres</h3>
                <p className="text-gray-300">{selectedMovie.genre}</p>
              </div>

              {movieCredits.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-yellow-400 mb-2">Main Cast</h3>
                  <ul className="text-gray-300 space-y-1">
                    {movieCredits.map((credit, idx) => (
                      <li key={idx}>
                        <button onClick={() => searchActor(credit.name)} className="text-white hover:text-yellow-400 underline">
                          {credit.name}
                        </button>
                        {credit.character && <span className="text-gray-400"> as {credit.character}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {hasProviders && (
                <div className="mb-6">
                  <h3 className="font-semibold text-yellow-400 mb-2">Where to Watch (US)</h3>
                  {watchProviders.flatrate.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Stream</p>
                      <div className="flex flex-wrap gap-2">
                        {watchProviders.flatrate.map((p) => (
                          <span key={p.provider_id} className="bg-gray-700 px-3 py-1 rounded-full text-sm">{p.provider_name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {watchProviders.rent.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Rent</p>
                      <div className="flex flex-wrap gap-2">
                        {watchProviders.rent.map((p) => (
                          <span key={p.provider_id} className="bg-gray-700 px-3 py-1 rounded-full text-sm">{p.provider_name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {watchProviders.buy.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Buy</p>
                      <div className="flex flex-wrap gap-2">
                        {watchProviders.buy.map((p) => (
                          <span key={p.provider_id} className="bg-gray-700 px-3 py-1 rounded-full text-sm">{p.provider_name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {similarMovies.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-yellow-400 mb-4">You Might Also Like</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {similarMovies.map((movie) => (
                      <div key={movie.id} onClick={() => router.push(`?movie=${movie.id}&type=${movie.mediaType}`)} className="cursor-pointer hover:opacity-80">
                        {movie.poster ? (
                          <Image src={movie.poster} alt={movie.title} className="w-full rounded" width={200} height={300} unoptimized />
                        ) : (
                          <div className="w-full h-24 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-500">No Poster</div>
                        )}
                        <p className="text-xs mt-1 truncate">{movie.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const showFeatured = movies.length === 0 && !loading;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 onClick={goHome} className="text-4xl font-bold mb-4 text-center text-yellow-400 cursor-pointer hover:text-yellow-300">
            Couch Commander
          </h1>

          {!apiKey && (
            <div className="max-w-md mx-auto mb-4 p-4 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">Enter your TMDB API key:</p>
              <div className="flex gap-2">
                <input type="password" id="apiKeyInput" placeholder="API Key"
                  className="flex-1 px-3 py-2 rounded bg-gray-600 border border-gray-500 text-white text-sm" />
                <button
                  onClick={() => {
                    const key = (document.getElementById("apiKeyInput") as HTMLInputElement).value;
                    if (key.trim()) saveApiKey(key.trim());
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 text-sm"
                >
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Get free key at themoviedb.org</p>
            </div>
          )}

          <div className="max-w-2xl mx-auto mb-3 flex items-center gap-2 px-1">
            <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">Stream on:</span>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              <button
                onClick={() => setFilterStream("")}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${filterStream === "" ? "bg-yellow-500 text-gray-900 border-yellow-500" : "border-gray-600 text-gray-300 hover:border-gray-400"}`}
              >
                Any
              </button>
              {STREAM_PROVIDERS.map((p) => (
                <button
                  key={p.provider_id}
                  onClick={() => setFilterStream(filterStream === String(p.provider_id) ? "" : String(p.provider_id))}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${filterStream === String(p.provider_id) ? "bg-yellow-500 text-gray-900 border-yellow-500" : "border-gray-600 text-gray-300 hover:border-gray-400"}`}
                >
                  {p.provider_name}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-2xl mx-auto mb-3 flex items-center gap-2 px-1">
            <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">Quick:</span>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              <button
                onClick={() => applyMpaaChip("PG")}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${filterRatings.length > 0 && filterRatings.every((r) => ["G", "PG"].includes(r)) ? "bg-yellow-500 text-gray-900 border-yellow-500" : "border-gray-600 text-gray-300 hover:border-gray-400"}`}
              >
                🎬 Family
              </button>
              <button
                onClick={() => applyMpaaChip("PG13+")}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${filterRatings.length > 0 && filterRatings.every((r) => ["PG-13", "R", "NC-17"].includes(r)) ? "bg-yellow-500 text-gray-900 border-yellow-500" : "border-gray-600 text-gray-300 hover:border-gray-400"}`}
              >
                🔞 Adult
              </button>
              {FAMILY_CHIPS.map((chip) => (
                <button
                  key={chip.genreId}
                  onClick={() => applyFamilyChip(chip.genreId)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${filterGenre === chip.genreId ? "bg-yellow-500 text-gray-900 border-yellow-500" : "border-gray-600 text-gray-300 hover:border-gray-400"}`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-2xl mx-auto mb-3 flex justify-center gap-2">
            <button
              onClick={() => setShowMoodTool(!showMoodTool)}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${showMoodTool ? "bg-purple-600 text-white border-purple-600" : "border-gray-600 text-gray-300 hover:border-purple-500 hover:text-purple-400"}`}
            >
              🎭 Mood &amp; Vibe Discovery {showMoodTool ? "▲" : "▼"}
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${showFilters ? "bg-yellow-500 text-gray-900 border-yellow-500" : "border-gray-600 text-gray-300 hover:border-yellow-500 hover:text-yellow-400"}`}
            >
              🎛️ Adv Filter {showFilters ? "▲" : "▼"}
            </button>
          </div>

          <form onSubmit={(e) => handleSearch(e, 1)} className="max-w-xl mx-auto">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); if (e.target.value) setActorSearch(""); }}
                placeholder="Search movies..."
                className="flex-1 min-w-0 px-3 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 text-sm"
              />
              <button
                type="submit"
                disabled={loading || !apiKey}
                className="w-20 shrink-0 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50 text-sm"
              >
                {loading ? "…" : "Movie"}
              </button>
            </div>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={actorSearch}
                onChange={(e) => { setActorSearch(e.target.value); if (e.target.value) setQuery(""); }}
                placeholder="Search actors..."
                className="flex-1 min-w-0 px-3 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 text-sm"
              />
              <button
                type="button"
                onClick={(e) => handleSearch(e as unknown as React.FormEvent, 1, "actor")}
                disabled={loading || !apiKey}
                className="w-20 shrink-0 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:opacity-50 text-sm"
              >
                Actor
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tvQuery}
                onChange={(e) => { setTvQuery(e.target.value); if (e.target.value) setQuery(""); setActorSearch(""); }}
                placeholder="Search TV shows..."
                className="flex-1 min-w-0 px-3 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 text-sm"
              />
              <button
                type="button"
                onClick={(e) => handleSearch(e as unknown as React.FormEvent, 1, "tv")}
                disabled={loading || !apiKey}
                className="w-20 shrink-0 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-500 disabled:opacity-50 text-sm"
              >
                TV
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Genre</label>
                    <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm">
                      <option value="">All Genres</option>
                      {TMDB_MOVIE_GENRES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Release Year <span className="text-xs">(Ctrl+click multi)</span></label>
                    <select multiple value={filterYear}
                      onChange={(e) => setFilterYear(Array.from(e.target.selectedOptions, (o) => o.value))}
                      className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm h-24">
                      {[2026,2025,2024,2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,
                        2011,2010,2009,2008,2007,2006,2005,2004,2003,2002,2001,2000,1999,1998,1997,
                        1996,1995,1994,1993,1992,1991,1990,1985,1980,1975,1970,1960].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Rating</label>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {(["G", "PG", "PG-13", "R", "NC-17"] as const).map((rating) => (
                        <label key={rating} className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={filterRatings.includes(rating)}
                            onChange={(e) =>
                              setFilterRatings(
                                e.target.checked
                                  ? [...filterRatings, rating]
                                  : filterRatings.filter((r) => r !== rating)
                              )
                            }
                            className="accent-yellow-400 w-4 h-4"
                          />
                          <span className="text-sm text-white">{rating}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button type="button" onClick={clearFilters}
                      className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm">
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="flex-1 min-w-0">
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">{error}</div>
            )}

            {showMoodTool && (
              <section className="mb-10 bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                {/* Header row */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Mood &amp; Vibe Discovery</h2>
                    <p className="text-sm text-gray-400 mt-1">Find movies that match how you feel right now</p>
                  </div>
                  <button
                    onClick={() => setShowMoodTool(false)}
                    className="text-gray-500 hover:text-white text-xl leading-none ml-4 shrink-0"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Vibe selector */}
                <div className="mb-6">
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">I want to feel…</p>
                  <div className="flex flex-wrap gap-2">
                    {MOOD_VIBES.map((vibe) => (
                      <button
                        key={vibe.key}
                        onClick={() => setSelectedVibe(selectedVibe === vibe.key ? null : vibe.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                          selectedVibe === vibe.key
                            ? vibe.activeClasses
                            : "border-gray-600 bg-gray-700/40 text-gray-300 hover:border-gray-500 hover:text-white"
                        }`}
                      >
                        <span className="mr-1.5">{vibe.emoji}</span>{vibe.label}
                      </button>
                    ))}
                  </div>
                  {selectedVibe && (
                    <p className="text-xs text-gray-500 italic mt-2 pl-1">
                      {MOOD_VIBES.find((v) => v.key === selectedVibe)?.tagline}
                    </p>
                  )}
                </div>

                {/* Energy slider */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Energy Level</p>
                    <span className="text-sm font-semibold text-yellow-400">
                      {ENERGY_LABELS[energyLevel - 1].label}
                      <span className="text-gray-500 font-normal ml-1">— {ENERGY_LABELS[energyLevel - 1].sub}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">😴</span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={energyLevel}
                      onChange={(e) => setEnergyLevel(Number(e.target.value))}
                      className="flex-1 accent-yellow-400 cursor-pointer"
                    />
                    <span className="text-xl">😤</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1 px-8">
                    <span>Low-key background</span>
                    <span>Edge-of-seat intense</span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={searchByMood}
                  disabled={!selectedVibe || loading || !apiKey}
                  className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-xl disabled:opacity-40 transition-colors text-sm"
                >
                  {loading
                    ? "Finding movies…"
                    : selectedVibe
                    ? `Find ${MOOD_VIBES.find((v) => v.key === selectedVibe)?.label} Movies`
                    : "Select a vibe above"}
                </button>
              </section>
            )}

            {movies.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                  <h2 className="text-2xl font-semibold text-yellow-400">Results ({movies.length})</h2>
                  <div className="flex items-center gap-3">
                    <button onClick={pickRandom}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg">
                      🎲 Random
                    </button>
                    <select value={sortBy}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSortBy(val);
                        setMovies((prev) => [...prev].sort((a, b) => {
                          if (val === "vote_average") return parseFloat(b.imdb_rating || "0") - parseFloat(a.imdb_rating || "0");
                          if (val === "title") return a.title.localeCompare(b.title);
                          if (val === "release_date") return (b.year || "").localeCompare(a.year || "");
                          return 0;
                        }));
                      }}
                      className="px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm">
                      <option value="popularity">Popularity</option>
                      <option value="vote_average">Rating</option>
                      <option value="release_date">Newest</option>
                      <option value="title">Title A–Z</option>
                    </select>
                  </div>
                </div>
                {searchType === "actor" && movies.some(m => m.mediaType === "tv") ? (
                  <div>
                    {movies.filter(m => m.mediaType === "movie").length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold text-yellow-400 mb-4">Movies</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {movies.filter(m => m.mediaType === "movie").map((movie) => (
                            <MovieCard
                              key={`${movie.mediaType}-${movie.id}`}
                              movie={movie}
                              onClick={() => router.push(`?movie=${movie.id}&type=${movie.mediaType}`)}
                              onFavorite={() => toggleFavorite(movie)}
                              onWatchlist={() => toggleWatchlist(movie)}
                              isFavorite={favorites.some((f) => f.id === movie.id)}
                              inWatchlist={watchlist.some((f) => f.id === movie.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {movies.filter(m => m.mediaType === "tv").length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold text-purple-400 mb-4">TV Shows</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {movies.filter(m => m.mediaType === "tv").map((movie) => (
                            <MovieCard
                              key={`${movie.mediaType}-${movie.id}`}
                              movie={movie}
                              onClick={() => router.push(`?movie=${movie.id}&type=${movie.mediaType}`)}
                              onFavorite={() => toggleFavorite(movie)}
                              onWatchlist={() => toggleWatchlist(movie)}
                              isFavorite={favorites.some((f) => f.id === movie.id)}
                              inWatchlist={watchlist.some((f) => f.id === movie.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {movies.map((movie) => (
                      <MovieCard
                        key={`${movie.mediaType}-${movie.id}`}
                        movie={movie}
                        onClick={() => router.push(`?movie=${movie.id}&type=${movie.mediaType}`)}
                        onFavorite={() => toggleFavorite(movie)}
                        onWatchlist={() => toggleWatchlist(movie)}
                        isFavorite={favorites.some((f) => f.id === movie.id)}
                        inWatchlist={watchlist.some((f) => f.id === movie.id)}
                      />
                    ))}
                  </div>
                )}
                {hasMore && (
                  <div className="mt-8 text-center">
                    <button onClick={() => handleSearch(new Event("submit") as unknown as React.FormEvent, currentPage + 1, searchType)}
                      disabled={loading}
                      className="px-8 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50">
                      {loading ? "Loading..." : "Load More"}
                    </button>
                  </div>
                )}
              </section>
            )}

            {showFeatured && featured.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-yellow-400">Popular Now</h2>
                  <button onClick={pickRandom}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg">
                    🎲 Surprise Me
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {featured.slice(0, 10).map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onClick={() => router.push(`?movie=${movie.id}&type=${movie.mediaType}`)}
                      onFavorite={() => toggleFavorite(movie)}
                      onWatchlist={() => toggleWatchlist(movie)}
                      isFavorite={favorites.some((f) => f.id === movie.id)}
                      inWatchlist={watchlist.some((f) => f.id === movie.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {showFeatured && popularActors.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">Popular Actors</h2>
                <div className="relative">
                  <button onClick={() => scrollCarousel("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg text-xl">
                    ‹
                  </button>
                  <div ref={carouselRef}
                    className="flex gap-4 overflow-x-auto px-10"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none", scrollBehavior: "smooth" }}>
                    {popularActors.map((actor) => (
                      <button key={actor.id} onClick={() => searchActor(actor.name)}
                        className="flex-shrink-0 w-24 text-center hover:opacity-80 transition-opacity">
                        {actor.profile_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                            alt={actor.name}
                            width={80} height={80}
                            className="w-20 h-20 rounded-full object-cover mx-auto mb-2 border-2 border-gray-700 hover:border-yellow-400 transition-colors"
                            unoptimized
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gray-700 mx-auto mb-2 flex items-center justify-center text-2xl">👤</div>
                        )}
                        <p className="text-xs text-gray-300 leading-tight line-clamp-2">{actor.name}</p>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => scrollCarousel("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg text-xl">
                    ›
                  </button>
                </div>
              </section>
            )}

            {showFeatured && recentlyViewed.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">Recently Viewed</h2>
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
                  {recentlyViewed.map((movie) => (
                    <div key={movie.id} onClick={() => router.push(`?movie=${movie.id}&type=${movie.mediaType}`)}
                      className="flex-shrink-0 w-28 cursor-pointer hover:opacity-80">
                      {movie.poster ? (
                        <Image src={movie.poster} alt={movie.title} width={112} height={168}
                          className="w-28 rounded object-cover" unoptimized />
                      ) : (
                        <div className="w-28 h-40 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-500">No Poster</div>
                      )}
                      <p className="text-xs mt-1 truncate text-gray-300">{movie.title}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {movies.length === 0 && featured.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-xl">{apiKey ? "Search for your favorite movies!" : "Enter your API key above to get started"}</p>
              </div>
            )}
          </div>

          <aside className="w-full md:w-52 shrink-0 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">
                📺 Watch Together{watchlist.length > 0 ? ` (${watchlist.length})` : ""}
              </h3>
              {watchlist.length > 0 ? (
                <ul className="space-y-2">
                  {watchlist.map((movie) => (
                    <li key={movie.id} className="flex items-center justify-between gap-1">
                      <button onClick={() => router.push(`?movie=${movie.id}&type=${movie.mediaType}`)}
                        className="text-left text-sm text-gray-300 hover:text-blue-400 truncate flex-1">
                        {movie.title}
                      </button>
                      <button onClick={() => toggleWatchlist(movie)} className="text-gray-500 hover:text-red-400 text-xs shrink-0">✕</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 italic">Tap ➕ on any title to build your Watch Together list.</p>
              )}
            </div>
            {favorites.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-3">Favorites ({favorites.length})</h3>
                <ul className="space-y-2">
                  {favorites.map((movie) => (
                    <li key={movie.id} className="flex items-center justify-between gap-1">
                      <button onClick={() => router.push(`?movie=${movie.id}&type=${movie.mediaType}`)}
                        className="text-left text-sm text-gray-300 hover:text-yellow-400 truncate flex-1">
                        {movie.title}
                      </button>
                      <button onClick={() => toggleFavorite(movie)} className="text-gray-500 hover:text-red-400 text-xs shrink-0">✕</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </main>

      <footer className="bg-gray-800 py-6 px-4 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>Powered by The Movie Database (TMDB)</p>
        </div>
      </footer>

    </div>
  );
}

function MovieCard({
  movie, onClick, onFavorite, onWatchlist, isFavorite, inWatchlist,
}: {
  movie: Movie;
  onClick: () => void;
  onFavorite?: () => void;
  onWatchlist?: () => void;
  isFavorite?: boolean;
  inWatchlist?: boolean;
}) {
  return (
    <div onClick={onClick}
      className="bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform cursor-pointer">
      {movie.poster ? (
        <Image src={movie.poster} alt={movie.title} className="w-full h-56 object-cover" width={500} height={750} unoptimized />
      ) : (
        <div className="w-full h-56 bg-gray-700 flex items-center justify-center">
          <span className="text-gray-500">No Poster</span>
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 className="font-semibold text-sm truncate flex-1">{movie.title}</h3>
          <div className="flex gap-1 shrink-0">
            {onFavorite && (
              <button onClick={(e) => { e.stopPropagation(); onFavorite(); }}
                className="text-base hover:scale-110 transition-transform"
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                {isFavorite ? "❤️" : "🤍"}
              </button>
            )}
            {onWatchlist && (
              <button onClick={(e) => { e.stopPropagation(); onWatchlist(); }}
                className="text-base hover:scale-110 transition-transform"
                title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}>
                {inWatchlist ? "✅" : "➕"}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1 flex-wrap">
          <span>{movie.year}</span>
          {movie.imdb_rating && <span className="text-yellow-400">★ {movie.imdb_rating}</span>}
          {movie.mediaType === "tv" && (
            <span className="bg-blue-800 text-blue-200 px-1 rounded text-xs">TV</span>
          )}
        </div>
        {movie.genre && <p className="text-xs text-gray-400 line-clamp-1 mb-1">{movie.genre}</p>}
        {movie.plot && <p className="text-xs text-gray-300 line-clamp-3 italic">{movie.plot}</p>}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900" />}>
      <HomeContent />
    </Suspense>
  );
}