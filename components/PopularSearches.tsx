import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

interface PopularSearchesProps {
  onSearchSelect: (query: string) => void;
}

export function PopularSearches({ onSearchSelect }: PopularSearchesProps) {
  const popularSearches = [
    {
      title: 'Acute Myocardial Infarction Management',
      description:
        'Evidence-based guidelines for STEMI and NSTEMI diagnosis, treatment, and post-MI care including antiplatelet therapy and reperfusion strategies.',
      searchQuery: 'myocardial infarction',
    },
    {
      title: 'Sepsis Recognition and Management',
      description:
        'Early identification protocols, sepsis bundles, antibiotic selection, and organ support strategies for septic patients.',
      searchQuery: 'sepsis management',
    },
    {
      title: 'Cellulitis Treatment Guidelines',
      description:
        'Antibiotic selection, severity assessment, and management approaches for skin and soft tissue infections.',
      searchQuery: 'cellulitis',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto mb-8">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          <h2 className="text-xl font-semibold text-gray-900">Popular Searches</h2>
        </div>
        <p className="text-gray-600">Get started with these commonly searched clinical guidelines</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {popularSearches.map((search, index) => (
          <Card key={index} className="p-4 hover:shadow-md transition-shadow duration-200 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">{search.title}</h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">{search.description}</p>
            <Button
              size="sm"
              onClick={() => onSearchSelect(search.searchQuery)}
              className="w-full"
            >
              Search Guidelines
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
