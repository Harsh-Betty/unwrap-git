import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

const db = new Database("./sqlite.db");

export const auth = betterAuth({
  database: db,
  socialProviders: {
    github: {
      clientId: process.env.AUTH_GITHUB_ID as string,
      clientSecret: process.env.AUTH_GITHUB_SECRET as string,
      scope: ["read:user"],
      mapProfileToUser: (profile) => ({
        name: profile.login,
        email: profile.email,
        image: profile.avatar_url,
      }),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

export type Session = typeof auth.$Infer.Session;
