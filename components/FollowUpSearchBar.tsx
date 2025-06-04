import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FollowUpSearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit: () => void;
}

export function FollowUpSearchBar({
  query,
  onQueryChange,
  onSubmit,
}: FollowUpSearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
      <div className="flex items-center max-w-3xl mx-auto">
        <Input
          type="text"
          placeholder="Ask a follow-up question..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow mr-2"
        />
        <Button onClick={onSubmit} className="flex items-center">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
    </div>
  );
}
