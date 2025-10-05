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

  useEffect(() => {
    api.get("/tasks")
      .then(res => setTasks(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <Navbar />
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Diák Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => <TaskCard key={task.id} task={task} />)}
        </div>
      </div>
    </div>
  );
}