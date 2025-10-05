import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

interface StatChartProps {
  data: { name: string, score: number }[];
}

export default function StatChart({ data }: StatChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="score" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
