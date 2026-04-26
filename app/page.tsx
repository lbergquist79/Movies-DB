"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

const TMDB_GENRES = [
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
}

interface TMDbDetail {
  id: number;
  title: string;
  release_date: string;
  poster_path: string;
  overview: string;
  genres: { id: number; name: string }[];
  vote_average: number;
  runtime: number;
  status: string;
  tagline: string;
}

interface TMDbWatchProviders {
  id: number;
  results: {
    [country: string]: {
      link: string;
      flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
      rent?: { provider_id: number; provider_name: string; logo_path: string }[];
      buy?: { provider_id: number; provider_name: string; logo_path: string }[];
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

interface TMDbPopularResponse {
  page: number;
  total_pages: number;
  total_results: number;
  results: TMDbPopularPerson[];
}

interface TMDbResponse {
  results: TMDbMovie[];
  total_results?: number;
}

interface Movie {
  id: number;
  title: string;
  year: string;
  poster: string;
  plot: string;
  genre: string;
  imdb_rating: string;
}

const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const IMAGE_LARGE = "https://image.tmdb.org/t/p/original";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";

function mapMovie(movie: TMDbMovie): Movie {
  return {
    id: movie.id,
    title: movie.title || movie.name || "",
    year: movie.release_date ? movie.release_date.split("-")[0] : "",
    poster: movie.poster_path ? `${IMAGE_BASE}${movie.poster_path}` : "",
    plot: movie.overview || "",
    genre: movie.genre_ids
      .slice(0, 3)
      .map((id) => GENRE_MAP[id] || "")
      .filter(Boolean)
      .join(", "),
    imdb_rating: movie.vote_average ? movie.vote_average.toFixed(1) : "",
  };
}

const STREAM_PROVIDERS = [
  { provider_id: 8, provider_name: "Netflix" },
  { provider_id: 9, provider_name: "Amazon Prime Video" },
  { provider_id: 15, provider_name: "Hulu" },
  { provider_id: 384, provider_name: "Max" },
  { provider_id: 337, provider_name: "Disney+" },
  { provider_id: 531, provider_name: "Paramount+" },
  { provider_id: 386, provider_name: "Peacock" },
  { provider_id: 2, provider_name: "Apple TV+" },
  { provider_id: 43, provider_name: "Starz" },
  { provider_id: 80, provider_name: "AMC+" },
];

function HomeContent() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [featured, setFeatured] = useState<Movie[]>([]);
  const [apiKey, setApiKey] = useState<string>(API_KEY);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [movieDetail, setMovieDetail] = useState<TMDbDetail | null>(null);
  const [watchProviders, setWatchProviders] = useState<TMDbProvider[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterGenre, setFilterGenre] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string[]>([]);
  const [filterStream, setFilterStream] = useState<string>("");
  const [filterTvShow, setFilterTvShow] = useState(false);
  const [filterRating, setFilterRating] = useState<string>("");
  const [filterStars, setFilterStars] = useState<string>("");
  const [actorSearch, setActorSearch] = useState<string>("");
  const [streamProviders] = useState<{ provider_id: number; provider_name: string }[]>(STREAM_PROVIDERS);
  const [popularActors, setPopularActors] = useState<TMDbPopularPerson[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [sortBy, setSortBy] = useState<string>("stars");
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [movieCredits, setMovieCredits] = useState<{ name: string; character: string }[]>([]);
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();

  const movieId = searchParams.get("movie");

  useEffect(() => {
    if (API_KEY) {
      fetchFeaturedMovies();
      fetchPopularActors();
    } else {
      const stored = localStorage.getItem("tmdb_api_key");
      if (stored) setApiKey(stored);
    }
    const storedFavorites = localStorage.getItem("favorites");
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (query && apiKey && !selectedMovie) {
      handleSearch(new Event('submit') as unknown as React.FormEvent, 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, apiKey]);

  useEffect(() => {
    if (actorSearch && apiKey && !selectedMovie) {
      handleSearch(new Event('submit') as unknown as React.FormEvent, 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actorSearch, apiKey]);

  useEffect(() => {
    if (movieId && apiKey) {
      fetchMovieDetail(parseInt(movieId));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, apiKey]);

  const fetchMovieDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    setWatchProviders([]);
    setSimilarMovies([]);
    setMovieCredits([]);
    try {
      const [detailRes, providersRes, similarRes, creditsRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US`),
        fetch(`https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${apiKey}`),
        fetch(`https://api.themoviedb.org/3/movie/${id}/similar?api_key=${apiKey}&language=en-US&page=1`),
        fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${apiKey}&language=en-US`),
      ]);
      const detailData: TMDbDetail = await detailRes.json();
      const providersData: TMDbWatchProviders = await providersRes.json();
      const similarData: TMDbResponse = await similarRes.json();
      const creditsData = await creditsRes.json();

      if (creditsData.cast) {
        const topCast = creditsData.cast.slice(0, 5).map((c: { name: string; character: string }) => ({
          name: c.name,
          character: c.character
        }));
        setMovieCredits(topCast);
      }

      const mainGenre = detailData.genres?.[0]?.id;
      const mainActor = creditsData.cast?.[0]?.id;
      const movieTitle = detailData.title?.toLowerCase() || "";

      setMovieDetail(detailData);
      setSelectedMovie({
        id: detailData.id,
        title: detailData.title,
        year: detailData.release_date ? detailData.release_date.split("-")[0] : "",
        poster: detailData.poster_path ? `${IMAGE_LARGE}${detailData.poster_path}` : "",
        plot: detailData.overview || "",
        genre: detailData.genres?.map((g) => g.name).join(", ") || "",
        imdb_rating: detailData.vote_average ? detailData.vote_average.toFixed(1) : "",
      });

      const usProviders = providersData.results?.US;
      if (usProviders?.flatrate) {
        setWatchProviders(usProviders.flatrate);
      }

      const sequels: TMDbMovie[] = [];
      const sameGenreActor: TMDbMovie[] = [];
      
      const titleWords = movieTitle.split(" ").filter(w => w.length > 2 && !["the", "and", "with", "from"].includes(w));
      
      if (titleWords.length > 0) {
        try {
          const searchRes = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(titleWords[0])}&language=en-US&page=1`
          );
          const searchData: TMDbResponse = await searchRes.json();
          if (searchData.results) {
            for (const m of searchData.results) {
              if (m.id === id) continue;
              const mTitle = (m.title || "").toLowerCase();
              if (titleWords.some(w => mTitle.includes(w) && w.length > 3)) {
                sequels.push(m);
              }
            }
          }
        } catch (e) {
          console.error("Failed to search for sequels", e);
        }
      }

      if (similarData.results) {
        for (const m of similarData.results) {
          if (!sequels.find(s => s.id === m.id) && mainGenre && m.genre_ids?.includes(mainGenre)) {
            sameGenreActor.push(m);
          }
        }
      }

      if (mainGenre && sameGenreActor.length < 6 && mainActor) {
        try {
          const genreActorRes = await fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&with_genres=${mainGenre}&with_cast=${mainActor}&page=1&exclude_ids=${id}`
          );
          const genreActorData: TMDbResponse = await genreActorRes.json();
          if (genreActorData.results) {
            for (const m of genreActorData.results) {
              if (!sameGenreActor.find(s => s.id === m.id) && sequels.length + sameGenreActor.length < 6) {
                sameGenreActor.push(m);
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch genre/actor movies", e);
        }
      }

      const combined = [...sequels.slice(0, 3), ...sameGenreActor.slice(0, 3)].slice(0, 6);
      setSimilarMovies(combined.map(mapMovie));
    } catch (e) {
      console.error("Failed to fetch movie detail", e);
    } finally {
      setDetailLoading(false);
    }
  }, [apiKey]);

  async function fetchPopularMovies(): Promise<TMDbMovie[]> {
    if (!apiKey) return [];
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`
    );
    const data: TMDbResponse = await res.json();
    return data.results || [];
  }

  interface SearchResult {
  results: TMDbMovie[];
  total: number;
}

async function searchWithFilters(page: number = 1): Promise<SearchResult> {
  if (!apiKey) return { results: [], total: 0 };
  
  const isTv = filterTvShow;
  let movieUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&page=${page}`;
  let tvUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&page=${page}`;

    if (filterYear.length > 0) {
      if (filterYear.length === 1) {
        movieUrl += `&primary_release_year=${filterYear[0]}`;
        tvUrl += `&first_air_date_year=${filterYear[0]}`;
      }
    }
    
    if (filterGenre) {
      movieUrl += `&with_genres=${filterGenre}`;
      tvUrl += `&with_genres=${filterGenre}`;
    }
    if (filterStream) {
      movieUrl += `&with_watch_providers=${filterStream}&watch_region=US`;
      tvUrl += `&with_watch_providers=${filterStream}&watch_region=US`;
    }
    if (filterRating) {
      movieUrl += `&certification_country=US&certification=${filterRating}`;
    }
    if (filterStars) {
      movieUrl += `&vote_average.gte=${filterStars}`;
      tvUrl += `&vote_average.gte=${filterStars}`;
    }

    let movieResults: TMDbMovie[] = [];
    let tvResults: TMDbMovie[] = [];

    if (actorSearch.trim()) {
      const personRes = await fetch(
        `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(actorSearch)}&language=en-US&page=1`
      );
      const personData = await personRes.json();
      const personId = personData.results?.[0]?.id;
      
      if (personId) {
        if (filterStream) {
          const filteredRes = await fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&with_cast=${personId}&with_watch_providers=${filterStream}&watch_region=US&page=1`
          );
          const filteredData: TMDbResponse = await filteredRes.json();
          movieResults = filteredData.results || [];
        } else {
          const creditsRes = await fetch(
            `https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${apiKey}&language=en-US`
          );
          const creditsData = await creditsRes.json();
          if (creditsData.cast) {
            movieResults = creditsData.cast.slice(0, 50).map((c: TMDbMovie) => ({
              ...c,
              title: c.title || c.original_title || "",
              release_date: c.release_date || c.first_air_date || "",
            }));
          }
          if (isTv) {
            const tvCreditsRes = await fetch(
              `https://api.themoviedb.org/3/person/${personId}/tv_credits?api_key=${apiKey}&language=en-US`
            );
            const tvCreditsData = await tvCreditsRes.json();
            if (tvCreditsData.cast) {
              const castTv = tvCreditsData.cast.slice(0, 50).map((c: TMDbMovie) => ({
                ...c,
                title: c.name || c.original_name || "",
                release_date: c.first_air_date || c.release_date || "",
              }));
              tvResults = castTv;
            }
          }
        }
      }
    } else if (query.trim() && !filterGenre && filterYear.length === 0 && !filterStream && !filterRating && !filterStars) {
      const searchRes = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=${page}&include_adult=false`
      );
      const searchData: TMDbResponse = await searchRes.json();
      movieResults = searchData.results || [];
      
      if (isTv) {
        const searchTvRes = await fetch(
          `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=${page}&include_adult=false`
        );
        const searchTvData: TMDbResponse = await searchTvRes.json();
        tvResults = searchTvData.results || [];
      }
    } else if (filterYear.length > 1) {
      const allMoviePromises = filterYear.map(year => 
        fetch(`${movieUrl}&primary_release_year=${year}`)
      );
      const allTvPromises = filterYear.map(year =>
        fetch(`${tvUrl}&first_air_date_year=${year}`)
      );
      
      const [movieResponses, tvResponses] = await Promise.all([
        Promise.all(allMoviePromises),
        isTv ? Promise.all(allTvPromises) : Promise.resolve([])
      ]);
      
      const allMovieData = await Promise.all(movieResponses.map((r: Response) => r.json()));
      movieResults = allMovieData.flatMap((d: TMDbResponse) => d.results || []);
      
      if (isTv) {
        const allTvData = await Promise.all(tvResponses.map((r: Response) => r.json()));
        tvResults = allTvData.flatMap((d: TMDbResponse) => d.results || []);
      }
    } else if (isTv) {
      const [movieRes, tvRes] = await Promise.all([
        fetch(movieUrl),
        fetch(tvUrl),
      ]);
      const movieData: TMDbResponse = await movieRes.json();
      const tvData: TMDbResponse = await tvRes.json();
      movieResults = movieData.results || [];
      tvResults = tvData.results || [];
    } else {
      const res = await fetch(movieUrl);
      const data: TMDbResponse = await res.json();
      movieResults = data.results || [];
    }

    const allResults = isTv ? [...movieResults, ...tvResults] : movieResults;
    
    return { results: allResults, total: allResults.length };
  }

  async function fetchFeaturedMovies() {
    if (!apiKey) return;
    try {
      const results = await fetchPopularMovies();
      const mapped = results.map(mapMovie);
      setFeatured(mapped);
    } catch (e) {
      console.error("Failed to fetch featured movies", e);
    }
  }

  async function fetchPopularActors() {
    if (!apiKey) return;
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/person/popular?api_key=${apiKey}&language=en-US&page=1`
      );
      const data: TMDbPopularResponse = await res.json();
      if (data.results) {
        setPopularActors(data.results.slice(0, 50));
      }
    } catch (e) {
      console.error("Failed to fetch popular actors", e);
    }
  }

  async function handleSearch(e: React.FormEvent, newPage: number = 1) {
    e.preventDefault();

    if (!apiKey) {
      setError("Please enter your TMDB API key first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { results, total } = await searchWithFilters(newPage);
      let mapped = results.map(mapMovie);
      
      if (sortBy === "stars") {
        mapped = mapped.sort((a, b) => parseFloat(b.imdb_rating || "0") - parseFloat(a.imdb_rating || "0"));
      } else if (sortBy === "title") {
        mapped = mapped.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === "year") {
        mapped = mapped.sort((a, b) => (b.year || "").localeCompare(a.year || ""));
      }
      
      if (newPage === 1) {
        setMovies(mapped);
      } else {
        setMovies(prev => [...prev, ...mapped]);
      }
      
      let finalTotal = total;
      if (filterYear.length > 1) {
        const totalFromMultipleYears = filterYear.length * 20;
        finalTotal = total > 0 ? Math.max(total, newPage * 20) : totalFromMultipleYears;
        if (mapped.length >= 20 && newPage < filterYear.length) {
          finalTotal = filterYear.length * 20;
        } else if (mapped.length < 20) {
          finalTotal = (newPage - 1) * 20 + mapped.length;
        }
      }
      
      setTotalResults(finalTotal);
      setCurrentPage(newPage);
      
      if (mapped.length === 0) {
        setError("No movies found. Try different filters.");
      }
    } catch (e) {
      setError("Failed to search movies. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function loadMore() {
    handleSearch(new Event('submit') as unknown as React.FormEvent, currentPage + 1);
  }

  function saveApiKey(key: string) {
    localStorage.setItem("tmdb_api_key", key);
    setApiKey(key);
  }

  function closeDetail() {
    setSelectedMovie(null);
    setMovieDetail(null);
    setWatchProviders([]);
    router.push("/");
  }

  function goHome() {
    setSelectedMovie(null);
    setMovieDetail(null);
    setWatchProviders([]);
    setSimilarMovies([]);
    setMovieCredits([]);
    setMovies([]);
    setQuery("");
    setActorSearch("");
    setFilterGenre("");
    setFilterYear([]);
    setFilterStream("");
    setFilterTvShow(false);
    setFilterRating("");
    setFilterStars("");
    setCurrentPage(1);
    setTotalResults(0);
    setSortBy("stars");
    router.push("/");
  }

  function searchActor(actorName: string) {
    setQuery("");
    setActorSearch(actorName);
    setFilterGenre("");
    setFilterYear([]);
    setFilterStream("");
    setFilterTvShow(false);
    setFilterRating("");
    setFilterStars("");
    setSelectedMovie(null);
    setMovieDetail(null);
    setWatchProviders([]);
    setSimilarMovies([]);
    setMovieCredits([]);
    setMovies([]);
    setCurrentPage(1);
    setTotalResults(0);
    router.push("/");
  }

  function toggleFavorite(movie: Movie) {
    const isFav = favorites.some(f => f.id === movie.id);
    let newFavorites: Movie[];
    if (isFav) {
      newFavorites = favorites.filter(f => f.id !== movie.id);
    } else {
      newFavorites = [...favorites, movie].slice(-5);
    }
    setFavorites(newFavorites);
    localStorage.setItem("favorites", JSON.stringify(newFavorites));
  }

  function getRottenTomatoesUrl(): string {
    if (!selectedMovie) return "https://www.rottentomatoes.com";
    return `https://www.rottentomatoes.com/search?search=${encodeURIComponent(selectedMovie.title)}`;
  }

  if (selectedMovie && movieDetail) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 py-4 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button onClick={closeDetail} className="text-yellow-400 hover:text-yellow-300">
              &#8592; Back
            </button>
            <button onClick={goHome} className="text-yellow-400 hover:text-yellow-300 font-semibold text-xl">
              Movies-DB
            </button>
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
              <a href={getRottenTomatoesUrl()} target="_blank" rel="noopener noreferrer"
                className="block mt-4 text-center py-2 bg-red-600 hover:bg-red-500 rounded-lg font-semibold">
                View on Rotten Tomatoes
              </a>
            </div>
            <div className="md:w-2/3">
              <h1 className="text-3xl font-bold mb-2">{selectedMovie.title}</h1>
              <div className="flex items-center gap-4 text-gray-400 mb-4">
                <span>{selectedMovie.year}</span>
                {movieDetail.runtime && <span>{movieDetail.runtime} min</span>}
                {selectedMovie.imdb_rating && (
                  <span className="text-yellow-400">&#9733; {selectedMovie.imdb_rating}/10</span>
                )}
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
                  <h3 className="font-semibold text-yellow-400 mb-2">Main Actors</h3>
                  <ul className="text-gray-300">
                    {movieCredits.map((credit, idx) => (
                      <li key={idx}>
                        <button
                          onClick={() => searchActor(credit.name)}
                          className="text-white hover:text-yellow-400 underline"
                        >
                          {credit.name}
                        </button>
                        {credit.character && <span className="text-gray-400"> as {credit.character}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {watchProviders.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-yellow-400 mb-2">Streaming On</h3>
                  <div className="flex flex-wrap gap-2">
                    {watchProviders.map((provider) => (
                      <span key={provider.provider_id} className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                        {provider.provider_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {similarMovies.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-semibold text-yellow-400 mb-4">Similar Movies</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {similarMovies.map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => router.push(`?movie=${movie.id}`)}
                        className="cursor-pointer hover:opacity-80"
                      >
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <h1
            onClick={goHome}
            className="text-4xl font-bold mb-4 text-center text-yellow-400 cursor-pointer hover:text-yellow-300"
          >
            Movies-DB
          </h1>
          {!apiKey && (
            <div className="max-w-md mx-auto mb-4 p-4 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">Enter your TMDB API key:</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  id="apiKeyInput"
                  placeholder="API Key"
                  className="flex-1 px-3 py-2 rounded bg-gray-600 border border-gray-500 text-white text-sm"
                />
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
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies..."
                className="flex-1 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              />
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg"
              >
                Filters
              </button>
              <button
                type="submit"
                disabled={loading || !apiKey}
                className="px-6 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={actorSearch}
                onChange={(e) => setActorSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && actorSearch.trim() && apiKey) {
                    e.preventDefault();
                    setLoading(true);
                    setError("");
                  }
                }}
                placeholder="Search actors..."
                className="flex-1 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!actorSearch.trim()) return;
                  if (!apiKey) {
                    setError("Please enter your TMDB API key first.");
                    return;
                  }
                  setLoading(true);
                  setError("");
                  try {
                    const { results, total } = await searchWithFilters(1);
                    const mapped = results.map(mapMovie);
                    setMovies(mapped);
                    setTotalResults(total);
                    setCurrentPage(1);
                    if (mapped.length === 0) {
                      setError("No movies found. Try different filters.");
                    }
                  } catch (e) {
                    setError("Failed to search movies. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || !apiKey}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:opacity-50"
              >
                Actor Search
              </button>
            </div>
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Genre</label>
                    <select
                      value={filterGenre}
                      onChange={(e) => setFilterGenre(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm"
                    >
                      <option value="">All Genres</option>
                      {TMDB_GENRES.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterTvShow}
                        onChange={(e) => setFilterTvShow(e.target.checked)}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-yellow-500 focus:ring-yellow-500"
                      />
                      <span className="text-sm text-gray-300">TV Shows</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Release Year</label>
                    <select
                      multiple
                      value={filterYear}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                        setFilterYear(selected.length > 0 ? selected : []);
                      }}
                      className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm h-24"
                    >
                      <option value="">All Years</option>
                      {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005, 2004, 2003, 2002, 2001, 2000, 1999, 1998, 1997, 1996, 1995, 1994, 1993, 1992, 1991, 1990, 1989, 1988, 1987, 1986, 1985, 1984, 1983, 1982, 1981, 1980, 1979, 1978, 1977, 1976, 1975, 1974, 1973, 1972, 1971, 1970, 1969, 1968, 1967, 1966, 1965, 1964, 1963, 1962, 1961, 1960].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Stream</label>
                    <select
                      value={filterStream}
                      onChange={(e) => setFilterStream(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm"
                    >
                      <option value="">All Providers</option>
                      {streamProviders.map((p) => (
                        <option key={p.provider_id} value={p.provider_id}>{p.provider_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Stars</label>
                    <select
                      value={filterStars}
                      onChange={(e) => setFilterStars(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm"
                    >
                      <option value="">Any Rating</option>
                      <option value="9">9+ stars</option>
                      <option value="8">8+ stars</option>
                      <option value="7">7+ stars</option>
                      <option value="6">6+ stars</option>
                      <option value="5">5+ stars</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Movie Rating</label>
                    <select
                      value={filterRating}
                      onChange={(e) => setFilterRating(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm"
                    >
                      <option value="">All Ratings</option>
                      <option value="G">G</option>
                      <option value="PG">PG</option>
                      <option value="PG-13">PG-13</option>
                      <option value="R">R</option>
                      <option value="NC-17">NC-17</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => { setFilterGenre(""); setFilterYear([]); setFilterStream("");
    setFilterTvShow(false); setFilterRating(""); setFilterStars(""); setActorSearch(""); }}
                      className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                    >
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
        <div className="flex gap-8">
          <div className="flex-1">
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">{error}</div>
            )}

            {movies.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-yellow-400">
                    {filterYear.length > 0 ? `Results (${filterYear.join(", ")})` : "Search Results"} ({movies.length})
                  </h2>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      const newSort = e.target.value;
                      setSortBy(newSort);
                      const sorted = [...movies].sort((a, b) => {
                        if (newSort === "stars") return parseFloat(b.imdb_rating || "0") - parseFloat(a.imdb_rating || "0");
                        if (newSort === "title") return a.title.localeCompare(b.title);
                        if (newSort === "year") return (b.year || "").localeCompare(a.year || "");
                        return 0;
                      });
                      setMovies(sorted);
                    }}
                    className="px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm"
                  >
                    <option value="stars">Stars</option>
                    <option value="title">Title</option>
                    <option value="year">Release Year</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {movies.map((movie) => (
                    <MovieCard 
                      key={movie.id} 
                      movie={movie} 
                      onClick={() => router.push(`?movie=${movie.id}`)} 
                      onFavorite={() => toggleFavorite(movie)}
                      showFavorite={true}
                      isFavorite={favorites.some(f => f.id === movie.id)}
                    />
                  ))}
                </div>
                {movies.length >= 20 && movies.length < totalResults && (
                  <div className="mt-8 text-center">
                    <p className="text-gray-400 mb-4">Showing {movies.length} of {totalResults}</p>
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="px-8 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50"
                    >
                      {loading ? "Loading..." : "More"}
                    </button>
                  </div>
                )}
              </section>
            )}

            {featured.length > 0 && movies.length === 0 && !loading && (
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-yellow-400">Popular Movies</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {featured.slice(0, 10).map((movie) => (
                    <MovieCard 
                      key={movie.id} 
                      movie={movie} 
                      onClick={() => router.push(`?movie=${movie.id}`)} 
                      onFavorite={() => toggleFavorite(movie)}
                      showFavorite={true}
                      isFavorite={favorites.some(f => f.id === movie.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {movies.length === 0 && featured.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-xl">
                  {apiKey ? "Search for your favorite movies!" : "Enter your API key above to get started"}
                </p>
              </div>
            )}
          </div>

          {favorites.length > 0 && (
            <aside className="w-48 shrink-0">
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">Favorites</h3>
              <ul className="space-y-2">
                {favorites.map((movie) => (
                  <li key={movie.id} className="flex items-center justify-between gap-1">
                    <button
                      onClick={() => router.push(`?movie=${movie.id}`)}
                      className="text-left text-sm text-gray-300 hover:text-yellow-400 truncate flex-1"
                    >
                      {movie.title}
                    </button>
                    <button
                      onClick={() => toggleFavorite(movie)}
                      className="text-red-500 hover:text-red-400 text-xs"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          )}
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

function MovieCard({ movie, onClick, onFavorite, showFavorite, isFavorite }: { movie: Movie; onClick: () => void; onFavorite?: () => void; showFavorite?: boolean; isFavorite?: boolean }) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform cursor-pointer"
    >
      {movie.poster ? (
        <Image src={movie.poster} alt={movie.title} className="w-full h-56 object-cover" width={500} height={750} unoptimized />
      ) : (
        <div className="w-full h-56 bg-gray-700 flex items-center justify-center">
          <span className="text-gray-500">No Poster</span>
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-semibold text-sm mb-1 truncate flex-1">{movie.title}</h3>
          {showFavorite && onFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); onFavorite(); }}
              className="text-lg hover:scale-110 transition-transform"
            >
              {isFavorite ? "❤️" : "🤍"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <span>{movie.year}</span>
          {movie.imdb_rating && <span className="text-yellow-400">&#9733; {movie.imdb_rating}</span>}
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