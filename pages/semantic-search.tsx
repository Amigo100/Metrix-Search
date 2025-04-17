// /pages/policy-search.tsx
import React, { useState } from 'react';
import {
  Send,
  Loader2,
  AlertTriangle,
  Search as SearchIcon,
} from 'lucide-react';

import PageHeader from '@/components/PageHeader';   // ⭐ canonical header

/* --------------------------- Types & Interfaces --------------------------- */

interface Citation {
  source_id: number;
  document_title: string;
  page_number: number | null;
  heading: string;
  qdrant_id: string;
  score: number;
  url: string | null;
}

interface SearchResult {
  answer: string;
  citations: Citation[];
}

/* ----------------------------- Config / Utils ---------------------------- */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const logger = { error: console.error };

/* ------------------------------ UI classes -------------------------------- */

const primaryButtonStyles =
  'inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-full text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 ease-in-out shadow-md disabled:opacity-70 disabled:cursor-not-allowed';

const formInputStyles =
  'flex-grow block w-full rounded-full border border-gray-300 bg-white py-2.5 px-5 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-base';

const errorAlertStyles =
  'bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 flex items-center gap-2 shadow-sm';

const linkStyles =
  'text-teal-600 hover:text-teal-700 hover:underline text-sm';

/* ------------------------------------------------------------------------ */
/*  Component                                                               */
/* ------------------------------------------------------------------------ */

function PolicySearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ----------------------------- Handlers ----------------------------- */

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setResults(null);

    if (query.trim().length < 3) {
      setError('Please enter a search query with at least 3 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const url = new URL(`${API_BASE_URL}/api/search/policy`);
      url.searchParams.append('query', query);

      const res = await fetch(url.toString());

      if (!res.ok) {
        let detail = `HTTP error ${res.status}`;
        try {
          const data = await res.json();
          detail = data.detail || detail;
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }

      const data: SearchResult & { error?: string } = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data);
    } catch (err) {
      logger.error(err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------ Render ------------------------------ */

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-teal-50 to-white p-4 md:p-8 pb-16 font-sans">
      <div className="max-w-4xl mx-auto">

        {/* ✅ canonical header with consistent spacing */}
        <div className="pt-12">
          <PageHeader
            title="Policy Document Search"
            subtitle="Powered by Metrix AI"
          />
        </div>

        {/* ------------------- Search form ------------------- */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row items-center gap-3 mb-6 max-w-3xl mx-auto"
        >
          <div className="relative flex-grow w-full sm:w-auto">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
              <SearchIcon size={18} />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your search query..."
              className={`${formInputStyles} pl-10`}
              aria-label="Search query"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className={`${primaryButtonStyles} w-full sm:w-auto flex-shrink-0 h-[46px]`}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            <span className="ml-2">
              {isLoading ? 'Searching...' : 'Search'}
            </span>
          </button>
        </form>

        {/* ------------------- Feedback area ------------------- */}
        <div className="max-w-4xl mx-auto mt-8">
          {isLoading && (
            <div className="text-center text-teal-600 font-medium py-4 flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Loading results...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className={errorAlertStyles} role="alert">
              <AlertTriangle
                size={18}
                className="text-yellow-600 flex-shrink-0"
              />
              <div>
                <strong className="font-semibold">Error: </strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {results && !isLoading && (
            <div className="space-y-6">
              {/* Answer */}
              <div>
                <h2 className="text-xl font-semibold mb-3 text-gray-800">
                  Answer:
                </h2>
                <div className="bg-gray-50/70 backdrop-blur-sm p-4 rounded-lg text-gray-800 whitespace-pre-wrap border border-gray-200/80 shadow-sm">
                  {results.answer || (
                    <span className="text-gray-500 italic">
                      No answer generated.
                    </span>
                  )}
                </div>
              </div>

              {/* Citations */}
              {results.citations?.length ? (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    Sources:
                  </h3>
                  <ul className="list-none space-y-3 pl-0">
                    {results.citations.map((c) => (
                      <li
                        key={c.qdrant_id || c.source_id}
                        className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-gray-200/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="font-medium text-gray-900 mb-1">
                          [{c.source_id}] {c.document_title || 'Unknown Document'}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {c.page_number ? `Page: ${c.page_number} | ` : ''}
                          Heading: {c.heading || 'N/A'} | Score:{' '}
                          {c.score.toFixed(3)}
                        </div>
                        {c.url && (
                          <a
                            href={`${API_BASE_URL}${c.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={linkStyles}
                          >
                            Click here to view source document
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                results && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">
                      Sources:
                    </h3>
                    <p className="text-gray-500 italic">
                      No specific sources were cited for this answer.
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center mt-12 text-xs text-gray-500">
        Metrix AI Policy Search | © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default PolicySearchPage;
