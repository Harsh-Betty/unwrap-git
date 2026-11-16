import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProfileLoading } from "@/components/ProfileLoading";
import { UserYearView } from "@/components/UserYearView";
import { normalizeUsername } from "@/lib/username";
import { currentYear } from "@/lib/year";

export default async function UserPage(props: PageProps<"/[username]">) {
  const { username } = await props.params;
  // Validate before the Suspense boundary so bad URLs get a real 404 status
  // instead of a streamed 200.
  const login = normalizeUsername(username);
  if (!login) notFound();

  return (
    <Suspense fallback={<ProfileLoading />}>
      <UserYearView username={login} year={currentYear()} />
    </Suspense>
  );
}
