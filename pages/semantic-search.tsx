// pages/policy-search.tsx
import React, { useState } from 'react';
import { Send, Loader2, AlertTriangle, Search as SearchIcon } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

/* --------------------------- Types ---------------------------- */
interface Citation {
  source_id: number;
  document_title: string;
  page_number: number | null;
  heading: string;
  qdrant_id: string | number;
  score: number;
  url: string | null;
}
interface SearchResult { answer: string; citations: Citation[]; }

/* -------------------------- Config ---------------------------- */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/* --------------------------- Styles --------------------------- */
const primaryBtn =
  'inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-full text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 ease-in-out shadow-md disabled:opacity-70';
const inputCls =
  'flex-grow block w-full rounded-full border border-gray-300 bg-white py-2.5 px-5 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 placeholder-gray-400 text-base';
const errAlert =
  'bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 flex items-center gap-2';
const linkCls = 'text-teal-600 hover:text-teal-700 hover:underline text-sm';

/* ========================== Component ========================= */
function PolicySearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------------- Handlers --------------------- */
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null); setResults(null);

    if (query.trim().length < 3) {
      setError('Please enter a search query with at least 3 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const url = new URL(
        `${API_BASE_URL}/predictive/api/search/policy`
      );
      url.searchParams.append('query', query);

      const res = await fetch(url.toString());
      if (!res.ok) {
        const detail = (await res.json()).detail || `HTTP ${res.status}`;
        throw new Error(detail);
      }
      const data: SearchResult & { error?: string } = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ----------------------- Render ---------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-teal-50 to-white p-4 md:p-8 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="pt-12">
          <PageHeader title="Policy Document Search" subtitle="Powered by Metrix AI" />
        </div>

        {/* form -------------------------------------------------- */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row items-center gap-3 mb-6 max-w-3xl mx-auto"
        >
          <div className="relative flex-grow w-full sm:w-auto">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon size={18} />
            </span>
            <input
              type="search"
              className={`${inputCls} pl-10`}
              placeholder="Enter your search query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className={`${primaryBtn} w-full sm:w-auto h-[46px]`}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            <span className="ml-2">{isLoading ? 'Searching...' : 'Search'}</span>
          </button>
        </form>

        {/* feedback ---------------------------------------------- */}
        <div className="max-w-4xl mx-auto mt-8">
          {isLoading && (
            <div className="text-center text-teal-600 font-medium py-4 flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Loading results…</span>
            </div>
          )}

          {error && !isLoading && (
            <div className={errAlert} role="alert">
              <AlertTriangle size={18} className="text-yellow-600" />
              <span>{error}</span>
            </div>
          )}

          {results && !isLoading && (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3 text-gray-800">Answer:</h2>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap">
                  {results.answer || <span className="text-gray-500 italic">No answer generated.</span>}
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Sources:</h3>
                {results.citations?.length ? (
                  <ul className="space-y-3">
                    {results.citations.map((c) => (
                      <li
                        key={c.qdrant_id || c.source_id}
                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                      >
                        <div className="font-medium text-gray-900 mb-1">
                          [{c.source_id}] {c.document_title || 'Unknown Document'}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {c.page_number ? `Page ${c.page_number} | ` : ''}
                          Heading: {c.heading || 'N/A'} | Score: {c.score.toFixed(3)}
                        </div>
                        {c.url && (
                          <a
                            href={`${API_BASE_URL}${c.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={linkCls}
                          >
                            View PDF
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No citations.</p>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center mt-12 text-xs text-gray-500">
        Metrix AI Policy Search | © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default PolicySearchPage;
