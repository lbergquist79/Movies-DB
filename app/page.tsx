"use client";

import { useState, useEffect } from "react";

interface TMDbMovie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string;
  overview: string;
  genre_ids: number[];
  vote_average: number;
}

interface TMDbResponse {
  results: TMDbMovie[];
}

interface Genre {
  id: number;
  name: string;
}

interface GenreResponse {
  genres: Genre[];
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

export default function Home() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [featured, setFeatured] = useState<Movie[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const key = localStorage.getItem("tmdb_api_key");
    if (key) {
      setApiKey(key);
    }
  }, []);

  useEffect(() => {
    if (apiKey) {
      fetchFeaturedMovies();
    }
  }, [apiKey]);

  async function fetchPopularMovies() {
    if (!apiKey) return [];
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`
    );
    const data: TMDbResponse = await res.json();
    return data.results || [];
  }

  async function searchMoviesTMDB(searchQuery: string) {
    if (!apiKey) return [];
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
        searchQuery
      )}&language=en-US&page=1&include_adult=false`
    );
    const data: TMDbResponse = await res.json();
    return data.results || [];
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

  async function searchMovies(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    if (!apiKey) {
      setError("Please enter your TMDB API key first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const results = await searchMoviesTMDB(query);
      const mapped = results.map(mapMovie);
      setMovies(mapped);
      if (mapped.length === 0) {
        setError("No movies found. Try a different search.");
      }
    } catch (e) {
      setError("Failed to search movies. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function saveApiKey(key: string) {
    localStorage.setItem("tmdb_api_key", key);
    setApiKey(key);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-center text-yellow-400">
            Movies-DB
          </h1>
          {!apiKey && (
            <div className="max-w-md mx-auto mb-4 p-4 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">
                Enter your TMDB API key:
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  id="apiKeyInput"
                  placeholder="API Key"
                  className="flex-1 px-3 py-2 rounded bg-gray-600 border border-gray-500 text-white text-sm"
                />
                <button
                  onClick={() => {
                    const key = (
                      document.getElementById("apiKeyInput") as HTMLInputElement
                    ).value;
                    if (key.trim()) saveApiKey(key.trim());
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 text-sm"
                >
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Get free key at themoviedb.org
              </p>
            </div>
          )}
          <form onSubmit={searchMovies} className="flex gap-2 max-w-xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for movies..."
              className="flex-1 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
            />
            <button
              type="submit"
              disabled={loading || !apiKey}
              className="px-6 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {movies.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-400">
              Search Results ({movies.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}

        {featured.length > 0 && movies.length === 0 && !loading && (
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-yellow-400">
              Popular Movies
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {featured.slice(0, 10).map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
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

function MovieCard({ movie }: { movie: Movie }) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform">
      {movie.poster ? (
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-56 object-cover"
        />
      ) : (
        <div className="w-full h-56 bg-gray-700 flex items-center justify-center">
          <span className="text-gray-500">No Poster</span>
        </div>
      )}
      <div className="p-3">
        <h3 className="font-semibold text-sm mb-1 truncate">{movie.title}</h3>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <span>{movie.year}</span>
          {movie.imdb_rating && (
            <span className="text-yellow-400">★ {movie.imdb_rating}</span>
          )}
        </div>
        {movie.genre && (
          <p className="text-xs text-gray-400 line-clamp-1 mb-1">
            {movie.genre}
          </p>
        )}
        {movie.plot && (
          <p className="text-xs text-gray-300 line-clamp-3 italic">
            {movie.plot}
          </p>
        )}
      </div>
    </div>
  );
}