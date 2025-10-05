import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../lib/api";

export default function TaskDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [task, setTask] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);

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
    api.post("/ai-tutor", { id: task.id, student_answer: answer }, authHeader)
      .then(res => setExplanation(res.data.explanation))
      .catch(err => console.error(err));
  };

  const handleNextQuestion = () => {
    const token = localStorage.getItem("token");
    const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    api.post("/ai-tutor/next-question", { id: task.id, previous_question: task.title, student_answer: answer }, authHeader)
      .then(res => {
        setExplanation(res.data.explanation);
        setCountdown(5);
        const interval = setInterval(() => {
          setCountdown(prev => {
            if (prev === 1) {
              clearInterval(interval);
              setTask((prevTask: any) => ({ ...prevTask, title: res.data.next_question }));
              setTask((prevTask: any) => ({ ...prevTask, description: res.data.next_description }));
              setAnswer("");
              setExplanation("");
              return null;
            }
            return prev ? prev - 1 : null;
          });
        }, 1000);
      })
      .catch(err => console.error(err));
  };

  if (!task) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-xl">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded transition"
        >
          Vissza a Dashboardra
        </button>
        <h1 className="text-2xl font-bold text-purple-700 mb-2">
          {task.title}
        </h1>
        <p className="my-4 text-gray-700">{task.description}</p>
        <textarea
          className="border p-2 w-full rounded mb-2 focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
          placeholder="Írd ide a válaszod..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <button
          onClick={handleNextQuestion}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded mt-2 ml-2 transition"
        >
          Ellenőrzés és Következő kérdés
        </button>
        {explanation && (
          <div className="mt-4 p-4 border rounded bg-gray-100">
            <strong>Magyarázat:</strong> {explanation}
            {countdown !== null && (
              <div className="mt-2 text-lg text-center text-purple-700">
                Következő kérdés {countdown} másodperc múlva...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
