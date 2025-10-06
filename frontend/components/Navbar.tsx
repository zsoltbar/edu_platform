import Link from 'next/link';

interface NavbarProps {
  username?: string;
  onDashboardClick?: () => void;
}

export default function Navbar({ username, onDashboardClick }: NavbarProps) {
  const handleDashboardClick = (e: React.MouseEvent) => {
    if (onDashboardClick) {
      e.preventDefault();
      onDashboardClick();
    }
  };

  return (
    <nav className="bg-gray-800 p-4 text-white flex justify-between items-center">
      <div className="font-bold">OkosTanítás Platform</div>
      {username && (
        <div className="text-lg font-semibold">
          Üdvözlünk, {username}!
        </div>
      )}
      <div className="space-x-4">
        <Link href="/dashboard" onClick={handleDashboardClick}>Dashboard</Link>
        <Link href="/admin/tasks">Tasks</Link>
        <Link href="/admin/users">Users</Link>
      </div>
    </nav>
  );
}