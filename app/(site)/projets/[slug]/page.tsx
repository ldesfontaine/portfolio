import { redirect } from "next/navigation";

export default async function LegacyProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/notes?theme=${encodeURIComponent(slug)}`);
}
