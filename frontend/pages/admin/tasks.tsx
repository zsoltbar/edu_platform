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
    <div>
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Admin Feladatok</h1>
        <div className="mb-4">
          <input className="border p-2 mr-2" placeholder="Cím" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="border p-2 mr-2" placeholder="Leírás" value={description} onChange={e => setDescription(e.target.value)} />
          <select className="border p-2 mr-2" value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="Magyar">Magyar</option>
            <option value="Matematika">Matematika</option>
            <option value="Történelem">Történelem</option>
          </select>
          <select className="border p-2 mr-2" value={classGrade} onChange={e => setClassGrade(Number(e.target.value))}>
            <option value={4}>4</option>
            <option value={6}>6</option>
            <option value={8}>8</option>
          </select>
          <select className="border p-2 mr-2" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="Könnyű">Könnyű</option>
            <option value="Közepes">Közepes</option>
            <option value="Nehéz">Nehéz</option>
          </select>
          {editId ? (
            <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded">Mentés</button>
          ) : (
            <button onClick={handleCreate} className="bg-green-500 text-white px-4 py-2 rounded">Létrehoz</button>
          )}
        </div>
        <ul>
          {tasks.map(task => (
            <li key={task.id} className="border p-2 mb-2 flex justify-between">
              <span>{task.title}</span>
              <div>
                <button onClick={() => handleEdit(task)} className="bg-yellow-500 text-white px-2 rounded mr-2">Szerkeszt</button>
                <button onClick={() => handleDelete(task.id)} className="bg-red-500 text-white px-2 rounded">Töröl</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}