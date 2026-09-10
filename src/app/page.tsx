import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function Home() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  redirect(session ? '/dashboard' : '/login');
}