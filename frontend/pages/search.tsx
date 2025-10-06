import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import api from '../lib/api';
import { TASK_OPTIONS } from '../constants';

interface SearchResult {
  content: string;
  metadata: {
    subject?: string;
    class_grade?: number;
    source?: string;
    chunk_id?: string;
  };
  score: number;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
}

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState<number | ''>('');
  const [maxResults, setMaxResults] = useState(10);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  const { currentUser, loading, getAuthHeader } = useAuth();
  const router = useRouter();

  const performSearch = async () => {
    if (!query.trim()) {
      setError('Kérjük, adjon meg egy keresési kifejezést!');
      return;
    }

    setIsSearching(true);
    setError('');
    setResults([]);

    try {
      const authHeader = getAuthHeader();
      const response = await api.post('/rag/search', {
        query: query,
        k: maxResults,
        subject: subject || undefined,
        grade: grade || undefined,
      }, authHeader);

      const searchResponse: SearchResponse = response.data;
      setResults(searchResponse.results || []);
      setSearchPerformed(true);
      
    } catch (error) {
      console.error('Search error:', error);
      setError('Hiba történt a keresés során. Kérjük, próbálja újra.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        username={currentUser?.name}
        userRole={currentUser?.role}
        onDashboardClick={() => router.push('/dashboard')}
      />
      
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold mb-6">Tudásbázis Keresés</h1>
            <p className="text-gray-600 mb-6">
              Keressen a feltöltött dokumentumok között. Ez segít ellenőrizni, hogy a dokumentumok megfelelően vektorizálódtak-e.
            </p>

            {/* Search Form */}
            <div className="space-y-4">
              {/* Search Query */}
              <div>
                <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
                  Keresési kifejezés *
                </label>
                <input
                  id="query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Mit keres? (pl. 'költészet', 'matematikafeladat')"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Subject Filter */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Tantárgy (opcionális)
                  </label>
                  <select
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Minden tantárgy</option>
                    {TASK_OPTIONS.subjects.map((subj) => (
                      <option key={subj.value} value={subj.value}>
                        {subj.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grade Filter */}
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                    Évfolyam (opcionális)
                  </label>
                  <select
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Minden évfolyam</option>
                    {TASK_OPTIONS.grades.map((gradeOption) => (
                      <option key={gradeOption.value} value={gradeOption.value}>
                        {gradeOption.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Max Results */}
                <div>
                  <label htmlFor="maxResults" className="block text-sm font-medium text-gray-700 mb-1">
                    Max eredmény
                  </label>
                  <select
                    id="maxResults"
                    value={maxResults}
                    onChange={(e) => setMaxResults(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={performSearch}
                disabled={isSearching || !query.trim()}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Keresés...
                  </>
                ) : (
                  'Keresés indítása'
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-800 border border-red-300 rounded">
                {error}
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchPerformed && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">
                Keresési eredmények ({results.length})
              </h2>
              
              {results.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Nincs találat a keresési kifejezésre.</p>
                  <p className="text-sm mt-2">Próbáljon más kifejezéseket vagy ellenőrizze, hogy vannak-e feltöltött dokumentumok.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      {/* Metadata Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {result.metadata?.subject && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {result.metadata.subject}
                          </span>
                        )}
                        {result.metadata?.class_grade && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            {result.metadata.class_grade}. osztály
                          </span>
                        )}
                        {result.metadata?.source && (
                          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                            {result.metadata.source}
                          </span>
                        )}
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          Relevancia: {Math.round(result.score * 100)}%
                        </span>
                      </div>

                      {/* Content */}
                      <div className="text-gray-700">
                        {result.content}
                      </div>

                      {/* Chunk ID */}
                      {result.metadata?.chunk_id && (
                        <div className="text-xs text-gray-400 mt-2">
                          Chunk ID: {result.metadata.chunk_id}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;