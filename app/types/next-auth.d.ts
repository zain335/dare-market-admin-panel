import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      apiToken?: string;
      userData?: any;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    apiToken?: string;
    userData?: any;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    apiToken?: string;
    userData?: any;
  }
}
