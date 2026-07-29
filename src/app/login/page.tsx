'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { authenticate } from './actions';
import { MapPin, Key, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [errorMessage, dispatch] = useActionState(authenticate, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-[#0b1b36] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <MapPin size={120} className="-mt-8 -mr-8" />
          </div>
          <div className="relative z-10 flex justify-center mb-4">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
              <MapPin size={32} className="text-teal-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 relative z-10">Statistik Demak</h1>
          <p className="text-slate-300 text-sm relative z-10">Portal WebGIS Kabupaten Demak</p>
        </div>

        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Admin Login</h2>
            <p className="text-sm text-slate-500 mt-1">Silakan masukkan kredensial untuk melanjutkan</p>
          </div>

          <form action={dispatch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400" />
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b1b36] focus:border-transparent sm:text-sm transition-shadow"
                  id="username"
                  type="text"
                  name="username"
                  placeholder="Masukkan username"
                  required
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={18} className="text-slate-400" />
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b1b36] focus:border-transparent sm:text-sm transition-shadow"
                  id="password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {errorMessage && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-start">
                <span className="font-semibold mr-2">Error:</span> {errorMessage}
              </div>
            )}

            <LoginButton />
          </form>
        </div>
      </div>
    </div>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();
  
  return (
    <button
      className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#0b1b36] hover:bg-[#152a50] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0b1b36] disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
      aria-disabled={pending}
      type="submit"
      disabled={pending}
    >
      {pending ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Memverifikasi...
        </span>
      ) : (
        <span className="flex items-center">
          Log in <ArrowRight size={16} className="ml-2" />
        </span>
      )}
    </button>
  );
}
