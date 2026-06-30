'use client';

import { FormEvent, Suspense, useState } from 'react';
import { KeyRound, LogIn } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

type Mode = 'login' | 'change';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>('login');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setError('');
    setPassword('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const response = await fetch('/api/admin/session', {
      method: mode === 'login' ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mode === 'login'
        ? { password }
        : { currentPassword, newPassword, confirmPassword }),
    });
    const body = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(body.error ?? 'Unable to update administrator access');
      return;
    }
    const next = searchParams.get('next');
    router.replace(next?.startsWith('/admin') ? next : '/admin');
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-4xl font-black">Admin access</h1>
      <p className="mt-2 text-slate-600">Sign in or replace the administrator password.</p>
      <div className="mt-8 grid grid-cols-2 border border-slate-300 bg-white p-1">
        <button
          type="button"
          className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold ${mode === 'login' ? 'bg-slate-900 text-white' : ''}`}
          onClick={() => changeMode('login')}
        >
          <LogIn size={16} /> Sign in
        </button>
        <button
          type="button"
          className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold ${mode === 'change' ? 'bg-slate-900 text-white' : ''}`}
          onClick={() => changeMode('change')}
        >
          <KeyRound size={16} /> Change password
        </button>
      </div>
      <form className="border border-t-0 border-slate-300 bg-white p-6" onSubmit={submit}>
        {mode === 'login' ? (
          <label className="label">
            Password
            <input className="input mt-2" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
        ) : (
          <div className="space-y-4">
            <label className="label block">
              Current password
              <input className="input mt-2" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
            </label>
            <label className="label block">
              New password
              <input className="input mt-2" type="password" autoComplete="new-password" minLength={12} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
            </label>
            <label className="label block">
              Confirm new password
              <input className="input mt-2" type="password" autoComplete="new-password" minLength={12} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
            </label>
            <p className="text-xs text-slate-500">Use at least 12 characters with uppercase, lowercase, and a number.</p>
          </div>
        )}
        {error && <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
        <button className="btn-primary mt-5 w-full" disabled={loading}>
          {loading ? 'Working...' : mode === 'login' ? 'Sign in' : 'Change password'}
        </button>
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
