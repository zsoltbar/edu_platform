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
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Bejelentkezés</h1>
      <input className="border p-2 w-full mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="border p-2 w-full mb-2" type="password" placeholder="Jelszó" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 rounded">Bejelentkezés</button>
    </div>
  );
}
