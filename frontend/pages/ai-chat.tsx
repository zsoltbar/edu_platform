import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import { useRouter } from 'next/router';
import api from '../lib/api';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    content: string;
    grade: string;
    source: string;
    subject: string;
    score: number;
    chapter_title?: string;
    chapter_number?: string;
    topics?: string[];
    content_type?: string;
  }>;
}

interface RAGResponse {
  answer: string;
  query: string;
  context_used: boolean;
  num_sources: number;
  model_used: string;
  sources?: Array<{
    content: string;
    grade: string;
    source: string;
    subject: string;
    score: number;
    chapter_title?: string;
    chapter_number?: string;
    topics?: string[];
    content_type?: string;
  }>;
}

const AIChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser, loading, getAuthHeader } = useAuth();
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const authHeader = getAuthHeader();
      const response = await api.post('/rag/query', {
        query: inputMessage,
        context_k: 5,
        max_tokens: 1000,
        temperature: 0.7,
        include_sources: true,
      }, authHeader);

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const ragResponse: RAGResponse = response.data;

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: ragResponse.answer,
        timestamp: new Date(),
        sources: ragResponse.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: 'Sajnos hiba történt a válasz generálása során. Kérjük, próbálja újra később.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md h-[80vh] flex flex-col">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">AI Tanár Asszisztens</h1>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    showSources 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => setShowSources(!showSources)}
                >
                  {showSources ? 'Források elrejtése' : 'Források mutatása'}
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Kérdezzen bármit az iskolai tananyaggal kapcsolatban!
            </p>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden p-4">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-white rounded-lg border">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">🤖</div>
                  <p>Kezdjen el beszélgetni az AI tanár asszisztenssel!</p>
                  <p className="text-sm mt-2">
                    Példa kérdések: &quot;Mi a Pitagorasz tétel?&quot;, &quot;Hogyan működik a fotoszintézis?&quot;
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {message.type === 'assistant' && showSources && (
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <div className="text-xs font-semibold mb-2">
                          Források ({message.sources?.length || 0}):
                        </div>
                        {message.sources && message.sources.length > 0 ? (
                          message.sources.slice(0, 3).map((source, idx) => (
                            <div key={idx} className="text-xs bg-white p-3 rounded-lg mb-2 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1">
                                  {source.subject && (
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                                      {source.subject}
                                    </span>
                                  )}
                                  {source.grade && (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs">
                                      {source.grade}. osztály
                                    </span>
                                  )}
                                  {source.content_type === 'chapter' && (
                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-xs font-medium">
                                      📖 Fejezet
                                    </span>
                                  )}
                                </div>
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-md text-xs font-medium">
                                  {Math.round(source.score * 100)}% relevancia
                                </span>
                              </div>
                              
                              {/* Chapter information */}
                              {(source.chapter_title || source.chapter_number) && (
                                <div className="mb-2 p-2 bg-gray-50 rounded border-l-4 border-blue-400">
                                  <div className="font-semibold text-gray-700 text-sm">
                                    {source.chapter_number && `${source.chapter_number}. `}
                                    {source.chapter_title || 'Fejezet'}
                                  </div>
                                  {source.topics && source.topics.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {source.topics.slice(0, 3).map((topic, topicIdx) => (
                                        <span 
                                          key={topicIdx}
                                          className="bg-blue-50 text-blue-700 px-1 py-0.5 rounded text-xs"
                                        >
                                          {topic}
                                        </span>
                                      ))}
                                      {source.topics.length > 3 && (
                                        <span className="text-gray-500 text-xs">
                                          +{source.topics.length - 3} több
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="text-gray-600 text-sm">
                                {source.content.substring(0, source.chapter_title ? 200 : 150)}
                                {source.content.length > (source.chapter_title ? 200 : 150) && '...'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs bg-yellow-50 text-yellow-800 p-2 rounded">
                            Nem találtam RAG dokumentumot - a válasz általános tudáson alapul
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 rounded-lg p-3 max-w-[70%]">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span>AI válaszol...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Írja be kérdését..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Küldés...' : 'Küldés'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default AIChatPage;