import { Card } from '@/components/ui/Card';

interface SearchFiltersProps {
  isOpen: boolean;
  searchMode: string;
  filters: {
    sources: string[];
    specialties: string[];
    dateRange: string;
    evidenceLevel: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function SearchFilters({ isOpen, filters, onFiltersChange }: SearchFiltersProps) {
  if (!isOpen) return null;

  const sources = ['AHA/ACC Guidelines', 'WHO Guidelines', 'NICE Guidelines'];
  const specialties = ['Cardiology', 'Emergency Medicine'];

  const toggle = (group: 'sources' | 'specialties', value: string) => {
    const current = filters[group];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [group]: next });
  };

  return (
    <Card className="p-4 mt-4 space-y-4 border border-gray-200">
      <div>
        <p className="font-semibold mb-2">Sources</p>
        <div className="space-y-1">
          {sources.map((src) => (
            <label key={src} className="flex items-center space-x-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={filters.sources.includes(src)}
                onChange={() => toggle('sources', src)}
              />
              <span>{src}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="font-semibold mb-2">Specialties</p>
        <div className="space-y-1">
          {specialties.map((spec) => (
            <label key={spec} className="flex items-center space-x-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={filters.specialties.includes(spec)}
                onChange={() => toggle('specialties', spec)}
              />
              <span>{spec}</span>
            </label>
          ))}
        </div>
      </div>
    </Card>
  );
}
