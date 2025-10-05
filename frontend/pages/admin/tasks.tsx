import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';

interface Task {
  id: number;
  title: string;
  description: string;
}

export default function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const fetchTasks = () => {
    api.get('/tasks')
      .then(res => setTasks(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleCreate = () => {
    api.post('/tasks', { title, description, subject: 'Math', class_grade: 6, difficulty: 'Medium' })
      .then(() => { fetchTasks(); setTitle(''); setDescription(''); })
      .catch(err => console.error(err));
  };

  const handleDelete = (id: number) => {
    api.delete(`/tasks/${id}`)
      .then(() => fetchTasks())
      .catch(err => console.error(err));
  };

  return (
    <div>
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Admin Feladatok</h1>
        <div className="mb-4">
          <input className="border p-2 mr-2" placeholder="Cím" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="border p-2 mr-2" placeholder="Leírás" value={description} onChange={e => setDescription(e.target.value)} />
          <button onClick={handleCreate} className="bg-green-500 text-white px-4 py-2 rounded">Létrehoz</button>
        </div>
        <ul>
          {tasks.map(task => (
            <li key={task.id} className="border p-2 mb-2 flex justify-between">
              <span>{task.title}</span>
              <button onClick={() => handleDelete(task.id)} className="bg-red-500 text-white px-2 rounded">Töröl</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}