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
  const [username, setUsername] = useState<string>("");
  const [scoreSum, setScoreSum] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);

  // Countdown duration in seconds before showing the next question.
  // Increased from 5 to 10 seconds to give students more time to review the explanation.
  const NEXT_QUESTION_COUNTDOWN = 10;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/");
      return;
    }
    api.get("/users/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUsername(res.data.name))
      .catch(err => {});
    if (id) {
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };
      api.get(`/tasks/${id}`, authHeader)
        .then(res => setTask(res.data))
        .catch(err => console.error(err));
    }
  }, [id, router]);

  const handleAITutor = () => {
    const token = localStorage.getItem("token");
    const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    api.post("/ai-tutor", { id: task.id, student_answer: answer }, authHeader)
      .then(res => setExplanation(res.data.explanation))
      .catch(err => console.error(err));
  };

  const handleNextQuestion = () => {
    setButtonDisabled(true);
    const token = localStorage.getItem("token");
    const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    api.post("/ai-tutor/next-question", { id: task.id, previous_question: task.title, student_answer: answer }, authHeader)
      .then(res => {
        setExplanation(res.data.explanation);

        // divide score by 2 if hint was used
        let score = Number(res.data.score) || 0;
        if (hintVisible && score > 0) {
          score = Math.floor(score / 2);
        }

        setScoreSum(prev => prev + score);
        setLastScore(score);
        setCountdown(NEXT_QUESTION_COUNTDOWN);
        const interval = setInterval(() => {
          setCountdown(prev => {
            if (prev === 1) {
              clearInterval(interval);
              setTask((prevTask: any) => ({ ...prevTask, title: res.data.next_question }));
              setTask((prevTask: any) => ({ ...prevTask, description: res.data.next_description }));
              setHintVisible(false);
              setAnswer("");
              setExplanation("");
              setButtonDisabled(false); // Enable button after new question appears
              return null;
            }
            return prev ? prev - 1 : null;
          });
        }, 1000);
      })
      .catch(err => {
        setButtonDisabled(false);
        console.error(err);
      });
  };

  if (!task) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative">
      <div className="absolute top-6 right-8 z-10">
        <div className="bg-purple-600 text-white px-4 py-2 rounded-full shadow font-bold text-lg">
          Pontszám: {scoreSum}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-xl mx-auto mt-8">
        {username && (
          <div className="mb-4 text-xl font-semibold text-purple-700 text-center">
            {username}
          </div>
        )}
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded transition"
        >
          Vissza a Dashboardra
        </button>
        <h1 className="text-2xl font-bold text-purple-700 mb-2">
          {task.title}
        </h1>
        <div className="flex items-center mb-2">
          <button
            onClick={() => setHintVisible(true)}
            disabled={hintVisible}
            className={`mr-2 px-3 py-1 rounded bg-yellow-300 hover:bg-yellow-400 text-purple-900 font-semibold transition ${hintVisible ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Tipp megjelenítése
          </button>
          {hintVisible && (
            <span className="ml-2 text-gray-700 font-medium">Tipp: {task.description}</span>
          )}
        </div>
        <textarea
          className="border p-2 w-full rounded mb-2 focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
          placeholder="Írd ide a válaszod..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <button
          onClick={handleNextQuestion}
          className={`bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded mt-2 ml-2 transition ${
            buttonDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={buttonDisabled || !answer.trim()}
        >
          {buttonDisabled
            ? "Betöltés..."
            : !answer.trim()
            ? "Írd be a válaszod"
            : "Ellenőrzés és Következő kérdés"}
        </button>
        {explanation && (
          <div className="mt-4 p-4 border rounded bg-gray-100">
            <strong>Magyarázat:</strong> {explanation}
            {lastScore !== null && (
                <div
                className={`mt-2 text-lg text-center ${
                  hintVisible
                  ? "text-red-600"
                  : "text-green-600"
                }`}
                >
                Elért pontszám: {lastScore}
                </div>
            )}
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
