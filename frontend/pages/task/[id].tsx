import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";

export default function TaskDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [task, setTask] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [tutorReply, setTutorReply] = useState<any>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [scoreSum, setScoreSum] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);

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
        setTutorReply(res.data);
        setExplanation(res.data.explanation);
        
        // divide score by 2 if hint was used
        let score = Number(res.data.score) || 0;
        if (hintVisible && score > 0) {
          score = Math.floor(score / 2);
        }

        setScoreSum(prev => prev + score);
        setLastScore(score);
        setShowNextButton(true);
      })
      .catch(err => {
        setButtonDisabled(false);
        console.error(err);
      });
  };

  const saveScore = async (taskId: number, score: number) => {
    try {
      const token = localStorage.getItem("token");
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };
      
      await api.post("/scores/save", { 
        task_id: taskId, 
        score: score 
      }, authHeader);
      
      console.log(`Score ${score} saved for task ${taskId}`);
    } catch (error) {
      console.error("Error saving score:", error);
      // Don't show error to user, just log it
    }
  };

  const saveFinalScoreAndNavigate = async (path: string) => {
    // Save the current score if there is one
    if (lastScore !== null && task?.id) {
      await saveScore(task.id, lastScore);
    }
    
    // Navigate to the specified path
    router.push(path);
  };

  const handleLoadNext = () => {
    // Save the current score before loading next question
    if (lastScore !== null && task?.id) {
      saveScore(task.id, lastScore);
    }
    
    setTask((prevTask: any) => ({ ...prevTask, title: tutorReply.next_question }));
    setTask((prevTask: any) => ({ ...prevTask, description: tutorReply.next_description }));
    setHintVisible(false);
    setAnswer("");
    setExplanation("");
    setButtonDisabled(false);
    setShowNextButton(false);
  };

  if (!task) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative">
      <Navbar 
        username={username} 
        onDashboardClick={() => saveFinalScoreAndNavigate('/dashboard')}
      />
      <div className="absolute top-20 right-8 z-10">
        <div className="bg-purple-600 text-white px-4 py-2 rounded-full shadow font-bold text-lg">
          Pontszám: {scoreSum}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-xl mx-auto mt-8">
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
        {!showNextButton && (
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
        )}
        {showNextButton && (
          <button
            onClick={handleLoadNext}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mt-2 ml-2 transition"
          >
            Következő kérdés betöltése
          </button>
        )}
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
          </div>
        )}
      </div>
    </div>
  );
}
