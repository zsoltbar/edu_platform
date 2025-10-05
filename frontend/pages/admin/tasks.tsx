import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';

interface Task {
  id: number;
  title: string;
  description: string;
  subject: string;
  class_grade: number;
  difficulty: string;
}

export default function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('Magyar');
  const [classGrade, setClassGrade] = useState(8);
  const [difficulty, setDifficulty] = useState('Közepes');
  const [editId, setEditId] = useState<number | null>(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchTasks = () => {
    api.get('/tasks', getAuthHeader())
      .then(res => setTasks(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleCreate = () => {
    api.post(
      '/tasks',
      { title, description, subject, class_grade: classGrade, difficulty },
      getAuthHeader()
    )
      .then(() => { fetchTasks(); setTitle(''); setDescription(''); })
      .catch(err => console.error(err));
  };

  const handleDelete = (id: number) => {
    api.delete(`/tasks/${id}`, getAuthHeader())
      .then(() => fetchTasks())
      .catch(err => console.error(err));
  };

  const handleEdit = (task: Task) => {
    setEditId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setSubject(task.subject || "Magyar");
    setClassGrade(task.class_grade || 8);
    setDifficulty(task.difficulty || "Közepes");
  };

  const handleSave = () => {
    api.put(
      `/tasks/${editId}`,
      { title, description, subject, class_grade: classGrade, difficulty },
      getAuthHeader()
    )
      .then(() => {
        fetchTasks();
        setEditId(null);
        setTitle('');
        setDescription('');
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100">
      <Navbar />
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-purple-700 text-center">Admin Feladatok</h1>
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6 flex flex-wrap gap-4 items-center">
          <input className="border p-2 rounded w-40" placeholder="Cím" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="border p-2 rounded w-56" placeholder="Leírás" value={description} onChange={e => setDescription(e.target.value)} />
          <select className="border p-2 rounded w-32" value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="Magyar">Magyar</option>
            <option value="Matematika">Matematika</option>
            <option value="Történelem">Történelem</option>
          </select>
          <select className="border p-2 rounded w-24" value={classGrade} onChange={e => setClassGrade(Number(e.target.value))}>
            <option value={4}>4</option>
            <option value={6}>6</option>
            <option value={8}>8</option>
          </select>
          <select className="border p-2 rounded w-28" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="Könnyű">Könnyű</option>
            <option value="Közepes">Közepes</option>
            <option value="Nehéz">Nehéz</option>
          </select>
          {editId ? (
            <button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">Mentés</button>
          ) : (
            <button onClick={handleCreate} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition">Létrehoz</button>
          )}
        </div>
        <ul className="space-y-4">
          {tasks.map(task => (
            <li key={task.id} className="bg-white rounded-xl shadow-md p-4 flex justify-between items-center hover:shadow-lg transition-shadow">
              <div>
                <div className="font-semibold text-lg text-purple-800">{task.title}</div>
                <div className="text-gray-600 text-sm">{task.description}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {task.subject} • {task.class_grade}. osztály • {task.difficulty}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(task)} className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded transition">Szerkeszt</button>
                <button onClick={() => handleDelete(task.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition">Töröl</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}