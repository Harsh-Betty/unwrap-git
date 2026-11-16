import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProfileLoading } from "@/components/ProfileLoading";
import { UserYearView } from "@/components/UserYearView";
import { normalizeUsername } from "@/lib/username";
import { profileMetadata } from "@/lib/profile-metadata";
import { parseYear } from "@/lib/year";

export async function generateMetadata(
  props: PageProps<"/[username]/[year]">
) {
  const { username, year: yearParam } = await props.params;
  const login = normalizeUsername(username);
  const year = parseYear(yearParam);
  return login && year !== null ? profileMetadata(login, year) : {};
}

export default async function UserYearPage(
  props: PageProps<"/[username]/[year]">
) {
  const { username, year: yearParam } = await props.params;
  // Validate before the Suspense boundary so bad URLs get a real 404 status
  // instead of a streamed 200.
  const login = normalizeUsername(username);
  const year = parseYear(yearParam);
  if (!login || year === null) notFound();

  return (
    <Suspense fallback={<ProfileLoading />}>
      <UserYearView username={login} year={year} />
    </Suspense>
  );
}
