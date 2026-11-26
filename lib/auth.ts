import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Shared with the leaderboard queries. Kept small because every serverless
// instance opens its own pool against the Supabase pooler.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 10_000,
});

export const auth = betterAuth({
  database: pool,
  // The app treats the user's `name` as their GitHub login (set from the
  // GitHub profile at sign-in). This endpoint would let a signed-in user
  // rename themselves to someone else's login, so it is turned off.
  disabledPaths: ["/update-user"],
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
  account: {
    // GitHub tokens are encrypted at rest. Rows written before this was
    // enabled are still readable and get encrypted on the next sign-in.
    encryptOAuthTokens: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    // Signed cookie copy of the session, so most requests skip the database.
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
