// ============================================================
// Course curriculum data
// Single source of truth for the lesson list, shared by the
// course home page (progress/resume) and the lesson player page.
// ============================================================

export type LessonCategory = 'ALL' | 'LEARN' | 'FREE WAY' | 'PAID AI' | 'HACKS' | 'CREATE' | 'HISTORY';

export interface LessonVideoEntry {
  id: number;
  title: string;
  filename: string;
  duration: number;
  thumbnail: string | null;
  category?: LessonCategory;
  youtubeEmbedUrl?: string;
  vimeoId?: string;
  videoUrlOverride?: string;
  resources?: {
    title: string;
    url: string;
  }[];
  externalLinkTitle?: string;
  externalLinkUrl?: string;
  externalLinks?: {
    title: string;
    url: string;
  }[];
}

// Lesson videos — ordered per course curriculum
export const LESSON_VIDEOS: LessonVideoEntry[] = [
  // 0
  {
    id: 110,
    title: 'Introduction Video',
    filename: 'Introduction Video.mp4',
    duration: 10,
    thumbnail: '/thumbnails/introduction-video.png',
    vimeoId: '1193122511?h=171c0b7404',
  },
  // 1
  {
    id: 101,
    title: 'FACEBOOK FACELESS',
    filename: 'FACEBOOK FACELESS.mp4',
    duration: 12,
    thumbnail: '/thumbnails/facebook-faceless.png',
    vimeoId: '1192460249?h=a872a340d9',
  },
  // 2
  {
    id: 3,
    title: 'Niches That Print Money',
    filename: 'Niches That Print Money.mp4',
    duration: 15,
    thumbnail: '/thumbnails/niches-that-print-money.png',
    vimeoId: '1186114388',
  },
  // 3
  {
    id: 102,
    title: 'NICHE AND STYLE',
    filename: 'NICHE AND STYLE.mp4',
    duration: 12,
    thumbnail: '/thumbnails/niche-and-style.png',
    vimeoId: '1192460255?h=fc32eb57ce',
    resources: [{ title: 'NICHES & STYLE', url: '/files/NICHES AND STYLE.pdf' }],
  },
  // 4
  {
    id: 103,
    title: 'HOW TO TARGET US AUDIENCE',
    filename: 'HOW TO TARGET US AUDIENCE.mp4',
    duration: 12,
    thumbnail: '/thumbnails/how-to-target-us-audience.png',
    vimeoId: '1192460266?h=33bc3c5c00',
    resources: [{ title: 'How to Target US Audience', url: '/files/def.pdf' }],
  },
  // 5
  {
    id: 105,
    title: 'FB SET UP AND PAGE SET UP',
    filename: 'FB SET UP AND PAGE SET UP.mp4',
    duration: 12,
    thumbnail: '/thumbnails/fb-set-up-and-page-set-up.png',
    vimeoId: '1192460383?h=aea5136aec',
    resources: [{ title: 'PROMPT', url: '/files/PROMPT.pdf' }],
  },
  // 6
  {
    id: 106,
    title: 'AI Generated Policies',
    filename: 'AI Generated Policies.mp4',
    duration: 12,
    thumbnail: '/thumbnails/ai-generated-policies.png',
    vimeoId: '1192461093?h=c5dab1dfbf',
    resources: [{ title: 'AI Generated Policies', url: '/files/AI generated Policies.jpg' }],
  },
  // 7
  {
    id: 4,
    title: 'How to Go Viral on Facebook Page',
    filename: 'HOW TO GO VIRAL ON FACEBOOK PAGE.mp4',
    duration: 15,
    thumbnail: '/thumbnails/how-to-go-viral-on-facebook.png',
    vimeoId: '1186114435',
  },
  // 8
  {
    id: 7,
    title: 'Organic Growth How to Gain Followers Fast',
    filename: 'Organic Growth How to Gain Followers Fast.mp4',
    duration: 15,
    thumbnail: '/thumbnails/organic-growth-how-to-gain-followers-fast.png',
    vimeoId: '1186114872',
  },
  // 9
  {
    id: 35,
    title: "LET'S TALK ABOUT MONETIZATION",
    filename: "LET'S TALK ABOUT MONETIZATION.mp4",
    duration: 12,
    thumbnail: '/thumbnails/lets-talk-about-monetization.png',
    vimeoId: '1186114930',
    externalLinks: [
      { title: 'How to Apply for Digital TIN ID Using ORUS', url: 'https://youtu.be/YcuU-unmryA?si=aFsSfDsICWTICDCb' },
      { title: 'HOW TO SET UP', url: 'https://youtu.be/4R3EWyVhKM0?si=z_Var33jyZ7E9dxT' },
    ],
    resources: [{ title: "LET'S TALK ABOUT MONETIZATION", url: "/files/LET'S TALK ABOUT MONETIZATION.pdf" }],
  },
  // 10
  {
    id: 38,
    title: 'Avoiding Violations (Fix & Prevent)',
    filename: 'Avoiding Violations (Fix & Prevent).mp4',
    duration: 12,
    thumbnail: '/thumbnails/avoiding-violations.png',
    vimeoId: '1186722240',
    resources: [{ title: 'Facebook Violations Guide', url: '/files/FACEBOOK VIOLATIONS GUIDE.pdf' }],
  },
  // 11
  {
    id: 37,
    title: 'AI Tools for Faceless Content',
    filename: 'AI Tools for Faceless Content.mp4',
    duration: 12,
    thumbnail: '/thumbnails/ai-tools-for-faceless-content.png',
    vimeoId: '1186722144',
    resources: [{ title: 'AI Tools for Faceless Content', url: '/files/AI Tools for Faceless Content.pdf' }],
  },
  // 12
  {
    id: 34,
    title: 'RESTRICT A SPECIFIC COUNTRY',
    filename: 'RESTRICT A SPECIFIC COUNTRY.mp4',
    duration: 12,
    thumbnail: '/thumbnails/restrict-a-specific-country.png',
    vimeoId: '1186115214',
  },
  // 13
  {
    id: 10,
    title: 'HOW TO USE CAPCUT',
    filename: 'HOW TO USE CAPCUT.mp4',
    duration: 12,
    thumbnail: '/thumbnails/how-to-use-capcut.png',
    vimeoId: '1186115127',
  },
  // 14
  {
    id: 11,
    title: 'PC CapCut Bypass',
    filename: 'pc capcut bypass.mp4',
    duration: 15,
    thumbnail: '/thumbnails/pc-capcut-pro-bypass.png',
    vimeoId: '1186115654',
  },
  // 15
  {
    id: 36,
    title: 'Free Capcut Pro',
    filename: 'Free Capcut Pro.mp4',
    duration: 10,
    thumbnail: '/thumbnails/free-capcut-pro.png',
    vimeoId: '1186115378',
    externalLinks: [{ title: 'Join Telegram Access', url: 'https://t.me/+XVXDbe5gwaZhMWE1' }],
  },
  // 16
  {
    id: 32,
    title: 'INTRODUCING STREVIO',
    filename: 'INTRODUCING STREVIO.mp4',
    duration: 12,
    thumbnail: '/thumbnails/introducing-strevio.png',
    vimeoId: '1186118016',
    externalLinkTitle: 'Open Strevio',
    externalLinkUrl: 'https://strevio.com/',
  },
  // 17
  {
    id: 12,
    title: 'Saan I-Download ang Nakuhang Content na 1080P',
    filename: '16. SAAN I-DOWNLOAD ANG NAKUHANG CONTENT NA 1080P.mp4',
    duration: 10,
    thumbnail: '/thumbnails/saan-i-download-ang-nakuhang-clip-1080p.png',
    vimeoId: '1186115684',
  },
  // 18
  {
    id: 14,
    title: 'Create Content with Free Tools',
    filename: 'Create Content with Free Tools.mp4',
    duration: 15,
    thumbnail: '/thumbnails/create-content-with-free-tools.png',
    vimeoId: '1192776348?h=a609129ccc',
    resources: [{ title: 'Create Content with Free Tools', url: '/files/fruits.pdf' }],
  },
  // 19
  {
    id: 15,
    title: 'FACELESS FARM CONTENT GUIDE',
    filename: 'FACLESS FARM CONTENT GUIDE.mp4',
    duration: 12,
    thumbnail: '/thumbnails/faceless-farm-content.png',
    vimeoId: '1186116116',
    resources: [{ title: 'FACELESS FARM CONTENT GUIDE', url: '/files/FACELESS FARM CONTENT GUIDE.pdf' }],
  },
  // 20
  {
    id: 16,
    title: 'HOW TO AVOID COPYRIGHT STRIKES',
    filename: 'LESSON 5. VID EDITING BY MY VID EDITOR.mp4',
    duration: 20,
    thumbnail: '/thumbnails/how-to-avoid-copyright-strikes.png',
    vimeoId: '1186116343',
  },
  // 21
  {
    id: 20,
    title: 'From Basic to Advanced Image Creation',
    filename: 'From Basic to Advanced Image Creation.mp4',
    duration: 15,
    thumbnail: '/thumbnails/from-basic-to-advanced-image-creation.png',
    vimeoId: '1186116467',
    resources: [{ title: 'Photo prompt', url: '/files/Photo prompt.pdf' }],
    externalLinks: [{ title: 'Canva Team Invite', url: 'https://www.canva.com/brand/join?token=BoSL0_UUUKhZIp5EuDhIYw&referrer=team-invite' }],
  },
  // 22
  {
    id: 19,
    title: 'Paano Ako Kumita ng 6 Digits sa Story',
    filename: 'Paano Ako Kumita ng 6 Digits sa Story.mp4',
    duration: 22,
    thumbnail: '/thumbnails/paano-ako-kumita-ng-6-digits-sa-story.png',
    vimeoId: '1186116432',
  },
  // 23
  {
    id: 30,
    title: 'How to Setup Payhip Store for your digital products',
    filename: 'Lesson 26. How to Setup Payhip Store for your digital products.mp4',
    duration: 15,
    thumbnail: '/thumbnails/how-to-setup-payhip-store.png',
    videoUrlOverride: 'https://vwpbdtglrkgmxuprtgpk.supabase.co/storage/v1/object/public/Pislis/Lesson%2026.%20How%20to%20Setup%20Payhip%20Store%20for%20your%20digital%20products.mp4',
    externalLinks: [{ title: 'PAYHIP STORE SET UP', url: 'https://youtu.be/V_fDDWyaMcg?si=Jzes_A2gjvGFdNPS' }],
  },
  // 24
  {
    id: 108,
    title: 'COMMON QUESTION',
    filename: 'COMMON QUESTION.mp4',
    duration: 12,
    thumbnail: '/thumbnails/common-question.png',
    vimeoId: '1192464311?h=cf68c13f3c',
  },
  // 25
  {
    id: 104,
    title: '3D Animation Style & General Niche',
    filename: '3D Animation Style & General Niche.mp4',
    duration: 12,
    thumbnail: '/thumbnails/3d-animation-style-and-general-niche.png',
    vimeoId: '1192460265?h=395d9910fc',
    resources: [
      { title: '3D Animation Prompt', url: '/files/3D Animation Prompt.pdf' },
      { title: 'Fundamentals of Reels Animation', url: '/files/Fundamentals of Reels Animation.pdf' },
    ],
  },
  // 26
  {
    id: 107,
    title: 'SKELETON STYLE',
    filename: 'SKELETON STYLE.mp4',
    duration: 12,
    thumbnail: '/thumbnails/skeleton-style.png',
    vimeoId: '1192464047?h=6e80cbe423',
    resources: [
      { title: 'SKELETON STRUCTURE PROMPT', url: '/files/SKELETON STRUCTURE PROMPT.pdf' },
      { title: 'SKELETON WORKFLOW', url: '/files/SKELETON WORKFLOW.pdf' },
    ],
  },
  // 27
  {
    id: 29,
    title: 'Awareness!!',
    filename: '21. Awareness!!.mp4',
    duration: 12,
    thumbnail: '/thumbnails/awareness.png',
    vimeoId: '1186117734',
  },
  // 28
  {
    id: 109,
    title: 'FACELESS NICHE',
    filename: 'FACELESS NICHE.mp4',
    duration: 12,
    thumbnail: '/thumbnails/faceless-niche.png',
    vimeoId: '1192868079?h=5d598cfb29',
    resources: [{ title: 'Remedies', url: '/files/Remedies.pdf' }],
  },
  // 29
  {
    id: 111,
    title: 'FREE AI IMAGE TO VIDEO TOOLS',
    filename: 'FREE AI IMAGE TO VIDEO TOOLS.mp4',
    duration: 12,
    thumbnail: '/thumbnails/free-ai-image-to-video-tools.png',
    vimeoId: '1194270854?h=c32fbd7a84',
    resources: [{ title: 'FREE AI TOOLS FOR IMAGE TO VIDEO', url: '/files/FREE AI TOOLS FOR IMAGE TO VIDEO.pdf' }],
  },
];

// Maps lesson ID → category
export const LESSON_CATEGORY_MAP: Record<number, LessonCategory> = {
  // LEARN
  110: 'LEARN', // Introduction Video
  101: 'LEARN', // FACEBOOK FACELESS
  3:   'LEARN', // Niches That Print Money
  102: 'LEARN', // NICHE AND STYLE
  103: 'LEARN', // HOW TO TARGET US AUDIENCE
  106: 'LEARN', // AI Generated Policies
  4:   'LEARN', // How to Go Viral on Facebook Page
  7:   'LEARN', // Organic Growth How to Gain Followers Fast
  35:  'LEARN', // LET'S TALK ABOUT MONETIZATION
  38:  'LEARN', // Avoiding Violations (Fix & Prevent)
  37:  'LEARN', // AI Tools for Faceless Content
  10:  'LEARN', // HOW TO USE CAPCUT
  12:  'LEARN', // Saan I-Download ang Nakuhang Content na 1080P
  30:  'LEARN', // How to Setup Payhip Store
  108: 'LEARN', // COMMON QUESTION
  29:  'LEARN', // Awareness!!
  // HACKS
  34:  'HACKS', // RESTRICT A SPECIFIC COUNTRY
  11:  'HACKS', // PC CapCut Bypass
  36:  'HACKS', // Free Capcut Pro
  32:  'HACKS', // INTRODUCING STREVIO
  19:  'HACKS', // Paano Ako Kumita ng 6 Digits sa Story
  // FREE WAY
  14:  'FREE WAY', // Create Content with Free Tools
  15:  'FREE WAY', // FACELESS FARM CONTENT GUIDE
  16:  'FREE WAY', // HOW TO AVOID COPYRIGHT STRIKES
  20:  'FREE WAY', // From Basic to Advanced Image Creation
  111: 'FREE WAY', // FREE AI IMAGE TO VIDEO TOOLS
  // PAID AI
  104: 'PAID AI', // 3D Animation Style & General Niche
  107: 'PAID AI', // SKELETON STYLE
  109: 'PAID AI', // FACELESS NICHE
  // CREATE
  105: 'CREATE',  // FB SET UP AND PAGE SET UP
};
