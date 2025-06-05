import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/button';
import { SearchFilters } from './SearchFilters';

interface FiltersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    sources: string[];
    specialties: string[];
    trust: string;
    dateRange: string;
    evidenceLevel: string;
  };
  onFiltersChange: (filters: any) => void;
}

const FiltersSidebar = ({ isOpen, onClose, filters, onFiltersChange }: FiltersSidebarProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white h-full overflow-y-auto max-w-sm">
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
      </DialogContent>
    </Dialog>
  );
};

export default FiltersSidebar;
