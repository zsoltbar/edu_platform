import { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import { FormField, SelectField } from '../../components/forms';
import { useAuth } from '../../hooks/useAuth';
import { useFormState } from '../../hooks/useFormState';
import { Task, TaskFormData } from '../../types';
import { TASK_OPTIONS, DEFAULT_VALUES, API_ENDPOINTS } from '../../constants';
import { getValidationRules } from '../../utils/validation';

export default function AdminTasks() {
  const { currentUser, loading, getAuthHeader } = useAuth(true); // Require admin access
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<{ [subject: string]: boolean }>({});

  // Form validation rules
  const validationRules = useMemo(() => ({
    title: getValidationRules().title,
    description: getValidationRules().description,
    subject: { required: false },
    class_grade: { required: false },
    difficulty: { required: false }
  }), []);

  // New task form
  const newTaskForm = useFormState<TaskFormData>({
    initialValues: DEFAULT_VALUES.task,
    validationRules,
    onSubmit: handleCreateNewTask
  });

  // Edit task form
  const editTaskForm = useFormState<TaskFormData>({
    initialValues: DEFAULT_VALUES.task,
    validationRules,
    onSubmit: handleSaveEdit
  });

  const fetchTasks = useCallback(async () => {
    try {
      const response = await api.get(API_ENDPOINTS.tasks.list, getAuthHeader());
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert('Hiba a feladatok betöltése során');
    }
  }, [getAuthHeader]);

  useEffect(() => {
    if (!loading && currentUser) {
      fetchTasks();
    }
  }, [loading, currentUser, fetchTasks]);

  async function handleCreateNewTask(values: TaskFormData) {
    try {
      await api.post(
        API_ENDPOINTS.tasks.create,
        {
          title: values.title.trim(),
          description: values.description.trim(),
          subject: values.subject,
          class_grade: values.class_grade,
          difficulty: values.difficulty
        },
        getAuthHeader()
      );
      
      await fetchTasks();
      newTaskForm.reset();
      setShowNewTaskForm(false);
      alert('Feladat sikeresen létrehozva!');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Hiba a feladat létrehozása során');
    }
  }

  const cancelNewTaskForm = useCallback(() => {
    newTaskForm.reset();
    setShowNewTaskForm(false);
  }, [newTaskForm]);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a feladatot?')) {
      return;
    }
    
    try {
      await api.delete(API_ENDPOINTS.tasks.delete(id), getAuthHeader());
      await fetchTasks();
      alert('Feladat sikeresen törölve!');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Hiba a feladat törlése során');
    }
  }, [getAuthHeader, fetchTasks]);

  const handleEdit = useCallback((task: Task) => {
    setEditId(task.id);
    editTaskForm.reset({
      title: task.title,
      description: task.description,
      subject: task.subject,
      class_grade: task.class_grade,
      difficulty: task.difficulty
    });
  }, [editTaskForm]);

  const cancelEdit = useCallback(() => {
    setEditId(null);
    editTaskForm.reset();
  }, [editTaskForm]);

  async function handleSaveEdit(values: TaskFormData) {
    if (!editId) return;
    
    try {
      await api.put(
        API_ENDPOINTS.tasks.update(editId),
        {
          title: values.title.trim(),
          description: values.description.trim(),
          subject: values.subject,
          class_grade: values.class_grade,
          difficulty: values.difficulty
        },
        getAuthHeader()
      );
      
      await fetchTasks();
      cancelEdit();
      alert('Feladat sikeresen frissítve!');
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Hiba a feladat frissítése során');
    }
  }

  // Group tasks by subject
  const groupedTasks = useMemo(() => {
    return tasks.reduce((acc, task) => {
      if (!acc[task.subject]) acc[task.subject] = [];
      acc[task.subject].push(task);
      return acc;
    }, {} as { [subject: string]: Task[] });
  }, [tasks]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 flex items-center justify-center">
        <div className="text-xl">Betöltés...</div>
      </div>
    );
  }

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
                <FormField
                  label="Cím"
                  name="title"
                  value={newTaskForm.values.title}
                  onChange={(value) => newTaskForm.setField('title', value)}
                  onBlur={() => newTaskForm.setTouched('title')}
                  placeholder="Feladat címe"
                  required
                  error={newTaskForm.errors.title}
                  className="md:col-span-2"
                />
                <FormField
                  label="Leírás"
                  name="description"
                  type="textarea"
                  value={newTaskForm.values.description}
                  onChange={(value) => newTaskForm.setField('description', value)}
                  onBlur={() => newTaskForm.setTouched('description')}
                  placeholder="Feladat részletes leírása"
                  rows={3}
                  required
                  error={newTaskForm.errors.description}
                  className="md:col-span-2"
                />
                <SelectField
                  label="Tantárgy"
                  name="subject"
                  value={newTaskForm.values.subject}
                  onChange={(value) => newTaskForm.setField('subject', value)}
                  options={TASK_OPTIONS.subjects}
                />
                <SelectField
                  label="Osztály"
                  name="class_grade"
                  value={newTaskForm.values.class_grade}
                  onChange={(value) => newTaskForm.setField('class_grade', Number(value))}
                  options={TASK_OPTIONS.grades}
                />
                <SelectField
                  label="Nehézség"
                  name="difficulty"
                  value={newTaskForm.values.difficulty}
                  onChange={(value) => newTaskForm.setField('difficulty', value)}
                  options={TASK_OPTIONS.difficulties}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={cancelNewTaskForm}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition duration-200"
                >
                  Mégse
                </button>
                <button
                  onClick={newTaskForm.handleSubmit}
                  disabled={newTaskForm.isSubmitting || newTaskForm.hasErrors}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
                >
                  {newTaskForm.isSubmitting ? 'Létrehozás...' : 'Létrehozás'}
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
                          <FormField
                            label="Cím"
                            name="title"
                            value={editTaskForm.values.title}
                            onChange={(value) => editTaskForm.setField('title', value)}
                            onBlur={() => editTaskForm.setTouched('title')}
                            required
                            error={editTaskForm.errors.title}
                            className="md:col-span-2"
                          />
                          <FormField
                            label="Leírás"
                            name="description"
                            type="textarea"
                            value={editTaskForm.values.description}
                            onChange={(value) => editTaskForm.setField('description', value)}
                            onBlur={() => editTaskForm.setTouched('description')}
                            rows={3}
                            required
                            error={editTaskForm.errors.description}
                            className="md:col-span-2"
                          />
                          <SelectField
                            label="Tantárgy"
                            name="subject"
                            value={editTaskForm.values.subject}
                            onChange={(value) => editTaskForm.setField('subject', value)}
                            options={TASK_OPTIONS.subjects}
                          />
                          <SelectField
                            label="Osztály"
                            name="class_grade"
                            value={editTaskForm.values.class_grade}
                            onChange={(value) => editTaskForm.setField('class_grade', Number(value))}
                            options={TASK_OPTIONS.grades}
                          />
                          <SelectField
                            label="Nehézség"
                            name="difficulty"
                            value={editTaskForm.values.difficulty}
                            onChange={(value) => editTaskForm.setField('difficulty', value)}
                            options={TASK_OPTIONS.difficulties}
                          />
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition duration-200"
                          >
                            Mégse
                          </button>
                          <button
                            onClick={editTaskForm.handleSubmit}
                            disabled={editTaskForm.isSubmitting || editTaskForm.hasErrors}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
                          >
                            {editTaskForm.isSubmitting ? 'Mentés...' : 'Mentés'}
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