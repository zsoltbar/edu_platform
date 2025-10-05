import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingUserName, setEditingUserName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/");
      return;
    }

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };
    
    // Get current user info
    api.get("/users/me", authHeader)
      .then(res => {
        setCurrentUser(res.data);
        // Check if user is admin
        if (res.data.role !== "admin") {
          alert("Hozzáférés megtagadva! Csak adminisztrátorok férhetnek hozzá.");
          router.replace("/dashboard");
          return;
        }
      })
      .catch(err => {
        console.error(err);
        router.replace("/");
      });

    // Get all users
    api.get("/users", authHeader)
      .then(res => {
        setUsers(res.data);
        setFilteredUsers(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        alert("Hiba a felhasználók betöltése során");
      });
  }, [router]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        user =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Biztosan törölni szeretnéd ezt a felhasználót: ${userName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };
      
      await api.delete(`/users/${userId}`, authHeader);
      
      // Remove user from state
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers.filter(
        user =>
          searchTerm === "" ||
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
      ));
      
      alert("Felhasználó sikeresen törölve!");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Hiba a felhasználó törlése során");
    }
  };

  const handleRoleChange = async (userId: number, newRole: string, userName: string) => {
    try {
      const token = localStorage.getItem("token");
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };
      
      await api.put(`/users/${userId}/role`, { role: newRole }, authHeader);
      
      // Update user role in state
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      );
      setUsers(updatedUsers);
      
      // Also update filtered users
      const updatedFilteredUsers = filteredUsers.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      );
      setFilteredUsers(updatedFilteredUsers);
      
      alert(`${userName} szerepköre sikeresen frissítve: ${getRoleDisplayName(newRole)}`);
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Hiba a szerepkör frissítése során");
    }
  };

  const startEditingName = (userId: number, currentName: string) => {
    setEditingUserId(userId);
    setEditingUserName(currentName);
  };

  const cancelEditingName = () => {
    setEditingUserId(null);
    setEditingUserName("");
  };

  const handleNameUpdate = async (userId: number) => {
    if (!editingUserName.trim()) {
      alert("A név nem lehet üres!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };
      
      await api.put(`/users/${userId}/name`, { name: editingUserName.trim() }, authHeader);
      
      // Update user name in state
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, name: editingUserName.trim() } : user
      );
      setUsers(updatedUsers);
      
      // Also update filtered users
      const updatedFilteredUsers = filteredUsers.map(user => 
        user.id === userId ? { ...user, name: editingUserName.trim() } : user
      );
      setFilteredUsers(updatedFilteredUsers);
      
      setEditingUserId(null);
      setEditingUserName("");
      alert("Felhasználó neve sikeresen frissítve!");
    } catch (error) {
      console.error("Error updating user name:", error);
      alert("Hiba a név frissítése során");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "teacher":
        return "bg-blue-100 text-blue-800";
      case "student":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "Adminisztrátor";
      case "teacher":
        return "Tanár";
      case "student":
        return "Diák";
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-xl">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navbar username={currentUser?.name} />
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-blue-700">Felhasználók kezelése</h1>
        
        {/* Search bar */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <input
            type="text"
            placeholder="Keresés név, email vagy szerepkör alapján..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Users count */}
        <div className="mb-4 text-gray-600">
          Összesen {filteredUsers.length} felhasználó {searchTerm && `(${users.length} közül)`}
        </div>

        {/* Users table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Név
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Szerepkör
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Műveletek
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUserId === user.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingUserName}
                            onChange={(e) => setEditingUserName(e.target.value)}
                            className="text-sm font-medium text-gray-900 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleNameUpdate(user.id);
                              } else if (e.key === 'Escape') {
                                cancelEditingName();
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleNameUpdate(user.id)}
                            className="text-green-600 hover:text-green-800 text-xs"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEditingName}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 flex items-center"
                          onClick={() => startEditingName(user.id, user.name)}
                          title="Kattints a szerkesztéshez"
                        >
                          {user.name}
                          <span className="ml-1 text-gray-400 text-xs">✎</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {currentUser && user.id !== currentUser.id ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value, user.name)}
                          className={`px-2 py-1 text-xs font-semibold rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getRoleBadgeColor(user.role)}`}
                        >
                          <option value="student">Diák</option>
                          <option value="teacher">Tanár</option>
                          <option value="admin">Adminisztrátor</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {getRoleDisplayName(user.role)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {currentUser && user.id !== currentUser.id ? (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => startEditingName(user.id, user.name)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                            disabled={editingUserId !== null}
                          >
                            Szerkesztés
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Törlés
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Saját fiók</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "Nincs találat a keresési feltételeknek megfelelően." : "Nincsenek felhasználók."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}