import { redirect } from 'next/navigation';

export async function generateStaticParams() {
  return [{ slug: 'fb-automation-mastery' }, { slug: 'fb-automation' }, { slug: 'facebook-automation' }];
}

export default async function CourseOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Course content opens directly in the lesson interface
  redirect(`/courses/${slug}/learn`);
}
