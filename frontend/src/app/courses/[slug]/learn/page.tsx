'use client';

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import VimeoPlayer from '@vimeo/player';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  Play,
  CheckCircle,
  Lock,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BookOpen,
  Search
} from 'lucide-react';
import VIDEO_SOURCES_RAW from '@/data/video-sources.json';
import {
  LESSON_VIDEOS,
  LESSON_CATEGORY_MAP,
  LessonCategory,
  LessonVideoEntry
} from '@/data/lessons';
import {
  loadWatchHistory,
  saveWatchEntry,
  loadCompletedLessons,
  saveCompletedLessons,
  saveLastLesson,
  WatchEntry,
  WatchHistory
} from '@/lib/localProgress';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dwcxvaswf';
const R2_ACCOUNT_ID = '6979f6d58b951631b6a5585a10376a27';
const R2_BUCKET = 'darwin-videos';
const R2_LESSONS_BASE_URL =
  process.env.NEXT_PUBLIC_R2_LESSONS_BASE_URL ||
  'https://pub-79bbe5625f3e4375a961f7bf776b47c8.r2.dev';

// Debug: Log Cloudinary config
if (typeof window !== 'undefined') {
  console.log('🔬 Video Config:', { CLOUDINARY_CLOUD_NAME, R2_BUCKET });
  console.log('🔭 R2 Lessons Base URL:', R2_LESSONS_BASE_URL);
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    console.warn('⚠️ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set. Falling back to default cloud name; set it in your hosting env to avoid surprises.');
  }
}

// TEMPORARY: All videos use Cloudinary until R2 public domain is configured
// R2's .r2.cloudflarestorage.com URLs cannot be accessed by browsers
// See R2_CORS_SETUP.md for instructions to enable R2 public access
const normalizeFilenameKey = (value: string) =>
  value
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();

const VIDEO_SOURCES: Record<string, 'cloudinary' | 'r2'> = Object.fromEntries(
  Object.entries(VIDEO_SOURCES_RAW as Record<string, 'cloudinary' | 'r2'>).map(([k, v]) => [
    normalizeFilenameKey(k),
    v,
  ])
) as Record<string, 'cloudinary' | 'r2'>;

// No longer using R2 - all videos are on Cloudinary with direct URLs in videoUrlOverride
const LESSON_VIDEO_URL_OVERRIDES: Record<string, string> = {};

type BgmFile = {
  id: number;
  name: string;
  url: string;
};

// BGM and SFX files served locally from public/bgm-and-sfx
const BGM_FILES: BgmFile[] = [
  { id: 1, name: 'Ace of Base - All That She Wants', url: '/bgm-and-sfx/Ace of Base 🎼 All That She Wants.mp3' },
  { id: 2, name: 'Else Paris', url: '/bgm-and-sfx/Else Paris.mp3' },
  { id: 3, name: 'Heaven Sent', url: '/bgm-and-sfx/Heaven Sent .mp3' },
  { id: 4, name: 'hell shee', url: '/bgm-and-sfx/hell shee.mp3' },
  { id: 5, name: 'hindia secukupnya instrument loop', url: '/bgm-and-sfx/hindia secukupnya instrument loop.mp3' },
  { id: 6, name: 'illusionarydaytime', url: '/bgm-and-sfx/illusionarydaytime.mp3' },
  { id: 7, name: 'Le Monde - From Talk to Me', url: '/bgm-and-sfx/Le Monder - From talk to me.mp3' },
  { id: 8, name: 'not like us', url: '/bgm-and-sfx/not like us.mp3' },
  { id: 9, name: 'Scary Piano', url: '/bgm-and-sfx/Scary Piano.mp3' },
  { id: 10, name: 'Silent Hill', url: '/bgm-and-sfx/Silent Hill.mp3' },
  { id: 11, name: 'Sound Effects', url: '/bgm-and-sfx/Sound Effects.mp3' },
  { id: 12, name: 'Spooky Quiet Scary Piano Haunting Horror', url: '/bgm-and-sfx/Spooky Quiet Scary Piano  Haunting Horror.mp3' },
  { id: 13, name: 'tell em-(slowed instrumental)', url: '/bgm-and-sfx/tell em-(slowed instrumental).mp3' },
  { id: 14, name: 'The way life goes', url: '/bgm-and-sfx/The way life goes.mp3' },
  { id: 15, name: 'Time back', url: '/bgm-and-sfx/Time back.mp3' },
  { id: 16, name: 'Transgender', url: '/bgm-and-sfx/Transgender.mp3' },
];

const getLessonR2VideoUrl = (filename: string, variant: 'lessons' | 'root') => {
  const base = R2_LESSONS_BASE_URL.replace(/\/+$/g, '');
  const encoded = encodeURIComponent(filename);
  const url = variant === 'root' ? `${base}/${encoded}` : `${base}/lessons/${encoded}`;
  console.log('R2 Video URL:', url);
  return url;
};

const getLessonCloudinaryVideoUrl = (filename: string) => {
  const PUBLIC_ID_OVERRIDES: Record<string, string> = {
    // Cloudinary upload uses no apostrophes in this filename
    "23 The Do's and Don'ts.mp4": '23_The_Dos_and_Donts',
  };

  const filenameWithoutExt = filename.replace(/\.mp4$/i, '');

  const rawPublicId =
    PUBLIC_ID_OVERRIDES[filename] ??
    filenameWithoutExt
      .replace(/ /g, '_')
      .replace(/[’']/g, '')
      .replace(/\u2019/g, '');

  const encodedPublicId = encodeURIComponent(rawPublicId);
  const transformation = 'f_mp4,vc_h264,ac_aac';
  const url = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/${transformation}/darwin-education/lessons/${encodedPublicId}.mp4`;
  console.log('Cloudinary Video URL:', url, `(Cloud: ${CLOUDINARY_CLOUD_NAME})`);
  return url;
};

const ensureCloudinaryPlayableMp4Url = (url: string) => {
  // Many mobile/desktop browsers (notably Chrome/Android) cannot play HEVC (hvc1)
  // sources and will surface it as a NetworkError. Force Cloudinary to transcode
  // to H.264/AAC MP4 when possible.
  const marker = '/video/upload/';
  if (!url.includes('res.cloudinary.com/')) return url;
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const after = url.slice(idx + marker.length);
  if (after.includes('vc_h264') || after.includes('f_mp4') || after.includes('ac_aac')) return url;

  const transformation = 'f_mp4,vc_h264,ac_aac';
  return url.slice(0, idx + marker.length) + `${transformation}/` + after;
};

// Helper to get video URL from Cloudinary or R2
const getLessonVideoUrl = (
  filename: string,
  sourceOverride?: 'cloudinary' | 'r2',
  r2Variant: 'lessons' | 'root' = 'lessons'
) => {
  const normalizedFilename = normalizeFilenameKey(filename);

  // Determine the source: explicit override > VIDEO_SOURCES mapping > default cloudinary
  const source = sourceOverride || VIDEO_SOURCES[normalizedFilename] || 'cloudinary';

  // For R2 source, use override URL if available, otherwise generate URL
  if (source === 'r2') {
    const overrideUrl = LESSON_VIDEO_URL_OVERRIDES[normalizedFilename];
    if (overrideUrl) return overrideUrl;
    return getLessonR2VideoUrl(normalizedFilename, r2Variant);
  }

  // For Cloudinary source, always use generated URL (not R2 overrides)
  return getLessonCloudinaryVideoUrl(normalizedFilename);
};

function CourseLearnPageContent() {
  const searchParams = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'lessons' | 'files' | 'bgm' | 'webinar'>('lessons');
  const [searchQuery, setSearchQuery] = useState('');

  const [courseFiles, setCourseFiles] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);

  // BGM audio playback
  const [playingBgmId, setPlayingBgmId] = useState<number | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);

  // Lesson video states
  const [currentVideoLesson, setCurrentVideoLesson] = useState<LessonVideoEntry | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set<number>());
  const [lessonCategory, setLessonCategory] = useState<LessonCategory>('ALL');
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const [lessonVideoSource, setLessonVideoSource] = useState<'cloudinary' | 'r2'>('cloudinary');
  const [lessonVideoR2Variant, setLessonVideoR2Variant] = useState<'lessons' | 'root'>('lessons');
  const [lessonVideoError, setLessonVideoError] = useState<string | null>(null);
  const [lessonVideoFallbackAttempts, setLessonVideoFallbackAttempts] = useState(0);
  const [lessonVideoRetryCount, setLessonVideoRetryCount] = useState(0);

  // ---- Watch History (localStorage, no account needed) ----
  // Initialized empty to keep the server HTML and first client render in
  // sync; real history is loaded in the mount effect below.
  const [watchHistory, setWatchHistory] = useState<WatchHistory>({});

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

  // Load local progress on mount
  useEffect(() => {
    setWatchHistory(loadWatchHistory());
    setCompletedLessons(loadCompletedLessons());

    // Resume a specific lesson when opened via ?lesson=<id>
    const lessonParam = searchParams.get('lesson');
    if (lessonParam) {
      const found = LESSON_VIDEOS.find(l => String(l.id) === lessonParam);
      if (found) openLesson(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open a lesson and remember it as the last opened lesson
  const openLesson = useCallback((lesson: LessonVideoEntry) => {
    setCurrentVideoLesson(lesson);
    saveLastLesson({
      id: lesson.id,
      title: lesson.title,
      thumbnail: lesson.thumbnail,
      openedAt: Date.now(),
    });
  }, []);

  const saveWatchProgress = useCallback((lesson: LessonVideoEntry, currentTime: number, duration: number) => {
    if (!lesson) return;
    const entry: WatchEntry = {
      title: lesson.title,
      thumbnail: lesson.thumbnail ?? null,
      currentTime,
      duration,
      lastWatchedAt: Date.now(),
    };
    saveWatchEntry(lesson.id, entry);
    setWatchHistory(prev => ({ ...prev, [String(lesson.id)]: entry }));
  }, []);

  // Mark a lesson as completed (localStorage)
  const markCompleted = useCallback((lesson: LessonVideoEntry) => {
    setCompletedLessons(prev => {
      if (prev.has(lesson.id)) return prev;
      const next = new Set(prev);
      next.add(lesson.id);
      saveCompletedLessons(next);
      return next;
    });
  }, []);

  // When the current lesson changes, reset source to preferred (VIDEO_SOURCES or Cloudinary)
  useEffect(() => {
    if (!currentVideoLesson) return;
    const normalizedFilename = normalizeFilenameKey(currentVideoLesson.filename);
    setLessonVideoSource(VIDEO_SOURCES[normalizedFilename] || 'cloudinary');
    setLessonVideoR2Variant('lessons');
    setLessonVideoError(null);
    setLessonVideoFallbackAttempts(0);
    setLessonVideoRetryCount(0);
  }, [currentVideoLesson]);

  // Resume video from saved position when a new lesson loads
  useEffect(() => {
    if (!currentVideoLesson || !videoRef.current) return;
    const saved = watchHistory[String(currentVideoLesson.id)];
    if (saved && saved.currentTime > 5 && saved.duration > 0 && saved.currentTime < saved.duration - 10) {
      const trySeek = () => {
        if (videoRef.current && videoRef.current.readyState >= 1) {
          videoRef.current.currentTime = saved.currentTime;
        } else {
          videoRef.current?.addEventListener('loadedmetadata', () => {
            if (videoRef.current) videoRef.current.currentTime = saved.currentTime;
          }, { once: true });
        }
      };
      trySeek();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideoLesson]);

  // “““ Vimeo Player: resume + progress save “““
  useEffect(() => {
    if (!currentVideoLesson?.vimeoId || !iframeRef.current) return;

    const player = new VimeoPlayer(iframeRef.current);
    const saved = watchHistory[String(currentVideoLesson.id)];

    // Resume from saved position once the player is ready
    player.ready().then(() => {
      if (
        saved &&
        saved.currentTime > 5 &&
        saved.duration > 0 &&
        saved.currentTime < saved.duration - 10
      ) {
        player.setCurrentTime(saved.currentTime).catch(() => { });
      }
    }).catch(() => { });

    // Save progress on every timeupdate tick
    const handleTimeUpdate = ({ seconds, duration }: { seconds: number; duration: number }) => {
      if (seconds < 5 || !duration) return;
      const entry: WatchEntry = {
        title: currentVideoLesson.title,
        thumbnail: currentVideoLesson.thumbnail ?? null,
        currentTime: seconds,
        duration,
        lastWatchedAt: Date.now(),
      };
      saveWatchEntry(currentVideoLesson.id, entry);
      setWatchHistory(prev => ({ ...prev, [String(currentVideoLesson.id)]: entry }));
    };

    // Also save on pause
    const handlePause = ({ seconds, duration }: { seconds: number; duration: number }) => {
      if (seconds < 5 || !duration) return;
      const entry: WatchEntry = {
        title: currentVideoLesson.title,
        thumbnail: currentVideoLesson.thumbnail ?? null,
        currentTime: seconds,
        duration,
        lastWatchedAt: Date.now(),
      };
      saveWatchEntry(currentVideoLesson.id, entry);
      setWatchHistory(prev => ({ ...prev, [String(currentVideoLesson.id)]: entry }));
    };

    // Mark lesson complete when the video ends
    const handleEnded = () => {
      markCompleted(currentVideoLesson);
    };

    player.on('timeupdate', handleTimeUpdate);
    player.on('pause', handlePause);
    player.on('ended', handleEnded);

    return () => {
      player.off('timeupdate', handleTimeUpdate);
      player.off('pause', handlePause);
      player.off('ended', handleEnded);
      player.destroy().catch(() => { });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideoLesson]);
  // ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““

  // Scroll to top of lesson content whenever the lesson changes
  useEffect(() => {
    if (!currentVideoLesson) return;
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentVideoLesson]);

  // All lessons are immediately accessible
  const isLessonUnlocked = (_lessonId: number) => true;

  const handleVideoEnded = () => {
    if (currentVideoLesson) markCompleted(currentVideoLesson);
  };

  // Filtered lessons for the category grid (includes HISTORY)
  const filteredLessons = useMemo(() => {
    const visible = LESSON_VIDEOS.filter(
      lesson =>
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (lessonCategory === 'HISTORY') {
      return visible
        .filter(lesson => watchHistory[String(lesson.id)])
        .sort((a, b) => {
          const aTime = watchHistory[String(a.id)]?.lastWatchedAt ?? 0;
          const bTime = watchHistory[String(b.id)]?.lastWatchedAt ?? 0;
          return bTime - aTime;
        });
    }
    if (lessonCategory === 'ALL') return visible;
    return visible.filter(lesson => LESSON_CATEGORY_MAP[lesson.id] === lessonCategory);
  }, [lessonCategory, watchHistory, searchQuery]);

  // Save progress on page unload (tab close / navigate away)
  useEffect(() => {
    const handleUnload = () => {
      const v = videoRef.current;
      if (v && currentVideoLesson && v.duration && v.currentTime > 0) {
        saveWatchEntry(currentVideoLesson.id, {
          title: currentVideoLesson.title,
          thumbnail: currentVideoLesson.thumbnail ?? null,
          currentTime: v.currentTime,
          duration: v.duration,
          lastWatchedAt: Date.now(),
        });
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [currentVideoLesson]);

  // Navigate to next lesson — respects filteredLessons so category/search context is honoured
  const goToNextVideoLesson = () => {
    if (!currentVideoLesson) return;
    const currentIndex = filteredLessons.findIndex(l => l.id === currentVideoLesson.id);
    const nextLesson = currentIndex >= 0 && currentIndex < filteredLessons.length - 1
      ? filteredLessons[currentIndex + 1]
      : null;
    if (nextLesson && isLessonUnlocked(nextLesson.id)) {
      openLesson(nextLesson);
    }
  };

  // Navigate to previous lesson — respects filteredLessons so category/search context is honoured
  const goToPrevVideoLesson = () => {
    if (!currentVideoLesson) return;
    const currentIndex = filteredLessons.findIndex(l => l.id === currentVideoLesson.id);
    const prevLesson = currentIndex > 0 ? filteredLessons[currentIndex - 1] : null;
    if (prevLesson) {
      openLesson(prevLesson);
    }
  };

  // Derived booleans for nav button disabled state (based on filteredLessons)
  const currentVideoIndex = currentVideoLesson
    ? filteredLessons.findIndex(l => l.id === currentVideoLesson.id)
    : -1;
  const isFirstLesson = currentVideoIndex === 0;
  const isLastLesson = currentVideoIndex === filteredLessons.length - 1;

  // Fetch files when tab becomes active
  useEffect(() => {
    if (activeTab !== 'files') return;
    if (courseFiles.length > 0) return;

    let isMounted = true;

    setFilesLoading(true);
    setFilesError(null);

    fetch('/data/files.json')
      .then(res => {
        if (!isMounted) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setCourseFiles(data);
        setFilesLoading(false);
      })
      .catch(err => {
        if (!isMounted) return;
        setFilesError(err.message || 'Failed to load files');
        setFilesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab, courseFiles.length]);

  const filteredFiles = useMemo(() => {
    if (activeTab !== 'files') return courseFiles;
    return courseFiles.filter((file) => {
      return file.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [courseFiles, searchQuery, activeTab]);

  const filteredBgmFiles = useMemo(() => {
    return BGM_FILES.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Play / pause local BGM audio
  const handleBgmPlayPause = (file: BgmFile) => {
    if (!file.url) return; // no local file yet
    if (playingBgmId === file.id) {
      bgmAudioRef.current?.pause();
      setPlayingBgmId(null);
      return;
    }
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
      bgmAudioRef.current.src = '';
    }
    const audio = new Audio(file.url);
    bgmAudioRef.current = audio;
    setPlayingBgmId(file.id);
    audio.play().catch(() => setPlayingBgmId(null));
    audio.onended = () => setPlayingBgmId(null);
  };

  // Stop audio when leaving BGM tab
  useEffect(() => {
    if (activeTab !== 'bgm' && bgmAudioRef.current) {
      bgmAudioRef.current.pause();
      bgmAudioRef.current.src = '';
      bgmAudioRef.current = null;
      setPlayingBgmId(null);
    }
  }, [activeTab]);

  return (
    <div className="h-screen bg-gray-950 flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-80 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'
          }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <Link href="/" className="text-sm text-emerald-500 hover:text-emerald-400 flex items-center gap-1 mb-4">
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Link>

            {/* Tabs */}
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => {
                  setActiveTab('lessons');
                  setSearchQuery('');
                }}
                className={`w-full px-4 py-3 text-sm font-medium transition-colors text-left border-l-2 ${activeTab === 'lessons'
                    ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10'
                    : 'text-gray-400 border-transparent hover:text-gray-300 hover:bg-gray-800/50'
                  }`}
              >
                Lessons
              </button>

              <button
                onClick={() => {
                  setActiveTab('files');
                  setSearchQuery('');
                }}
                className={`w-full px-4 py-3 text-sm font-medium transition-colors text-left border-l-2 ${activeTab === 'files'
                    ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10'
                    : 'text-gray-400 border-transparent hover:text-gray-300 hover:bg-gray-800/50'
                  }`}
              >
                Files
              </button>
              <button
                onClick={() => {
                  setActiveTab('bgm');
                  setSearchQuery('');
                }}
                className={`w-full px-4 py-3 text-sm font-medium transition-colors text-left border-l-2 ${activeTab === 'bgm'
                    ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10'
                    : 'text-gray-400 border-transparent hover:text-gray-300 hover:bg-gray-800/50'
                  }`}
              >
                BGM and SFX
              </button>
              <button
                onClick={() => {
                  setActiveTab('webinar');
                  setSearchQuery('');
                }}
                className={`w-full px-4 py-3 text-sm font-medium transition-colors text-left border-l-2 ${activeTab === 'webinar'
                    ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10'
                    : 'text-gray-400 border-transparent hover:text-gray-300 hover:bg-gray-800/50'
                  }`}
              >
                Webinar Archive
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Lessons Tab */}
            {activeTab === 'lessons' && (
              <>
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-300 mb-2 text-sm uppercase tracking-wider">
                    Course Lessons
                  </h3>

                </div>
                <ul className="space-y-1">
                  {LESSON_VIDEOS.map((lesson) => {
                    const isCurrent = currentVideoLesson?.id === lesson.id;
                    const isUnlocked = isLessonUnlocked(lesson.id);
                    const isCompleted = completedLessons.has(lesson.id);

                    return (
                      <li key={lesson.id}>
                        <button
                          onClick={() => {
                            if (isUnlocked) {
                              openLesson(lesson);
                            }
                          }}
                          disabled={!isUnlocked}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${isCurrent
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : isUnlocked
                                ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                                : 'text-gray-600 cursor-not-allowed opacity-50'
                            }`}
                        >
                          {isUnlocked ? (
                            isCompleted ? (
                              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                            ) : (
                              <Play className="w-4 h-4 flex-shrink-0" />
                            )
                          ) : (
                            <Lock className="w-4 h-4 flex-shrink-0 text-gray-600" />
                          )}

                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-16 h-10 rounded-md overflow-hidden bg-gray-800 flex-shrink-0">
                              {lesson.thumbnail ? (
                                <img src={lesson.thumbnail} alt={lesson.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                  <Play className="w-3 h-3 text-gray-500" />
                                </div>
                              )}
                            </div>

                            <span className="truncate text-sm">
                              {lesson.title}
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}


            {/* Files Tab */}
            {activeTab === 'files' && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">View course files in the main content area</p>
              </div>
            )}

            {/* BGM and SFX Tab */}
            {activeTab === 'bgm' && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">View BGM and SFX files in the main content area</p>
              </div>
            )}

            {/* Webinar Archive Tab */}
            {activeTab === 'webinar' && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">View webinar recordings in the main content area</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main ref={mainContentRef} className="flex-1 min-w-0 h-screen overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5 text-gray-400" /> : <Menu className="w-5 h-5 text-gray-400" />}
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-white truncate">
              {activeTab === 'files' ? 'Course Files' : activeTab === 'bgm' ? 'BGM and SFX' : activeTab === 'webinar' ? 'Webinar Archive' : currentVideoLesson ? `${currentVideoLesson.title}` : 'Select a lesson'}
            </h1>
          </div>

          <a
            href="https://discord.gg/x6VEfVsUT"
            target="_blank"
            rel="noopener noreferrer"
            title="Join our Discord Community"
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-800 transition-colors text-[#5865F2] hover:text-[#4752c4] flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </a>

          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white"
          >
            Home
          </Link>
        </header>

        {/* Lesson content */}
        {currentVideoLesson && activeTab === 'lessons' ? (
          <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            {/* Back button */}
            <button
              onClick={() => setCurrentVideoLesson(null)}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Lessons</span>
            </button>

            {/* Video player */}
            <div
              className="aspect-video bg-gray-900 rounded-xl mb-8 overflow-hidden relative"
              onContextMenu={(e) => e.preventDefault()}
            >
              {currentVideoLesson.vimeoId ? (
                <iframe
                  ref={iframeRef}
                  key={`vimeo-${currentVideoLesson.vimeoId}`}
                  className="w-full h-full"
                  src={`https://player.vimeo.com/video/${currentVideoLesson.vimeoId}${currentVideoLesson.vimeoId.includes('?') ? '&' : '?'}title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479&dnt=1&share=0&pip=0&collections=0`}
                  title={currentVideoLesson.title}
                  frameBorder={0}
                  allow="autoplay; fullscreen"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : currentVideoLesson.youtubeEmbedUrl && !currentVideoLesson.videoUrlOverride ? (
                <iframe
                  className="w-full h-full"
                  src={currentVideoLesson.youtubeEmbedUrl}
                  title={currentVideoLesson.title}
                  frameBorder={0}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                (() => {
                  const baseUrl =
                    currentVideoLesson.videoUrlOverride ??
                    getLessonVideoUrl(currentVideoLesson.filename, lessonVideoSource, lessonVideoR2Variant);

                  const resolvedUrl = ensureCloudinaryPlayableMp4Url(baseUrl);

                  // Debug logging for video loading
                  console.log('[Video] Loading lesson:', currentVideoLesson.title);
                  console.log('[Video] Source:', lessonVideoSource, 'R2 variant:', lessonVideoR2Variant);
                  console.log('[Video] Resolved URL:', resolvedUrl);
                  console.log('[Video] Fallback attempts:', lessonVideoFallbackAttempts, 'Retry count:', lessonVideoRetryCount);

                  return (
                    <video
                      ref={videoRef}
                      key={`${currentVideoLesson.id}-${lessonVideoSource}-${lessonVideoR2Variant}-${lessonVideoFallbackAttempts}-${lessonVideoRetryCount}`}
                      src={resolvedUrl}
                      controls
                      controlsList="nodownload"
                      onContextMenu={(e) => e.preventDefault()}
                      className="w-full h-full"
                      preload="auto"
                      playsInline
                      crossOrigin={resolvedUrl.includes('res.cloudinary.com/') ? 'anonymous' : undefined}
                      onEnded={handleVideoEnded}
                      autoPlay
                      onTimeUpdate={() => {
                        const v = videoRef.current;
                        if (v && v.duration && v.currentTime > 0 && currentVideoLesson) {
                          saveWatchProgress(currentVideoLesson, v.currentTime, v.duration);
                        }
                      }}
                      onPause={() => {
                        const v = videoRef.current;
                        if (v && v.duration && currentVideoLesson) {
                          saveWatchProgress(currentVideoLesson, v.currentTime, v.duration);
                        }
                      }}
                      onError={(e) => {
                        console.error('[Video] Error loading video:', e);
                        console.error('[Video] Failed URL:', resolvedUrl);
                        console.error('[Video] Source was:', lessonVideoSource, 'R2 variant:', lessonVideoR2Variant);
                        console.error('[Video] Fallback attempts:', lessonVideoFallbackAttempts, 'Retry count:', lessonVideoRetryCount);

                        // If this lesson uses an explicit override URL, don't auto-switch sources.
                        if (currentVideoLesson.videoUrlOverride) {
                          setLessonVideoError('Video failed to load from the configured Cloudinary URL. Please verify the asset exists and is public.');
                          return;
                        }

                        // Retry same source up to 2 times before switching (helps with transient network issues)
                        if (lessonVideoRetryCount < 2) {
                          console.log('[Video] Retrying same source (attempt', lessonVideoRetryCount + 1, ')...');
                          setLessonVideoRetryCount(prev => prev + 1);
                          return;
                        }

                        // Reset retry count for next source
                        setLessonVideoRetryCount(0);

                        // Prevent infinite fallback loops - max 3 source switches
                        if (lessonVideoFallbackAttempts >= 3) {
                          console.error('[Video] All sources exhausted for:', currentVideoLesson.filename);
                          setLessonVideoError(
                            'Video failed to load. Please try refreshing the page or check your internet connection. If the issue persists, contact support.'
                          );
                          return;
                        }

                        // Increment fallback counter
                        setLessonVideoFallbackAttempts(prev => prev + 1);

                        // Fallback chain based on current state
                        if (lessonVideoSource === 'r2' && lessonVideoR2Variant === 'lessons') {
                          // R2 /lessons/ failed, try R2 root path
                          console.log('[Video] R2 /lessons/ failed, trying R2 root variant...');
                          setLessonVideoR2Variant('root');
                          return;
                        }
                        if (lessonVideoSource === 'r2' && lessonVideoR2Variant === 'root') {
                          // R2 root also failed, fallback to Cloudinary
                          console.log('[Video] R2 root failed, falling back to Cloudinary...');
                          setLessonVideoSource('cloudinary');
                          return;
                        }
                        if (lessonVideoSource === 'cloudinary') {
                          // Cloudinary failed, try R2 as final fallback
                          console.log('[Video] Cloudinary failed, trying R2...');
                          setLessonVideoSource('r2');
                          setLessonVideoR2Variant('lessons');
                          return;
                        }

                        // Should not reach here, but just in case
                        console.error('[Video] Unexpected state for:', currentVideoLesson.filename);
                        setLessonVideoError(
                          'Video failed to load. Please try refreshing the page or check your internet connection. If the issue persists, contact support.'
                        );
                      }}
                    />
                  );
                })()
              )}
            </div>

            {lessonVideoError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8">
                <p className="text-red-300 text-sm">{lessonVideoError}</p>
                <p className="text-gray-400 text-xs mt-2">
                  This may be due to slow internet, browser restrictions, or mobile data limits.
                  Try using Wi-Fi, refreshing the page, or using a different browser.
                </p>
                <div className="flex flex-wrap gap-3 mt-3">
                  <button
                    onClick={() => {
                      // Reset and try again from the beginning
                      const normalizedFilename = normalizeFilenameKey(currentVideoLesson?.filename || '');
                      setLessonVideoSource(VIDEO_SOURCES[normalizedFilename] || 'cloudinary');
                      setLessonVideoR2Variant('lessons');
                      setLessonVideoError(null);
                      setLessonVideoFallbackAttempts(0);
                      setLessonVideoRetryCount(0);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </button>
                  {currentVideoLesson && (
                    <a
                      href={
                        currentVideoLesson.videoUrlOverride ??
                        getLessonVideoUrl(currentVideoLesson.filename, lessonVideoSource, lessonVideoR2Variant)
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open in New Tab
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Lesson info */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                {currentVideoLesson.title}
                {completedLessons.has(currentVideoLesson.id) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Completed
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-4 text-gray-400">
              </div>
            </div>

            {currentVideoLesson.externalLinkUrl && currentVideoLesson.externalLinkTitle ? (
              <div className="mb-6">
                <a
                  href={currentVideoLesson.externalLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {currentVideoLesson.externalLinkTitle}
                </a>
              </div>
            ) : currentVideoLesson.resources && currentVideoLesson.resources.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">
                  Downloadable Resources
                </h3>
                <ul className="space-y-2">
                  {currentVideoLesson.resources.map((resource, index) => (
                    <li key={index}>
                      <a
                        href={encodeURI(resource.url)}
                        download
                        onClick={() => console.log('Downloading:', encodeURI(resource.url))}
                        className="flex items-center justify-between px-4 py-2 bg-gray-850 hover:bg-gray-800 rounded-lg transition-colors text-emerald-400 hover:text-emerald-300 group"
                      >
                        <span className="text-sm font-medium truncate">{resource.title}</span>
                        <svg className="w-4 h-4 flex-shrink-0 ml-3 stroke-emerald-400 group-hover:stroke-emerald-300 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* External Links (Multiple) — rendered after resources */}
            {currentVideoLesson.externalLinks && currentVideoLesson.externalLinks.length > 0 && (
              <div className="mb-6 space-y-2">
                {currentVideoLesson.externalLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {link.title}
                  </a>
                ))}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between border-t border-gray-800 pt-6">
              <button
                onClick={goToPrevVideoLesson}
                disabled={isFirstLesson}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={goToNextVideoLesson}
                disabled={isLastLesson}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>


          </div>
        ) : (
          <div className="p-6 lg:p-8">
            {/* Show search bar based on active tab */}
            {activeTab === 'lessons' && (
              <div className="w-full">
                {/* Search bar */}
                <div className="w-full max-w-md mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search lessons..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Category tabs */}
                <div className="flex gap-2 mb-8 flex-wrap">
                  {(['ALL', 'LEARN', 'FREE WAY', 'PAID AI', 'HACKS', 'HISTORY'] as LessonCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setLessonCategory(cat)}
                      className={`px-5 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 ${lessonCategory === cat
                          ? cat === 'ALL'
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                            : cat === 'LEARN'
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                              : cat === 'HACKS'
                                ? 'bg-yellow-500 text-gray-900 shadow-lg shadow-yellow-500/20'
                                : cat === 'HISTORY'
                                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                  : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
                        }`}
                    >
                      {cat === 'HISTORY' ? 'HISTORY' : cat}
                    </button>
                  ))}
                </div>

                {/* Lesson Cards Grid */}
                {lessonCategory === 'HISTORY' && filteredLessons.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                      <span className="text-3xl">🎬</span>
                    </div>
                    <p className="text-gray-400 font-medium mb-1">No watch history yet</p>
                    <p className="text-gray-600 text-sm">Start watching lessons and they'll appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredLessons.map((lesson) => {
                      const isUnlocked = isLessonUnlocked(lesson.id);
                      const isCompleted = completedLessons.has(lesson.id);
                      const histEntry = watchHistory[String(lesson.id)];
                      const progress = histEntry?.duration
                        ? Math.min((histEntry.currentTime / histEntry.duration) * 100, 100)
                        : 0;
                      const catLabel = LESSON_CATEGORY_MAP[lesson.id] ?? 'ALL';

                      return (
                        <div
                          key={lesson.id}
                          onClick={() => {
                            if (isUnlocked) {
                              openLesson(lesson);
                            }
                          }}
                          className={`bg-gray-900 border border-gray-800 rounded-xl overflow-hidden transition-all ${isUnlocked
                              ? 'hover:border-emerald-500/50 cursor-pointer group'
                              : 'opacity-60 cursor-not-allowed'
                            }`}
                        >
                          {/* Video Thumbnail */}
                          <div className="aspect-video bg-gray-800 relative">
                            {isUnlocked ? (
                              <>
                                {lesson.thumbnail ? (
                                  <img src={lesson.thumbnail} alt={lesson.title} className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                    <Play className="w-10 h-10 text-gray-600" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <Play className="w-8 h-8 text-white ml-1" />
                                  </div>
                                </div>
                                {/* Progress bar at bottom of card (green when completed) */}
                                {isCompleted || progress > 0 ? (
                                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                                    <div
                                      className={`h-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-red-500'}`}
                                      style={{ width: isCompleted ? '100%' : `${progress}%` }}
                                    />
                                  </div>
                                ) : null}
                                {/* Completed badge */}
                                {isCompleted && (
                                  <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-emerald-500/90 flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 px-4">
                                <Lock className="w-12 h-12 text-gray-600 mb-3" />
                                <span className="text-gray-400 text-sm text-center font-medium mb-1">Watch the full video</span>
                              </div>
                            )}
                          </div>

                          {/* Card Content */}
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  catLabel === 'LEARN' ? 'bg-emerald-500/10 text-emerald-400' :
                                  catLabel === 'FREE WAY' ? 'bg-teal-500/10 text-teal-400' :
                                  catLabel === 'PAID AI' ? 'bg-violet-500/10 text-violet-400' :
                                  catLabel === 'HACKS' ? 'bg-yellow-500/10 text-yellow-400' :
                                  catLabel === 'CREATE' ? 'bg-blue-500/10 text-blue-400' :
                                  'bg-gray-500/10 text-gray-400'
                                }`}>
                                {catLabel}
                              </span>
                            </div>
                            <h3 className={`font-semibold mb-2 line-clamp-2 ${isUnlocked ? 'text-white group-hover:text-emerald-400 transition-colors' : 'text-gray-500'
                              }`}>
                              {lesson.title.replace(/^Lesson\s+\d+:\s*/i, '')}
                            </h3>
                            {/* Last watched label - visible in ALL tabs if watched, prominent in HISTORY */}
                            {histEntry && (
                              <p className="text-xs text-gray-500 mt-1">
                                Last watched {timeAgo(histEntry.lastWatchedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}


            {activeTab === 'files' && (
              <div className="w-full max-w-md mb-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {activeTab === 'bgm' && (
              <div className="w-full max-w-md mb-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search BGM and SFX..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}


            {/* Files content */}
            {activeTab === 'files' && (
              <div className="w-full max-w-4xl">
                {filesLoading ? (
                  <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                    <p className="text-gray-400">Loading files...</p>
                  </div>
                ) : filesError ? (
                  <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                    <div className="text-red-500 text-center">
                      <p className="font-semibold mb-2">Failed to load files</p>
                      <p className="text-sm text-gray-400">{filesError}</p>
                    </div>
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="flex items-center justify-center h-[50vh]">
                    <p className="text-gray-500">
                      {courseFiles.length === 0 ? 'No files available' : 'No matching files found'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-emerald-500 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                              {file.type === 'pdf' && (
                                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              )}
                              {file.type === 'word' && (
                                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                              {file.type === 'link' && (
                                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 010 5.656l-1.414 1.414a4 4 0 01-5.656-5.656l1.414-1.414m3.536 3.536a4 4 0 010-5.656l1.414-1.414a4 4 0 115.656 5.656l-1.414 1.414" />
                                </svg>
                              )}
                              {!['pdf', 'word', 'link'].includes(file.type) && (
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-medium truncate">{file.name}</h3>
                              <p className="text-gray-400 text-sm">
                                {file.type === 'link' ? 'External link (Google Drive)' : `${(file.size / 1024).toFixed(2)} KB`}
                              </p>
                            </div>
                          </div>
                          {file.type === 'link' ? (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7v7m0-7L10 14m-4 0h4v4H6a3 3 0 01-3-3V6a3 3 0 013-3h4v4H6v8z" />
                              </svg>
                              Open
                            </a>
                          ) : (
                            <a
                              href={file.url}
                              download={file.name}
                              className="flex-shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* BGM and SFX content */}
            {activeTab === 'bgm' && (
              <div className="w-full max-w-6xl">
                {filteredBgmFiles.length === 0 ? (
                  <div className="flex items-center justify-center h-[50vh]">
                    <p className="text-gray-500">No matching files found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBgmFiles.map((file) => (
                      <div
                        key={file.id}
                        className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-emerald-500 transition-colors flex flex-col gap-3"
                      >
                        {/* Header row */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-white font-medium text-sm leading-snug line-clamp-2">{file.name}</h3>
                            <p className="text-gray-400 text-xs mt-0.5">MP3 Audio</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBgmPlayPause(file)}
                            disabled={!file.url}
                            className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {playingBgmId === file.id ? (
                              <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                </svg>
                                Pause
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                                Play
                              </>
                            )}
                          </button>
                          <a
                            href={file.url || '#'}
                            download={file.name + '.mp3'}
                            aria-disabled={!file.url}
                            className={`flex-1 px-3 py-2 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${file.url
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-gray-700 opacity-40 cursor-not-allowed pointer-events-none'
                              }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Webinar Archive content */}
            {activeTab === 'webinar' && (
              <div className="w-full max-w-4xl">
                <div className="grid gap-4">
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-emerald-500 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 010 5.656l-1.414 1.414a4 4 0 01-5.656-5.656l1.414-1.414m3.536 3.536a4 4 0 010-5.656l1.414-1.414a4 4 0 115.656 5.656l-1.414 1.414" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate">Faceless FB Page From Scratch (5H)</h3>
                          <p className="text-gray-400 text-sm">External link (Google Drive)</p>
                        </div>
                      </div>
                      <a
                        href="https://drive.google.com/drive/folders/1KJSsQRRyJKOazsxfaAvJfZ2_MOf5HjDq?usp=sharing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7v7m0-7L10 14m-4 0h4v4H6a3 3 0 01-3-3V6a3 3 0 013-3h4v4H6v8z" />
                        </svg>
                        Open
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lessons' && !currentVideoLesson && (
              <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <BookOpen className="w-16 h-16 text-gray-600" />
                <p className="text-gray-500 text-lg">Select a lesson to begin</p>
                <button
                  onClick={() => openLesson(LESSON_VIDEOS[0])}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Start with Lesson 1
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function CourseLearnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading course content...</p>
          </div>
        </div>
      }
    >
      <CourseLearnPageContent />
    </Suspense>
  );
}
