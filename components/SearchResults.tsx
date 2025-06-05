import DocumentCard from '@/components/DocumentCard';

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
        <DocumentCard
          key={idx}
          title={r.document_title || r.title}
          summary={r.heading || ''}
          publishDate={r.publish_date}
          specialty={r.specialty}
          type={r.type}
          relevanceScore={r.score}
          url={r.url}
        />
      ))}
    </div>
  );
}
