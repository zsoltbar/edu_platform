import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../lib/api";

export default function TaskDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [task, setTask] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [explanation, setExplanation] = useState("");

  useEffect(() => {
    if (id) {
      const token = localStorage.getItem("token");
      const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      api.get(`/tasks/${id}`, authHeader)
        .then(res => setTask(res.data))
        .catch(err => console.error(err));
    }
  }, [id]);

  const handleAITutor = () => {
    const token = localStorage.getItem("token");
    const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    api.post("/ai-tutor", { question: task.description, student_answer: answer }, authHeader)
      .then(res => setExplanation(res.data.explanation))
      .catch(err => console.error(err));
  };

  if (!task) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{task.title}</h1>
      <p className="my-4">{task.description}</p>
      <textarea
        className="border p-2 w-full"
        placeholder="Írd ide a válaszod..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <button
        onClick={handleAITutor}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
      >
        AI Tutor
      </button>
      {explanation && (
        <div className="mt-4 p-4 border rounded bg-gray-100">
          <strong>Magyarázat:</strong> {explanation}
        </div>
      )}
    </div>
  );
}
