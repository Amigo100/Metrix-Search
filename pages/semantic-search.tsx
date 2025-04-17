import React, { useState } from 'react'; // Use useState
// Import Lucide icons needed for the theme
import { Send, Loader2, AlertTriangle, Search as SearchIcon } from 'lucide-react';

// Base URL for your backend API - CHANGE THIS FOR DEPLOYMENT
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'; // Use environment variable

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

// --- Style Constants (Consistent with Metrix Theme) ---
const primaryButtonStyles = "inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-full text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 ease-in-out shadow-md disabled:opacity-70 disabled:cursor-not-allowed";
const formInputStyles = "flex-grow block w-full rounded-full border border-gray-300 py-2.5 px-5 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-base"; // Rounded-full
const errorAlertStyles = "bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 flex items-center gap-2 shadow-sm"; // Yellow for system/error messages
const linkStyles = "text-teal-600 hover:text-teal-700 hover:underline text-sm";

function PolicySearchPage() { // Renamed component to follow convention
  // State hooks for managing component state
  const [query, setQuery] = useState<string>(''); // User's search input
  const [results, setResults] = useState<SearchResult | null>(null); // Stores the API response {answer, citations}
  const [isLoading, setIsLoading] = useState<boolean>(false); // Tracks if API call is in progress
  const [error, setError] = useState<string | null>(null); // Stores any error messages

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

  // --- Render Component ---
  return (
    // Apply the background gradient to the entire page container
    <div className="min-h-screen bg-gradient-to-b from-white via-teal-50 to-white p-4 md:p-8 font-sans">
      {/* Main content card - Apply Metrix styling */}
      <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-lg"> {/* Increased max-width, padding, rounded-xl, shadow-lg */}

        {/* Brand Header Section */}
        <header className="flex flex-col items-center justify-center text-center mb-8"> {/* Increased bottom margin */}
          <img
              src="/MetrixAI.png" // Ensure path is correct relative to public folder
              alt="Metrix Logo"
              width={64} // Explicitly set width
              height={64} // Explicitly set height
              className="mb-3" // Added margin below logo
          />
           <h1 className="text-3xl font-bold text-gray-900"> {/* Increased text size */}
             Policy Document Search
           </h1>
           <p className="text-gray-600 mt-1">Powered by Metrix AI</p> {/* Optional subtitle */}
         </header>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3 mb-6"> {/* Use gap-3 */}
          <div className="relative flex-grow w-full sm:w-auto"> {/* Ensure input takes available space */}
             <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                 <SearchIcon size={18} />
             </span>
             <input
               type="search"
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               placeholder="Enter your search query..."
               // Apply the Metrix form input style
               className={`${formInputStyles} pl-10`} // Add left padding for icon
               aria-label="Search query"
               disabled={isLoading}
             />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()} // Also disable if query is empty
            // Apply the Metrix primary button style
            className={`${primaryButtonStyles} w-full sm:w-auto flex-shrink-0 h-[46px]`} // Match height with input approx, ensure it doesn't shrink excessively
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" /> // Use Loader icon
            ) : (
               <Send size={18} /> // Use Send icon
            )}
            <span className="ml-2">{isLoading ? 'Searching...' : 'Search'}</span> {/* Add text next to icon */}
          </button>
        </form>

        {/* Loading State Indicator - Themed */}
        {isLoading && (
          <div className="text-center text-teal-600 font-medium py-4 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            <span>Loading results...</span>
          </div>
        )}

        {/* Error Display Area - Themed */}
        {error && (
          <div className={errorAlertStyles} role="alert">
             <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0"/> {/* Error Icon */}
            <div>
               <strong className="font-semibold">Error: </strong>
               <span>{error}</span>
            </div>
          </div>
        )}

        {/* Results Display Area - Themed */}
        {results && !isLoading && (
          <div className="mt-8 space-y-6"> {/* Increased margin-top and spacing */}
            {/* Display Answer */}
            <div>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Answer:</h2> {/* Use darker gray */}
              {/* Use lighter background, rounded, consistent padding */}
              <div className="bg-gray-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap border border-gray-200">
                {results.answer || <span className="text-gray-500 italic">No answer generated.</span>}
              </div>
            </div>

            {/* Display Citations */}
            {results.citations && results.citations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Sources:</h3>
                <ul className="list-none space-y-3 pl-0">
                  {results.citations.map((citation) => (
                    // Style citation items with border, padding, rounded corners
                    <li key={citation.qdrant_id || citation.source_id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
                      <div className="font-medium text-gray-900 mb-1"> {/* Darker text */}
                        [{citation.source_id}] {citation.document_title || 'Unknown Document'}
                      </div>
                      <div className="text-sm text-gray-600 block mb-1">
                        {citation.page_number ? `Page: ${citation.page_number} | ` : ''}
                        Heading: {citation.heading || 'N/A'} |
                        Score: {citation.score.toFixed(3)}
                      </div>
                      {/* Conditionally render the link with Teal styling */}
                      {citation.url && (
                        <a
                          href={`${API_BASE_URL}${citation.url}`} // Construct full URL
                          target="_blank" // Open in new tab
                          rel="noopener noreferrer" // Security measure
                          // Apply the Metrix link style
                          className={linkStyles}
                        >
                          Click here to view source document {/* Changed text slightly */}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Handle case with answer but no citations */}
             {results.citations && results.citations.length === 0 && (
                 <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Sources:</h3>
                    <p className="text-gray-500 italic">No specific sources were cited for this answer.</p>
                </div>
             )}
          </div>
        )}
      </div>
       {/* Optional Footer */}
       <footer className="text-center mt-8 text-xs text-gray-500">
            Metrix AI Policy Search | © {new Date().getFullYear()}
       </footer>
    </div>
  );
}

export default PolicySearchPage; // Export the component
