import Link from 'next/link';

interface NavbarProps {
  username?: string;
}

export default function Navbar({ username }: NavbarProps) {
  return (
    <nav className="bg-gray-800 p-4 text-white flex justify-between items-center">
      <div className="font-bold">OkosTanítás Platform</div>
      {username && (
        <div className="text-lg font-semibold">
          Üdvözlünk, {username}!
        </div>
      )}
      <div className="space-x-4">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/admin/tasks">Admin</Link>
      </div>
    </nav>
  );
}