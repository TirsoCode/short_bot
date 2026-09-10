import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { settingsQueries } from '@/lib/db/queries';
import { compare } from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const settings = await settingsQueries.find();
        if (!settings) return null;

        const isValid = settings.githubToken === credentials?.password;
        if (!isValid) return null;

        return { id: 'admin', name: 'Admin', email: 'admin@local' };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };