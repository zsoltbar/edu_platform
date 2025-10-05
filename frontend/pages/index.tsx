import { useState } from 'react';
import api from '../lib/api';
import { useRouter } from 'next/router';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const res = await api.post('/users/login', { email, password });
      localStorage.setItem('token', res.data.access_token);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Hiba a bejelentkezésnél');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-blue-700 text-center">Bejelentkezés</h1>
        <input
          className="border p-2 w-full mb-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
          placeholder="Email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
          type="password"
          placeholder="Jelszó"
          value={password}
          onChange={e=>setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full transition mb-2"
        >
          Bejelentkezés
        </button>
        <div className="text-center mt-2">
          <a href="/register" className="text-purple-700 hover:underline">Nincs fiókod? Regisztrálj!</a>
        </div>
      </div>
    </div>
  );
}
