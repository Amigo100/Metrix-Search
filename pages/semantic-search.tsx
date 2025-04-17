import React from 'react'; // Corrected the import statement

// Base URL for your backend API - CHANGE THIS FOR DEPLOYMENT
const API_BASE_URL = 'http://localhost:8000';

// Define the structure of a citation for clarity
interface Citation {
  source_id: number;
  document_title: string;
  page_number: number | null;
  heading: string;
  qdrant_id: string;
  score: number;
  url: string | null; // URL to view the document
}

// Define the structure of the search results
interface SearchResult {
  answer: string;
  citations: Citation[];
}

// Define logger - replace with a proper logger if needed
const logger = {
    error: console.error
};

function App() {
  // State hooks for managing component state
  const [query, setQuery] = React.useState<string>(''); // User's search input
  const [results, setResults] = React.useState<SearchResult | null>(null); // Stores the API response {answer, citations}
  const [isLoading, setIsLoading] = React.useState<boolean>(false); // Tracks if API call is in progress
  const [error, setError] = React.useState<string | null>(null); // Stores any error messages

  // Function to handle the search submission
  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default page reload on form submission
    setError(null); // Clear previous errors
    setResults(null); // Clear previous results

    // Basic input validation
    if (query.trim().length < 3) {
      setError('Please enter a search query with at least 3 characters.');
      return;
    }

    setIsLoading(true); // Set loading state

    try {
      // Construct the URL with the query parameter
      const searchUrl = new URL(`${API_BASE_URL}/api/search/policy`);
      searchUrl.searchParams.append('query', query);

      // Make the API request using fetch
      const response = await fetch(searchUrl.toString());

      // Check if the response status is OK (e.g., 200)
      if (!response.ok) {
        // Try to parse error detail from backend if available
        let errorDetail = `HTTP error! Status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorDetail; // Use detail field from FastAPI's HTTPException
        } catch (e) {
          // Ignore if error response is not JSON
        }
        throw new Error(errorDetail);
      }

      // Parse the successful JSON response
      const data: SearchResult & { error?: string } = await response.json();

      // Check for internal errors reported by the backend search logic
      if (data.error) {
        throw new Error(data.error);
      }

      // Update state with the received results
      setResults(data);

    } catch (err) {
      // Handle network errors or errors thrown from response handling
      logger.error('Search failed:', err); // Log the actual error
      setError(err instanceof Error ? err.message : 'An unknown error occurred during search.');
      setResults(null); // Clear results on error
    } finally {
      // Always turn off loading state, regardless of success or failure
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
          Policy Document Search
        </h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-6">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your search query..."
            className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            aria-label="Search query"
          />
          <button
            type="submit"
            disabled={isLoading} // Disable button while loading
            className={`px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Loading State Indicator */}
        {isLoading && (
          <div className="text-center text-gray-600 py-4">Loading...</div>
        )}

        {/* Error Display Area */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Results Display Area */}
        {results && !isLoading && (
          <div className="mt-6 space-y-4">
            {/* Display Answer */}
            <div>
              <h2 className="text-xl font-semibold mb-2 text-gray-700">Answer:</h2>
              {/* Render answer as pre-wrap to respect newlines, sanitize if needed */}
              <p className="bg-gray-50 p-4 rounded-md text-gray-800 whitespace-pre-wrap">
                {results.answer || 'No answer generated.'}
              </p>
            </div>

            {/* Display Citations */}
            {results.citations && results.citations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-700">Sources:</h3>
                <ul className="list-none space-y-3 pl-0">
                  {results.citations.map((citation) => (
                    <li key={citation.qdrant_id || citation.source_id} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                      <span className="font-medium text-gray-800">
                        [{citation.source_id}] {citation.document_title || 'Unknown Document'}
                      </span>
                      <span className="text-sm text-gray-600 block">
                        {citation.page_number ? `Page: ${citation.page_number} | ` : ''}
                        Heading: {citation.heading || 'N/A'} |
                        Score: {citation.score.toFixed(3)}
                      </span>
                      {/* Conditionally render the link */}
                      {citation.url && (
                        <a
                          href={`${API_BASE_URL}${citation.url}`} // Construct full URL
                          target="_blank" // Open in new tab
                          rel="noopener noreferrer" // Security measure
                          className="text-blue-600 hover:text-blue-800 hover:underline text-sm block mt-1"
                        >
                          Click here to view PDF {/* User requested text */}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App; // Export the component for use

