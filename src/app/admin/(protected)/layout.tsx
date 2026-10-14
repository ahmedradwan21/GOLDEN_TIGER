import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth/session';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  return <AdminShell adminEmail={session.email} adminRole={session.role}>{children}</AdminShell>;
}
