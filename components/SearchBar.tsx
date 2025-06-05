import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onToggleFilters: () => void;
}

const SearchBar = ({ onSearch, onToggleFilters }: SearchBarProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search guidelines, protocols, and medical documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-teal-500 rounded-lg"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onToggleFilters}
            className="px-4 py-3 border-2 border-gray-200 hover:border-teal-500"
          >
            <Filter className="h-5 w-5" />
          </Button>
          <Button type="submit" className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-lg font-medium">
            Search
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
