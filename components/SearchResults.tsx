import { Card } from '@/components/ui/card';

interface SearchResultsProps {
  results: any[];
  searchMode: string;
  loading: boolean;
}

export function SearchResults({ results, loading }: SearchResultsProps) {
  if (loading) {
    return <p className="text-center text-gray-600">Loading results...</p>;
  }

  if (!results.length) {
    return <p className="text-center text-gray-600">No results found.</p>;
  }

  return (
    <div className="space-y-4">
      {results.map((r, idx) => (
        <Card key={idx} className="p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-1">
            {r.document_title || r.title}
          </h3>
          {r.heading && <p className="text-sm text-gray-600 mb-1">{r.heading}</p>}
          {r.page_number && (
            <p className="text-xs text-gray-500">Page {r.page_number}</p>
          )}
          {r.url && (
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 underline"
            >
              View Source
            </a>
          )}
        </Card>
      ))}
    </div>
  );
}
