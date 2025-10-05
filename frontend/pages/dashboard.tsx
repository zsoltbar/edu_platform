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
    <div>
      <Navbar />
      <div className="p-8">
        {username && (
          <div className="mb-2 text-xl font-semibold">
            Üdvözlünk, {username}!
          </div>
        )}
        <h1 className="text-3xl font-bold mb-4">Diák Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => <TaskCard key={task.id} task={task} />)}
        </div>
      </div>
    </div>
  );
}