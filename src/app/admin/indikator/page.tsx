import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AdminIndikatorPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-green-600 mb-2">Login Berhasil! 🎉</h1>
        <p className="text-slate-600 mb-6">
          Selamat datang, <span className="font-semibold">{session.user?.name}</span>.
        </p>
        <div className="p-4 bg-slate-50 border rounded-lg text-left text-sm text-slate-500">
          <p>Halaman Mockup Dashboard Admin akan dibangun di sini.</p>
        </div>
        <form
          action={async () => {
            'use server';
            const { signOut } = await import('@/auth');
            await signOut();
          }}
          className="mt-6"
        >
          <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg transition-colors">
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
