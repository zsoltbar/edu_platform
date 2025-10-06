import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';
import { TASK_OPTIONS } from '../../constants';

const DocumentUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [stats, setStats] = useState<{
    total_documents: number;
    subjects: string[];
    grades: number[];
    sources_count: number;
    embedding_dimension: number;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  const { currentUser, loading, getAuthHeader } = useAuth();
  const router = useRouter();

  // Load stats when component mounts
  useEffect(() => {
    if (!loading && currentUser) {
      loadStats();
    }
  }, [loading, currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const uploadDocument = async () => {
    if (!file || !subject) {
      setMessage('Kérjük, válasszon ki egy fájlt és adja meg a tantárgyat!');
      setMessageType('error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject);
    if (grade) formData.append('grade', grade.toString());
    if (description) formData.append('description', description);

    setIsUploading(true);
    setMessage('');

    try {
      const authHeader = getAuthHeader();
      const response = await api.post('/rag/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...('headers' in authHeader ? authHeader.headers : {}),
        },
      });

      const result = response.data;
      setMessage(`Sikeres feltöltés! ${result.chunks_processed} chunk feldolgozva.`);
      setMessageType('success');
      
      // Reset form
      setFile(null);
      setSubject('');
      setGrade('');
      setDescription('');
      if (document.getElementById('file-input')) {
        (document.getElementById('file-input') as HTMLInputElement).value = '';
      }
      
      // Reload stats after successful upload
      loadStats();
      
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(`Hiba történt a feltöltés során: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`);
      setMessageType('error');
    } finally {
      setIsUploading(false);
    }
  };

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const authHeader = getAuthHeader();
      const response = await api.get('/rag/stats', authHeader);
      console.log('Stats response:', response.data); // Debug log
      setStats(response.data);
    } catch (error) {
      console.error('Stats loading error:', error);
      // Don't show error message for stats, just log it
    } finally {
      setIsLoadingStats(false);
    }
  };

  const resetVectorDB = async () => {
    try {
      const authHeader = getAuthHeader();
      await api.delete('/rag/reset', authHeader);
      setMessage('Tudásbázis sikeresen törölve!');
      setMessageType('success');
      // Reload stats after reset
      loadStats();
    } catch (error) {
      console.error('Reset error:', error);
      setMessage(`Hiba történt a tudásbázis törlésekor: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`);
      setMessageType('error');
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
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Dokumentum Feltöltés</h1>
          <p className="text-gray-600 mb-6">
            Töltse fel az oktatási anyagokat a tudásbázisba. Támogatott formátumok: PDF, DOCX, TXT, Markdown.
          </p>

          {message && (
            <div className={`mb-4 p-3 rounded ${
              messageType === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-1">
                Fájl kiválasztása *
              </label>
              <input
                id="file-input"
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Támogatott: PDF, DOCX, TXT, Markdown (.md)
              </p>
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Tantárgy *
              </label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Válasszon tantárgyat</option>
                {TASK_OPTIONS.subjects.map((subject) => (
                  <option key={subject.value} value={subject.value}>
                    {subject.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Grade */}
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
                <option value="">Válasszon évfolyamot</option>
                {TASK_OPTIONS.grades.map((grade) => (
                  <option key={grade.value} value={grade.value}>
                    {grade.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Leírás (opcionális)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rövid leírás a dokumentum tartalmáról..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Upload Button */}
            <button
              onClick={uploadDocument}
              disabled={isUploading || !file || !subject}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Feltöltés...
                </>
              ) : (
                'Dokumentum Feltöltése'
              )}
            </button>
          </div>

          {/* Knowledge Base Stats */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Tudásbázis Statisztika</h3>
              <div className="flex gap-2">
                <button
                  onClick={loadStats}
                  disabled={isLoadingStats}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoadingStats ? '...' : 'Frissítés'}
                </button>
                <button
                  onClick={async () => {
                    try {
                      const authHeader = getAuthHeader();
                      const response = await api.get('/rag/debug-metadata', authHeader);
                      console.log('Debug metadata:', response.data);
                      alert('Debug adatok a konzolban (F12)');
                    } catch (error) {
                      console.error('Debug error:', error);
                      alert('Debug hiba - lásd konzol');
                    }
                  }}
                  className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
                >
                  Debug
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Biztosan törli a teljes tudásbázist? Ez a művelet nem visszavonható!')) {
                      resetVectorDB();
                    }
                  }}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  Tudásbázis Törlése
                </button>
              </div>
            </div>

            {isLoadingStats ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Statisztikák betöltése...</p>
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold text-gray-700 mb-2">Általános adatok</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Összes dokumentum:</span>
                      <span className="font-medium">{stats.total_documents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Források száma:</span>
                      <span className="font-medium">{stats.sources_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Embedding dimenzió:</span>
                      <span className="font-medium">{stats.embedding_dimension}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold text-gray-700 mb-2">Tartalom</h4>
                  <div className="text-sm">
                    <div className="mb-2">
                      <span className="text-gray-600">Tantárgyak ({stats.subjects?.length || 0}):</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {stats.subjects && stats.subjects.length > 0 ? stats.subjects.map((subject, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {subject}
                          </span>
                        )) : (
                          <span className="text-gray-400 text-xs">
                            Nincsenek tantárgyak 
                            {stats.total_documents > 0 && ' (dokumentumok metaadatai hiányoznak)'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Évfolyamok ({stats.grades?.length || 0}):</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {stats.grades && stats.grades.length > 0 ? stats.grades.map((grade, idx) => (
                          <span key={idx} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            {grade}. osztály
                          </span>
                        )) : (
                          <span className="text-gray-400 text-xs">
                            Nincsenek évfolyamok
                            {stats.total_documents > 0 && ' (dokumentumok metaadatai hiányoznak)'}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Debug info - remove after testing */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-2 p-2 bg-yellow-50 text-xs">
                        <strong>Debug:</strong> subjects={JSON.stringify(stats.subjects)}, grades={JSON.stringify(stats.grades)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>Nem sikerült betölteni a statisztikákat.</p>
                <button onClick={loadStats} className="text-blue-500 hover:underline text-sm mt-1">
                  Újrapróbálkozás
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default DocumentUploadPage;