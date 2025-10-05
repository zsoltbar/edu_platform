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
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Regisztráció</h1>
      <input className="border p-2 w-full mb-2" placeholder="Név" value={name} onChange={e=>setName(e.target.value)} />
      <input className="border p-2 w-full mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="border p-2 w-full mb-2" type="password" placeholder="Jelszó" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={handleRegister} className="bg-green-500 text-white px-4 py-2 rounded">Regisztráció</button>
    </div>
  );
}