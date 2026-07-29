import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = credentials.username as string;
        const password = credentials.password as string;

        const isValidUser = username === process.env.ADMIN_USERNAME;
        const isValidPass = password === process.env.ADMIN_PASSWORD;

        if (isValidUser && isValidPass) {
          return { id: "1", name: "Admin BPS", role: "admin" };
        }

        return null;
      },
    }),
  ],
});
