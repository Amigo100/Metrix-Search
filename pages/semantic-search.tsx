'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { SearchSection } from '@/components/SearchSection';
import { SearchResults } from '@/components/SearchResults';
import { AISummary } from '@/components/AISummary';
import { PopularSearches } from '@/components/PopularSearches';
import { FollowUpSearchBar } from '@/components/FollowUpSearchBar';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

const SemanticSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    sources: [],
    specialties: [],
    trust: '',
    dateRange: '',
    evidenceLevel: '',
  });
  const [results, setResults] = useState<any[]>([]);
  const [summary, setSummary] = useState('');
  const [followUpQuery, setFollowUpQuery] = useState('');

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

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length >= 3) {
      fetchResults(query.trim());
    } else {
      setResults([]);
      setSummary('');
    }
  };

  const handlePopularSearchSelect = (query: string) => {
    setSearchQuery(query);
    fetchResults(query);
  };

  const handleFollowUpSubmit = () => {
    const q = followUpQuery.trim();
    if (!q) return;
    setSearchQuery(q);
    setFollowUpQuery('');
    fetchResults(q);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <Header />

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${searchQuery ? 'pb-24' : ''}`}>
        <SearchSection
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          showFilters={showFilters}
          onFilterToggle={() => setShowFilters(!showFilters)}
          filters={filters}
          onFiltersChange={setFilters}
        />

        <AISummary searchQuery={searchQuery} summary={summary} loading={loading} />

        {!searchQuery ? (
          <PopularSearches onSearchSelect={handlePopularSearchSelect} />
        ) : (
          <SearchResults results={results} searchMode="guidelines" loading={loading} />
        )}
      </main>
      {searchQuery && !loading && (
        <FollowUpSearchBar
          query={followUpQuery}
          onQueryChange={setFollowUpQuery}
          onSubmit={handleFollowUpSubmit}
        />
      )}
    </div>
  );
};

export default SemanticSearch;
