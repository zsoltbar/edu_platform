import { useEffect, useState } from "react";
import api from "../lib/api";
import TaskCard from "../components/TaskCard";
import Navbar from "../components/Navbar";

interface Task {
  id: number;
  title: string;
  description: string;
  subject: string;
  class_grade: number;
  difficulty: string;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    api.get("/tasks", authHeader)
      .then(res => setTasks(res.data))
      .catch(err => console.error(err));
    api.get("/users/me", authHeader)
      .then(res => setUsername(res.data.name))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navbar />
      <div className="p-8 max-w-7xl mx-auto">
        {username && (
          <div className="mb-2 text-xl font-semibold text-purple-700">
            Üdvözlünk, {username}!
          </div>
        )}
        <h1 className="text-3xl font-bold mb-4 text-blue-700">Diák Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map(task => (
            <div key={task.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-200">
              <TaskCard task={task} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}