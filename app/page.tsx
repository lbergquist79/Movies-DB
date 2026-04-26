"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ApiMovie {
  "#TITLE": string;
  "#YEAR": string;
  "#IMDB_ID": string;
  "#RANK": string;
  "#ACTORS": string;
  "#AKA": string;
  "#IMDB_URL": string;
  "#IMG_POSTER": string;
  photo_width?: number;
  photo_height?: number;
}

interface ApiResponse {
  description: ApiMovie[];
  error_code: number;
}

interface Movie {
  id: string;
  title: string;
  year: string;
  poster: string;
  plot: string;
  genre: string;
  director: string;
  imdb_rating: string;
}

function mapApiMovie(apiMovie: ApiMovie): Movie {
  return {
    id: apiMovie["#IMDB_ID"],
    title: apiMovie["#TITLE"],
    year: apiMovie["#YEAR"],
    poster: apiMovie["#IMG_POSTER"] || "",
    plot: apiMovie["#AKA"] || "",
    genre: apiMovie["#ACTORS"] || "",
    director: "",
    imdb_rating: apiMovie["#RANK"] || "",
  };
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [featured, setFeatured] = useState<Movie[]>([]);

  useEffect(() => {
    fetchFeaturedMovies();
  }, []);

  async function fetchFeaturedMovies() {
    try {
      const res = await fetch(
        "https://imdb.iamidiotareyoutoo.com/search?tt=batman"
      );
      const data: ApiResponse = await res.json();
      const mapped = (data.description || []).map(mapApiMovie);
      setFeatured(mapped);
    } catch (e) {
      console.error("Failed to fetch featured movies", e);
    }
  }

  async function searchMovies(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `https://imdb.iamidiotareyoutoo.com/search?q=${encodeURIComponent(
          query
        )}`
      );
      const data: ApiResponse = await res.json();
      const mapped = (data.description || []).map(mapApiMovie);
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-center text-yellow-400">
            Movies-DB
          </h1>
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
              disabled={loading}
              className="px-6 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {movies.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-400">
              Search Results
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}

        {featured.length > 0 && movies.length === 0 && !loading && (
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-yellow-400">
              Featured: Batman Movies
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {featured.slice(0, 6).map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}

        {movies.length === 0 && featured.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl">Search for your favorite movies!</p>
          </div>
        )}
      </main>

      <footer className="bg-gray-800 py-6 px-4 mt-auto">
        <div className="max-w-4xl mx-auto text-center text-gray-400">
          <p>Powered by Free Movie Database API</p>
        </div>
      </footer>
    </div>
  );
}

function MovieCard({ movie }: { movie: Movie }) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform">
<<<<<<< HEAD
      {movie.poster ? (
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-80 object-cover"
        />
=======
      {movie.poster && movie.poster !== "N/A" ? (
        <div className="relative w-full h-80">
          <Image
            src={movie.poster}
            alt={movie.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          />
        </div>
>>>>>>> c4d13126cd27219ca45721e404487fc356f52fff
      ) : (
        <div className="w-full h-80 bg-gray-700 flex items-center justify-center">
          <span className="text-gray-500">No Poster</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate">{movie.title}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <span>{movie.year}</span>
          {movie.imdb_rating && (
            <span className="text-yellow-400">★ {movie.imdb_rating}</span>
          )}
        </div>
        {movie.genre && (
          <p className="text-sm text-gray-400 mb-2 line-clamp-2">
            {movie.genre}
          </p>
        )}
        {movie.plot && (
          <p className="text-sm text-gray-300 line-clamp-3">{movie.plot}</p>
        )}
      </div>
    </div>
  );
}