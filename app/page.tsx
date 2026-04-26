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
  title: string;
  release_date: string;
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

interface TMDbWatchProvidersResponse {
  page: number;
  total_pages: number;
  total_results: number;
  results: { provider_id: number; provider_name: string; logo_path: string }[];
}

interface TMDbProvidersResponse {
  results: { [country: string]: { providers: TMDbProvider[] } };
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
    title: movie.title,
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
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterActor, setFilterActor] = useState<string>("");
  const [filterStream, setFilterStream] = useState<string>("");
  const [streamProviders, setStreamProviders] = useState<{ provider_id: number; provider_name: string; logo_path: string }[]>([]);
  const [popularActors, setPopularActors] = useState<TMDbPopularPerson[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();

  const movieId = searchParams.get("movie");

  useEffect(() => {
    if (API_KEY) {
      fetchFeaturedMovies();
      fetchStreamProviders();
      fetchPopularActors();
    } else {
      const stored = localStorage.getItem("tmdb_api_key");
      if (stored) setApiKey(stored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (movieId && apiKey) {
      fetchMovieDetail(parseInt(movieId));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, apiKey]);

  const fetchMovieDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    setWatchProviders([]);
    try {
      const [detailRes, providersRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US`),
        fetch(`https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${apiKey}`),
      ]);
      const detailData: TMDbDetail = await detailRes.json();
      const providersData: TMDbWatchProviders = await providersRes.json();

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
    let url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&page=${page}`;

    if (filterYear) {
      url += `&primary_release_year=${filterYear}`;
    }
    if (filterGenre) {
      url += `&with_genres=${filterGenre}`;
    }
    if (filterActor) {
      const personRes = await fetch(
        `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(filterActor)}&page=1`
      );
      const personData = await personRes.json();
      if (personData.results?.[0]?.id) {
        url += `&with_cast=${personData.results[0].id}`;
      }
    }
    if (filterStream) {
      url += `&with_watch_providers=${filterStream}&watch_region=US`;
    }
    if (query.trim() && !filterGenre && !filterYear && !filterActor && !filterStream) {
      const searchRes = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=${page}&include_adult=false`
      );
      const searchData: TMDbResponse = await searchRes.json();
      return { results: searchData.results || [], total: searchData.total_results || 0 };
    }

    const res = await fetch(url);
    const data: TMDbResponse = await res.json();
    return { results: data.results || [], total: data.total_results || 0 };
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

  async function fetchStreamProviders() {
    if (!apiKey) return;
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/watch/providers/movie?api_key=${apiKey}&language=en-US&watch_region=US`
      );
      const data = await res.json();
      if (data.results) {
        const sorted = data.results
          .filter((p: { provider_id: number; provider_name: string; logo_path: string }) => p.provider_id && p.provider_name)
          .sort((a: { provider_name: string }, b: { provider_name: string }) => a.provider_name.localeCompare(b.provider_name))
          .slice(0, 50);
        setStreamProviders(sorted);
      }
    } catch (e) {
      console.error("Failed to fetch stream providers", e);
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
      const mapped = results.map(mapMovie);
      
      if (newPage === 1) {
        setMovies(mapped);
      } else {
        setMovies(prev => [...prev, ...mapped]);
      }
      setTotalResults(total);
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
    setMovies([]);
    setQuery("");
    setFilterGenre("");
    setFilterYear("");
    setFilterActor("");
    setFilterStream("");
    setCurrentPage(1);
    setTotalResults(0);
    router.push("/");
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
                placeholder="Search for movies..."
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
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Release Year</label>
                    <input
                      type="number"
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      placeholder="e.g. 2024"
                      min="1900"
                      max="2030"
                      className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm"
                    />
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
                      value={filterActor}
                      onChange={(e) => setFilterActor(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm"
                    >
                      <option value="">All Actors</option>
                      {popularActors.map((a) => (
                        <option key={a.id} value={a.name}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => { setFilterGenre(""); setFilterYear(""); setFilterActor(""); setFilterStream(""); }}
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
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        {movies.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-400">Search Results ({movies.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} onClick={() => router.push(`?movie=${movie.id}`)} />
              ))}
            </div>
            {movies.length < totalResults && movies.length >= 20 && (
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
                <MovieCard key={movie.id} movie={movie} onClick={() => router.push(`?movie=${movie.id}`)} />
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
      </main>

      <footer className="bg-gray-800 py-6 px-4 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>Powered by The Movie Database (TMDB)</p>
        </div>
      </footer>
    </div>
  );
}

function MovieCard({ movie, onClick }: { movie: Movie; onClick: () => void }) {
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
        <h3 className="font-semibold text-sm mb-1 truncate">{movie.title}</h3>
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