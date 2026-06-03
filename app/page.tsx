'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user) {
      const role = (session.user as any).role;
      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/seller');
      }
    }
  }, [status, session, router]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      <p className="text-sm text-gray-500 font-medium">Redirecting to portal...</p>
    </div>
  );
}
