import DocumentCard from '@/components/DocumentCard';

interface SearchResultsProps {
  results: any[];
  searchMode: string;
  loading: boolean;
  sortBy: string;
}

export function SearchResults({ results, loading, sortBy }: SearchResultsProps) {
  if (loading) {
    return <p className="text-center text-gray-600">Loading results...</p>;
  }

  if (!results.length) {
    return <p className="text-center text-gray-600">No results found.</p>;
  }

  const sorted = [...results];
  if (sortBy === 'alphabetical') {
    sorted.sort((a, b) =>
      (a.document_title || a.title).localeCompare(b.document_title || b.title)
    );
  } else if (sortBy === 'date') {
    sorted.sort(
      (a, b) =>
        new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime()
    );
  }

  return (
    <div className="space-y-4">
      {sorted.map((r, idx) => (
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
