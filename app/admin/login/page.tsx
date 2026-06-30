'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const response = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!response.ok) {
      setError('Invalid administrator credentials');
      return;
    }
    const next = searchParams.get('next');
    router.replace(next?.startsWith('/admin') ? next : '/admin');
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-4xl font-black">Admin sign in</h1>
      <p className="mt-2 text-slate-600">Use the administrator password configured for this deployment.</p>
      <form className="mt-8 border border-slate-300 bg-white p-6" onSubmit={submit}>
        <label className="label">
          Password
          <input className="input mt-2" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {error && <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
        <button className="btn-primary mt-5 w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </main>
  );
}

export default function AdminLogin() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md px-6 py-20 text-slate-500">Loading sign in...</main>}>
      <LoginForm />
    </Suspense>
  );
}
