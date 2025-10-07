import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface NavbarProps {
  username?: string;
  userRole?: string;
  onDashboardClick?: () => void;
}

export default function Navbar({ username, userRole, onDashboardClick }: NavbarProps) {
  const { logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const handleDashboardClick = (e: React.MouseEvent) => {
    if (onDashboardClick) {
      e.preventDefault();
      onDashboardClick();
    }
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav className="bg-gray-800 p-4 text-white flex justify-between items-center">
      <div className="font-bold">OkosTanítás Platform</div>
      {username && (
        <div className="relative">
          <button 
            onClick={toggleDropdown}
            className="text-lg font-semibold hover:text-gray-300 cursor-pointer bg-transparent border-none"
          >
            Üdvözlünk, {username}! {userRole && <span className="text-sm opacity-80">({userRole})</span>}
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-10">
              <button 
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md"
              >
                Kilépés
              </button>
            </div>
          )}
        </div>
      )}
      <div className="space-x-4">
        <Link href="/dashboard" onClick={handleDashboardClick} className="hover:text-gray-300">Dashboard</Link>
        <Link href="/ai-chat" className="hover:text-blue-300">AI Chat</Link>
        <Link href="/search" className="hover:text-purple-300">Search</Link>
        {userRole === 'admin' && (
          <>
            <Link href="/admin/tasks" className="hover:text-gray-300">Tasks</Link>
            <Link href="/admin/users" className="hover:text-gray-300">Users</Link>
          </>
        )}
      </div>
    </nav>
  );
}