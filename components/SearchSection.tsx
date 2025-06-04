import { Filter, Search } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { SearchFilters } from './SearchFilters';

interface SearchSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  showFilters: boolean;
  onFilterToggle: () => void;
  filters: {
    sources: string[];
    specialties: string[];
    trust: string;
    dateRange: string;
    evidenceLevel: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function SearchSection({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  showFilters,
  onFilterToggle,
  filters,
  onFiltersChange,
}: SearchSectionProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearchSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <Card className="p-8 bg-white shadow-lg border border-gray-200">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex items-center">
            <Button
              variant="outline"
              onClick={onFilterToggle}
              className="mr-2 flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <div className="relative flex-grow mr-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search clinical guidelines..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                className="pl-12 pr-4 py-4 w-full text-lg border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <Button onClick={onSearchSubmit} className="flex items-center">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <SearchFilters
        isOpen={showFilters}
        searchMode="guidelines"
        filters={filters}
        onFiltersChange={onFiltersChange}
      />
    </div>
  );
}
