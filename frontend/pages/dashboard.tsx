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
  const [collapsed, setCollapsed] = useState<{ [subject: string]: boolean }>({});

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

  // Group tasks by subject
  const groupedTasks: { [subject: string]: Task[] } = tasks.reduce((acc, task) => {
    if (!acc[task.subject]) acc[task.subject] = [];
    acc[task.subject].push(task);
    return acc;
  }, {} as { [subject: string]: Task[] });

  // Collapse all groups by default when tasks change
  useEffect(() => {
    const initialCollapsed: { [subject: string]: boolean } = {};
    Object.keys(groupedTasks).forEach(subject => {
      initialCollapsed[subject] = true;
    });
    setCollapsed(initialCollapsed);
  }, [tasks]);

  const toggleCollapse = (subject: string) => {
    setCollapsed(prev => ({ ...prev, [subject]: !prev[subject] }));
  };

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
        {/* Display tasks grouped by subject, collapsible */}
        {Object.entries(groupedTasks).map(([subject, subjectTasks]) => (
          <div key={subject} className="mb-8">
            <button
              onClick={() => toggleCollapse(subject)}
              className="w-full text-left text-2xl font-semibold mb-4 text-purple-800 bg-purple-100 rounded px-4 py-2 hover:bg-purple-200 transition flex items-center justify-between"
            >
              <span>{subject}</span>
              <span className="ml-2 text-lg">{collapsed[subject] ? "▼" : "▲"}</span>
            </button>
            {!collapsed[subject] && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjectTasks.map(task => (
                  <div key={task.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-200">
                    <TaskCard task={task} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}