import { useEffect, useState } from 'react';
import api from '../lib/api';

interface LeaderboardEntry {
  user_name: string;
  total_score: number;
  task_count: number;
}

interface LeaderboardProps {
  limit?: number;
}

export default function Leaderboard({ limit = 10 }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/scores/leaderboard?limit=${limit}`);
        setLeaderboard(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Hiba a ranglista betöltése során');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [limit]);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${position}.`;
    }
  };

  const getRankStyle = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300';
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-purple-700 mb-4 text-center">
          🏆 Ranglista
        </h2>
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500">Betöltés...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-purple-700 mb-4 text-center">
          🏆 Ranglista
        </h2>
        <div className="text-center py-8 text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-purple-700 mb-4 text-center">
        🏆 Ranglista
      </h2>
      
      {leaderboard.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Még nincsenek eredmények
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const position = index + 1;
            return (
              <div
                key={entry.user_name}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${getRankStyle(position)}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-xl font-bold min-w-[2rem] text-center">
                    {getRankIcon(position)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">
                      {entry.user_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {entry.task_count} feladat megoldva
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xl font-bold text-purple-600">
                    {entry.total_score}
                  </div>
                  <div className="text-sm text-gray-600">pont</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {leaderboard.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
          Top {leaderboard.length} játékos
        </div>
      )}
    </div>
  );
}