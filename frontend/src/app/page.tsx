'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { LESSON_VIDEOS } from '@/data/lessons';
import {
  loadWatchHistory,
  loadCompletedLessons,
  loadLastLesson,
  WatchHistory,
  LastLesson,
} from '@/lib/localProgress';
import { BookOpen, Clock, Play, CheckCircle, PlayCircle } from 'lucide-react';

const COURSE_SLUG = 'fb-automation-mastery';

const COURSE = {
  slug: COURSE_SLUG,
  title: 'Faceless Facebook Mastery',
  description:
    'Master Facebook automation and grow your page organically. Learn proven strategies to monetize your FB page without spending on ads.',
  thumbnail_url: '/thumbnails/facebook-mastery.png',
};

const TOTAL_LESSONS = LESSON_VIDEOS.length;
const TOTAL_MINUTES = LESSON_VIDEOS.reduce((sum, lesson) => sum + lesson.duration, 0);

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [lastLesson, setLastLesson] = useState<LastLesson | null>(null);
  const [watchHistory, setWatchHistory] = useState<WatchHistory>({});

  // Load local progress (no account needed)
  useEffect(() => {
    setCompletedCount(loadCompletedLessons().size);
    setLastLesson(loadLastLesson());
    setWatchHistory(loadWatchHistory());
    setReady(true);
  }, []);

  const progressPercent = Math.round((completedCount / TOTAL_LESSONS) * 100);

  const lastLessonId = lastLesson ? String(lastLesson.id) : null;
  const lastWatchedEntry = lastLessonId ? watchHistory[lastLessonId] : undefined;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-emerald-500" />
              My Courses
            </h1>
            <p className="text-gray-400 mt-2">
              Progress is saved on this device — no account needed.
            </p>
          </div>

          {/* Course card */}
          <div
            onClick={() => router.push(`/courses/${COURSE_SLUG}/learn`)}
            className="group bg-gray-800/50 border border-gray-700 hover:border-emerald-500/50 rounded-xl overflow-hidden transition-all text-left cursor-pointer mb-8"
          >
            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Thumbnail */}
              <div className="aspect-video relative bg-gray-800 rounded-lg overflow-hidden">
                {COURSE.thumbnail_url ? (
                  <img
                    src={COURSE.thumbnail_url}
                    alt={COURSE.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-2">
                    <Play className="w-4 h-4 fill-white" />
                    Continue Learning
                  </span>
                </div>
              </div>

              {/* Course info */}
              <div className="flex flex-col justify-center">
                <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors mb-2">
                  {COURSE.title}
                </h2>
                <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                  {COURSE.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    ~{Math.round(TOTAL_MINUTES / 60)}h
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {TOTAL_LESSONS} lessons
                  </span>
                </div>

                {/* Local progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      {completedCount} of {TOTAL_LESSONS} completed
                    </span>
                    <span className="text-emerald-400 font-semibold">{progressPercent}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Resume / start */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/courses/${COURSE_SLUG}/learn`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    {lastLesson ? (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        Open Course
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        Start Learning
                      </>
                    )}
                  </Link>
                  {lastLesson && (
                    <Link
                      href={`/courses/${COURSE_SLUG}/learn?lesson=${lastLesson.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 font-semibold rounded-lg transition-colors"
                    >
                      <PlayCircle className="w-4 h-4 text-emerald-400" />
                      Resume: {lastLesson.title.length > 24 ? `${lastLesson.title.slice(0, 24)}…` : lastLesson.title}
                    </Link>
                  )}
                </div>

                {/* Last activity */}
                {ready && (
                  <p className="text-xs text-gray-500 mt-3">
                    {lastLesson
                      ? `Last opened: ${lastLesson.title}${
                          lastWatchedEntry
                            ? ` · ${Math.round((lastWatchedEntry.currentTime / Math.max(lastWatchedEntry.duration, 1)) * 100)}% watched · ${timeAgo(lastLesson.openedAt)}`
                            : ` · ${timeAgo(lastLesson.openedAt)}`
                        }`
                      : 'No lessons opened yet on this device.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Community */}
          <div className="flex justify-center">
            <a
              href="https://t.me/+MaOIiu5SXVhlZGE9"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
            >
              Free Community
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
