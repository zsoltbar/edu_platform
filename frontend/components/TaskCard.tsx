interface TaskProps {
  task: {
    id: number;
    title: string;
    description: string;
  }
}

export default function TaskCard({ task }: TaskProps) {
  return (
    <div className="border p-4 rounded shadow hover:shadow-lg transition">
      <h2 className="font-bold text-xl">{task.title}</h2>
      <p>{task.description}</p>
      <a href={`/task/${task.id}`} className="text-blue-500 mt-2 inline-block">Részletek</a>
    </div>
  );
}
