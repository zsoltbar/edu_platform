import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
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
  // New task form states
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSubject, setNewSubject] = useState('Magyar');
  const [newClassGrade, setNewClassGrade] = useState(8);
  const [newDifficulty, setNewDifficulty] = useState('Közepes');
  // Edit task form states
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSubject, setEditSubject] = useState('Magyar');
  const [editClassGrade, setEditClassGrade] = useState(8);
  const [editDifficulty, setEditDifficulty] = useState('Közepes');
  const [collapsed, setCollapsed] = useState<{ [subject: string]: boolean }>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchTasks = () => {
    api.get('/tasks', getAuthHeader())
      .then(res => setTasks(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/");
      return;
    }
    
    const authHeader = getAuthHeader();
    
    // Fetch current user info
    api.get("/users/me", authHeader)
      .then(res => setCurrentUser(res.data))
      .catch(err => console.error(err));
    
    fetchTasks();
  }, [router]);

  const handleCreateNewTask = () => {
    // Validation
    if (!newTitle.trim()) {
      alert("A cím nem lehet üres!");
      return;
    }
    if (!newDescription.trim()) {
      alert("A leírás nem lehet üres!");
      return;
    }

    api.post(
      '/tasks',
      { 
        title: newTitle.trim(), 
        description: newDescription.trim(), 
        subject: newSubject, 
        class_grade: newClassGrade, 
        difficulty: newDifficulty 
      },
      getAuthHeader()
    )
      .then(() => { 
        fetchTasks(); 
        // Reset form
        setNewTitle('');
        setNewDescription('');
        setNewSubject('Magyar');
        setNewClassGrade(8);
        setNewDifficulty('Közepes');
        setShowNewTaskForm(false);
        alert("Feladat sikeresen létrehozva!");
      })
      .catch(err => {
        console.error(err);
        alert("Hiba a feladat létrehozása során");
      });
  };

  const cancelNewTaskForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewSubject('Magyar');
    setNewClassGrade(8);
    setNewDifficulty('Közepes');
    setShowNewTaskForm(false);
  };

  const handleDelete = (id: number) => {
    api.delete(`/tasks/${id}`, getAuthHeader())
      .then(() => fetchTasks())
      .catch(err => console.error(err));
  };

  const handleEdit = (task: Task) => {
    setEditId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditSubject(task.subject || "Magyar");
    setEditClassGrade(task.class_grade || 8);
    setEditDifficulty(task.difficulty || "Közepes");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTitle('');
    setEditDescription('');
    setEditSubject('Magyar');
    setEditClassGrade(8);
    setEditDifficulty('Közepes');
  };

  const handleSaveEdit = () => {
    // Validation
    if (!editTitle.trim()) {
      alert("A cím nem lehet üres!");
      return;
    }
    if (!editDescription.trim()) {
      alert("A leírás nem lehet üres!");
      return;
    }

    api.put(
      `/tasks/${editId}`,
      { 
        title: editTitle.trim(), 
        description: editDescription.trim(), 
        subject: editSubject, 
        class_grade: editClassGrade, 
        difficulty: editDifficulty 
      },
      getAuthHeader()
    )
      .then(() => {
        fetchTasks();
        cancelEdit();
        alert("Feladat sikeresen frissítve!");
      })
      .catch(err => {
        console.error(err);
        alert("Hiba a feladat frissítése során");
      });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100">
      <Navbar username={currentUser?.name} userRole={currentUser?.role} />
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-purple-700">Feladatok kezelése</h1>
        
        {/* New Task Section */}
        <div className="mb-6">
          {!showNewTaskForm ? (
            <button
              onClick={() => setShowNewTaskForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 flex items-center"
            >
              <span className="mr-2">+</span>
              Új feladat létrehozása
            </button>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 text-green-700">Új feladat létrehozása</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cím *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Feladat címe"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leírás *
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Feladat részletes leírása"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tantárgy
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Magyar">Magyar</option>
                    <option value="Matematika">Matematika</option>
                    <option value="Történelem">Történelem</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Osztály
                  </label>
                  <select
                    value={newClassGrade}
                    onChange={(e) => setNewClassGrade(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value={4}>4. osztály</option>
                    <option value={6}>6. osztály</option>
                    <option value={8}>8. osztály</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nehézség
                  </label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Könnyű">Könnyű</option>
                    <option value="Közepes">Közepes</option>
                    <option value="Nehéz">Nehéz</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={cancelNewTaskForm}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition duration-200"
                >
                  Mégse
                </button>
                <button
                  onClick={handleCreateNewTask}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
                >
                  Létrehozás
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Grouped and collapsible tasks */}
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
              <ul className="space-y-5 flex flex-col">
                {subjectTasks.map(task => (
                  <li key={task.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    {editId === task.id ? (
                      // Edit mode
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-blue-700">Feladat szerkesztése</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Cím *
                            </label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Leírás *
                            </label>
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={3}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tantárgy
                            </label>
                            <select
                              value={editSubject}
                              onChange={(e) => setEditSubject(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="Magyar">Magyar</option>
                              <option value="Matematika">Matematika</option>
                              <option value="Történelem">Történelem</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Osztály
                            </label>
                            <select
                              value={editClassGrade}
                              onChange={(e) => setEditClassGrade(Number(e.target.value))}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value={4}>4. osztály</option>
                              <option value={6}>6. osztály</option>
                              <option value={8}>8. osztály</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nehézség
                            </label>
                            <select
                              value={editDifficulty}
                              onChange={(e) => setEditDifficulty(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="Könnyű">Könnyű</option>
                              <option value="Közepes">Közepes</option>
                              <option value="Nehéz">Nehéz</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition duration-200"
                          >
                            Mégse
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
                          >
                            Mentés
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-lg text-purple-800 break-words">{task.title}</div>
                          <div className="text-gray-600 text-sm mt-1 break-words">{task.description}</div>
                          <div className="text-xs text-gray-400 mt-2">
                            {task.subject} • {task.class_grade}. osztály • {task.difficulty}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4 shrink-0">
                          <button 
                            onClick={() => handleEdit(task)} 
                            className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded transition"
                          >
                            Szerkeszt
                          </button>
                          <button 
                            onClick={() => handleDelete(task.id)} 
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition"
                          >
                            Töröl
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}