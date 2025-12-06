import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";
import crypto from "crypto";

// Define Next Auth Strategy with configs
export const authOptions: NextAuthOptions = {
  // Sessions Config - Store JWT Token in sessions
  session: {
    strategy: "jwt", // JWT - OAUTH Strategy
    maxAge: 24 * 60 * 60, // 1 day in seconds
  },
  // Providers - Only using Email/Password (Custom) Provider
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      type: "credentials",
      credentials: {
        email: { type: "text", label: "Email" },
        password: { type: "text", label: "Password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) return null;

        try {
          const { email, password } = credentials;

          if (email === "admin@dare.market" && password === "admin") {
            return {
              id: email,
              email: email,
              name: email,
              apiToken: email,
              userData: email,
            };
          }

          return null;
        } catch (error) {
          console.error("Login error:", error);
          return null;
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },

  callbacks: {
    async session({ session, token }) {
      // Pass token data to session
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          apiToken: token.apiToken,
          userData: token.userData,
        },
      };
    },
    async jwt({ token, user }) {
      // Persist user data to token
      if (user) {
        token.id = user.id;
        token.apiToken = user.apiToken;
        token.userData = user.userData;
      }
      return token;
    },
  },
};
