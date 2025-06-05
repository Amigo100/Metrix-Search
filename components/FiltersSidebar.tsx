import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SearchFilters } from './SearchFilters';

interface FiltersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    sources: string[];
    specialties: string[];
    trust: string;
    type: string;
    startDate: string;
    endDate: string;
    sortBy: string;
  };
  onFiltersChange: (filters: any) => void;
}

const FiltersSidebar = ({ isOpen, onClose, filters, onFiltersChange }: FiltersSidebarProps) => {
  return (
    <aside
      className={cn(
        'fixed top-0 right-0 h-full w-72 bg-white shadow-lg transform transition-transform z-40',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <div className="p-4 h-full overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <SearchFilters
          isOpen={true}
          searchMode="guidelines"
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      </div>
    </aside>
  );
};

export default FiltersSidebar;
