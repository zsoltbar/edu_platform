import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4 text-white flex justify-between">
      <div className="font-bold">OkosTanítás Platform</div>
      <div className="space-x-4">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/admin/tasks">Admin</Link>
      </div>
    </nav>
  );
}