import NextAuth from "next-auth";
import Github from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";

export const { handlers, auth, signOut, signIn } = NextAuth({
  providers: [Github],
  adapter: DrizzleAdapter(db),
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
