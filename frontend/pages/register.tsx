import { useState } from 'react';
import api from '../lib/api';
import { useRouter } from 'next/router';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    try {
      await api.post('/users/register', { name, email, password });
      alert('Sikeres regisztráció');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('Hiba a regisztrációnál');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-purple-700 text-center">Regisztráció</h1>
        <input
          className="border p-2 w-full mb-3 rounded focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
          placeholder="Név"
          value={name}
          onChange={e=>setName(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-3 rounded focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
          placeholder="Email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-3 rounded focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
          type="password"
          placeholder="Jelszó"
          value={password}
          onChange={e=>setPassword(e.target.value)}
        />
        <button
          onClick={handleRegister}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full transition mb-2"
        >
          Regisztráció
        </button>
        <div className="text-center mt-2">
          <a href="/" className="text-blue-700 hover:underline">Van már fiókod? Jelentkezz be!</a>
        </div>
      </div>
    </div>
  );
}