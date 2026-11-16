import { createAuthClient } from "better-auth/react";

// No baseURL: the auth API is served from the same origin as the app.
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
