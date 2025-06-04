import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/Card';
import { SearchFilters } from './SearchFilters';

interface SearchSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  onFilterToggle: () => void;
  filters: {
    sources: string[];
    specialties: string[];
    dateRange: string;
    evidenceLevel: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function SearchSection({
  searchQuery,
  onSearchChange,
  showFilters,
  onFilterToggle,
  filters,
  onFiltersChange,
}: SearchSectionProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <Card className="p-8 bg-white shadow-lg border border-gray-200">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search clinical guidelines..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-12 pr-4 py-4 w-full text-lg border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onFilterToggle}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
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
