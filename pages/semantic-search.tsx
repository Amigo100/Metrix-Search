'use client';

import { useState } from 'react';

import { AISummary } from '@/components/AISummary';
import Header from '@/components/Header';
import { PopularSearches } from '@/components/PopularSearches';
import { SearchResults } from '@/components/SearchResults';
import SearchBar from '@/components/SearchBar';
import FiltersSidebar from '@/components/FiltersSidebar';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

const SemanticSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    sources: [],
    specialties: [],
    trust: '',
    type: '',
    startDate: '',
    endDate: '',
    sortBy: 'relevance',
  });
  const [results, setResults] = useState<any[]>([]);
  const [summary, setSummary] = useState('');

  const fetchResults = async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/semantic/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setResults(data.citations || []);
      setSummary(data.answer || '');
    } catch (err) {
      setResults([]);
      setSummary('');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const q = query.trim();
    if (q.length >= 3) {
      setSubmittedQuery(q);
      fetchResults(q);
    } else {
      setResults([]);
      setSummary('');
      setSubmittedQuery('');
    }
  };

  const handlePopularSearchSelect = (query: string) => {
    setSearchQuery(query);
    setSubmittedQuery(query);
    fetchResults(query);
  };

  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="flex">
        <div className="flex-1">
          <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white py-16 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Find Medical Guidelines & Protocols</h1>
              <p className="text-xl md:text-2xl text-teal-100 mb-8 font-light">
                AI-powered search across thousands of clinical guidelines and research documents
              </p>
              <div className="mt-8">
                <SearchBar onSearch={handleSearch} onToggleFilters={toggleFilters} />
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AISummary query={submittedQuery} summary={summary} loading={loading} />
            {!submittedQuery ? (
              <PopularSearches onSearchSelect={handlePopularSearchSelect} />
            ) : (
              <SearchResults
                results={results}
                searchMode="guidelines"
                loading={loading}
                sortBy={filters.sortBy}
              />
            )}
          </div>
        </div>

        <FiltersSidebar
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </main>
    </div>
  );
};

export default SemanticSearch;
