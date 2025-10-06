import { useEffect, useState } from 'react';
import api from '../lib/api';

interface UserScoreData {
  total_score: number;
  task_count: number;
  user_name: string;
}

export default function UserScoreCard() {
  const [scoreData, setScoreData] = useState<UserScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserScore = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const authHeader = { headers: { Authorization: `Bearer ${token}` } };
        const response = await api.get('/scores/my-total', authHeader);
        setScoreData(response.data);
      } catch (err) {
        console.error('Error fetching user score:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserScore();
  }, []);

  if (loading || !scoreData) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl shadow-lg p-6 border border-purple-200">
      <h3 className="text-xl font-bold text-purple-700 mb-4 text-center">
        📊 Az én eredményeim
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-purple-600">
            {scoreData.total_score}
          </div>
          <div className="text-sm text-gray-600">Összes pont</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-600">
            {scoreData.task_count}
          </div>
          <div className="text-sm text-gray-600">Megoldott feladat</div>
        </div>
      </div>
      
      {scoreData.task_count > 0 && (
        <div className="mt-4 pt-4 border-t border-purple-200 text-center">
          <div className="text-sm text-gray-700">
            Átlagos pont: <span className="font-semibold text-purple-600">
              {Math.round(scoreData.total_score / scoreData.task_count)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}