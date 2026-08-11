const STORAGE_KEY = 'weeklyResetApp_v1';
const APP_DATA_VERSION = 36;
const RETIRED_SEED_VIDEO_IDS = new Set(["yrYUfRt7k60", "FlPWNSn0YHQ", "UxstRqRaIPs", "bkGSwCg0_O0", "3pgB6eqk_bI", "mzEbSFBgQGk", "A_sdIeOgPX0", "uqKLz3HRLJg", "BIdaEuLkAnM", "EYngvIvMvSo", "alt9hfrnsA4", "DqPMk-GhT6s", "jE-dDQdwRwc", "FFPDeaG_8Dg", "AE-GTSE9MBM", "sW4EUzrcnTs", "FrCPFm0nZ6U", "QQg6QQrPdJQ", "BzG5Af5HTfQ", "I5S7L4k0e9U", "-fkySqtdlxo", "JHWv-vgn_QY", "RIi72ZNqRCQ", "D3TC-tz3TeQ", "4pfCBO3BGvg", "_Rg7nToY1dg", "WoTKGyCM7Jk", "e5Ou7dskEGM", "BegW_l4IJFQ", "M7qogNry8t4", "-9Dfa3_CCvg", "k_ShNZ1ksYs", "H5-LhJ1I-hQ", "DwhVA8y7_l0", "V7NLxB373Ro", "BwStwvbizIM", "imWc_27U9w8", "60T1eRQzlGw", "6RIbWni5JVk", "2eA2Koq6pTI", "5P6PlsGfcQU", "JdSHPSSMVq4", "Agu4EnLxAGM", "aZYDtjc5koQ", "UMGkQ9FmbGg", "32DsAJUru8E", "47EwctVwir4", "zYInbggfukg"]);
const TZ = 'America/Toronto';
const RETIRED_CHANNEL_NAMES = new Set(['jessica valant pilates', 'jessica valant']);
function isRetiredChannelName(name = '') { return RETIRED_CHANNEL_NAMES.has(String(name || '').trim().toLowerCase()); }

const focusLabels = {
  postpartum: '产后核心', mobility: '恢复活动度', pilates: '垫上 Pilates',
  glutes: '臀部稳定', meditation: '冥想放松', cardio: '有氧'
};
const positionLabels = { mat: '垫上为主', mixed: '混合', standing: '站立为主' };
const riskLabels = { low: '低腹压', medium: '中等腹压', high: '较高腹压' };
const modeLabels = { recovery: '恢复期', stable: '稳定期', progress: '进阶期' };
const statusLabels = { completed: '全部完成', partial: '部分完成', swapped: '更换训练', skipped: '跳过' };
const channelUsageLabels = { primary: '主要候选', secondary: '次要候选', occasional: '低频使用', reserve: '高强度备用' };
const menstrualFlowLabels = { light: '偏少', medium: '正常', heavy: '偏多' };
const menstrualSymptomLabels = { cramps: '腹痛/痉挛', fatigue: '疲劳', back: '腰背酸痛', headache: '头痛/头晕', bloating: '腹胀' };
const menstrualSafetyLabels = { safe: '生理期可用', abs: '含腹肌训练', inversion: '含臀桥/骨盆抬高', unknown: '生理期动作未确认' };

const defaultChannels = [
  { name: 'Pregnancy and Postpartum TV', id: '', usage: 'primary' },
  { name: 'Move With Nicole', id: '', usage: 'secondary' },
  { name: 'Mady Morrison', id: '', usage: 'primary' },
  { name: 'Dr. Sara Duvall', id: '', usage: 'primary' },
  { name: 'Yoga With Adriene', id: '', usage: 'secondary' },
  { name: 'MIZI', id: '', usage: 'occasional' },
  { name: 'Heather Robertson', id: 'UCOpsZxrmeDARilha1uq4slA', usage: 'reserve' }
];

function youtubeWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
function youtubeThumbnail(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
function extractYouTubeVideoId(value = '') {
  const raw = String(value).trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
    if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || null;
    if (host === 'youtube.com' || host === 'music.youtube.com') {
      if (url.pathname === '/watch') return url.searchParams.get('v');
      const match = url.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{6,})/);
      return match?.[1] || null;
    }
  } catch (_) {
    if (/^[A-Za-z0-9_-]{6,}$/.test(raw)) return raw;
  }
  return null;
}
function normalizeYouTubeVideoUrl(value = '') {
  const id = extractYouTubeVideoId(value);
  return id ? youtubeWatchUrl(id) : null;
}
function hasDirectVideoUrl(video) {
  return !!normalizeYouTubeVideoUrl(video?.url || '');
}
function isAppleTouchDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function isStandaloneApp() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function openYouTubeUrl(url) {
  const normalized = normalizeYouTubeVideoUrl(url || '');
  if (!normalized) { showToast('这条记录缺少有效的 YouTube 视频链接'); return false; }
  // YouTube 的 HTTPS 通用链接会在 iPad 已安装 YouTube 时直接切换到 App；未安装时回退到网页。
  window.location.assign(normalized);
  return false;
}
window.openYouTubeFromApp = function(event, url) {
  event?.preventDefault?.();
  return openYouTubeUrl(url);
};
function videoLinkMarkup(video, label = '播放', className = 'icon-action') {
  const url = normalizeYouTubeVideoUrl(video?.url || '');
  return url
    ? `<a class="${className} youtube-app-link" href="${escapeHtml(url)}" onclick="return openYouTubeFromApp(event, this.href)">${escapeHtml(label)}</a>`
    : `<button class="${className}" disabled title="请先为这条记录添加单个 YouTube 视频链接">缺少直达链接</button>`;
}

function videoSafetyText(video = {}) {
  return `${video.title || ''} ${video.note || ''} ${video.description || ''}`.toLowerCase();
}
function inferKneeFriendly(video = {}) {
  if (typeof video.kneeFriendly === 'boolean') return video.kneeFriendly;
  const text = videoSafetyText(video);
  return /knee[ -]?friendly|sensitive knees?|easy on (?:the )?knees?|no squats?(?:[^a-z]+|.*)no lunges?|no lunges?(?:[^a-z]+|.*)no squats?|no kneeling/i.test(text);
}
function videoPreference(video = {}) {
  return ['favorite','dislike'].includes(video.preference) ? video.preference : 'neutral';
}
function setVideoPreference(videoId, preference = 'neutral') {
  const video = state.videos.find(item => String(item.id) === String(videoId));
  if (!video) return;
  const next = ['favorite','dislike'].includes(preference) ? preference : 'neutral';
  video.preference = videoPreference(video) === next ? 'neutral' : next;
  saveState();
  renderLibrary();
  if (video.preference === 'favorite') showToast('已标记喜欢：未来排课会适度提高优先级，但仍遵守跨周与近期去重。');
  else if (video.preference === 'dislike') showToast('已标记不喜欢：未来自动排课将不再选择这条视频。当前已锁定计划不会自动改变。');
  else showToast('已取消视频偏好标记');
}
function inferAbTraining(video = {}) {
  if (typeof video.abTraining === 'boolean') return video.abTraining;
  const text = videoSafetyText(video);
  return !!video.crunchHeavy || ['postpartum','pilates','glutes'].includes(video.focus)
    || /\b(abs?|abdominal|core|diastasis|pelvic floor|pilates|six pack|waist|oblique)\b/i.test(text);
}
function inferPelvicInversion(video = {}) {
  if (typeof video.pelvicInversion === 'boolean') return video.pelvicInversion;
  const text = videoSafetyText(video);
  return video.focus === 'glutes'
    || /\b(glute bridge|bridge pose|shoulder bridge|hip thrust|hip lift|reverse table(?:top)?|wheel pose|legs up|inversion|booty|glute)\b/i.test(text)
    || ['pilates','postpartum'].includes(video.focus);
}
function inferMenstrualEligible(video = {}) {
  if (typeof video.menstrualEligible === 'boolean') return video.menstrualEligible;
  if (inferAbTraining(video) || inferPelvicInversion(video)) return false;
  const text = videoSafetyText(video);
  if (video.focus === 'meditation') return !/\b(yoga|stretch|flow|vinyasa)\b/i.test(text);
  if (video.focus === 'mobility') {
    const clearSafe = /\b(neck|shoulder|upper back|posture|seated|standing stretch|breath|breathing|relax|meditation|wrist|gentle walk|walking)\b/i.test(text);
    const uncertain = /\b(full body|lower body|hip|hamstring|yoga|sun salutation|vinyasa|power yoga)\b/i.test(text);
    return clearSafe && !uncertain;
  }
  if (video.focus === 'cardio' && video.position === 'standing') {
    return /\b(walk|walking|low impact)\b/i.test(text) && !/\b(abs?|core|hiit|strength)\b/i.test(text);
  }
  return false;
}
function normalizeMenstrualSafety(video = {}) {
  const normalized = { ...video };
  normalized.abTraining = inferAbTraining(normalized);
  normalized.pelvicInversion = inferPelvicInversion(normalized);
  normalized.menstrualEligible = inferMenstrualEligible(normalized) && !normalized.abTraining && !normalized.pelvicInversion;
  return normalized;
}
function isStrictMenstrualVideo(video = {}) {
  return !!video.menstrualEligible && !video.abTraining && !video.pelvicInversion;
}

const sampleVideos = [
  {
    "id": "ZLvv1gPxk8A",
    "title": "Diastasis Recti Pilates (Postnatal Pilates For Diastasis Recti Repair)",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 15,
    "focus": "postpartum",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=ZLvv1gPxk8A",
    "thumbnail": "https://i.ytimg.com/vi/ZLvv1gPxk8A/hqdefault.jpg",
    "publishedAt": "",
    "note": "你之前反馈长度和强度合适；作为产后深层核心恢复的优先候选。"
  },
  {
    "id": "DrnpHbICylI",
    "title": "Postpartum Pilates For Pelvic Floor & Core (STOP LEAKING!)",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "postpartum",
    "position": "mat",
    "risk": "low",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=DrnpHbICylI",
    "thumbnail": "https://i.ytimg.com/vi/DrnpHbICylI/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "CMSHLrVKDnM",
    "title": "15 Minute Postpartum Workout Diastasis Recti Safe",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 15,
    "focus": "postpartum",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=CMSHLrVKDnM",
    "thumbnail": "https://i.ytimg.com/vi/CMSHLrVKDnM/hqdefault.jpg",
    "publishedAt": "",
    "note": "产后全身训练候选；虽然标注腹直肌分离友好，仍需观察腹部压力反应。"
  },
  {
    "id": "xZbr_4dwsUA",
    "title": "30 Minute Full Body Pilates Workout - Pilates at Home!",
    "channel": "Jessica Valant Pilates",
    "duration": 30,
    "focus": "pilates",
    "position": "mat",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=xZbr_4dwsUA",
    "thumbnail": "https://i.ytimg.com/vi/xZbr_4dwsUA/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "s-7lyvblFNI",
    "title": "Stretches for Neck, Shoulder & Upper Back Pain Relief | 10 min.",
    "channel": "Mady Morrison",
    "duration": 10,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=s-7lyvblFNI",
    "thumbnail": "https://i.ytimg.com/vi/s-7lyvblFNI/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "BPlCatqZRPI",
    "title": "Fix your posture and reduce backpain | 10 Minute Daily Stretching Routine",
    "channel": "Mady Morrison",
    "duration": 10,
    "focus": "mobility",
    "position": "mixed",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=BPlCatqZRPI",
    "thumbnail": "https://i.ytimg.com/vi/BPlCatqZRPI/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "ni-3HCfAUnk",
    "title": "12 Min Back Pain Relief Stretch | Release Tension & Feel Better Instantly",
    "channel": "Mady Morrison",
    "duration": 12,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=ni-3HCfAUnk",
    "thumbnail": "https://i.ytimg.com/vi/ni-3HCfAUnk/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "ihba9Lw0tv4",
    "title": "10 Minute Morning Stretch for every day | Simple routine to wake up & feel good",
    "channel": "Mady Morrison",
    "duration": 10,
    "focus": "mobility",
    "position": "mixed",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=ihba9Lw0tv4",
    "thumbnail": "https://i.ytimg.com/vi/ihba9Lw0tv4/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "HzXkMnvqojE",
    "title": "Stretches for Lower Back Pain Relief & Tight Hips | 15 Min.",
    "channel": "Mady Morrison",
    "duration": 15,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=HzXkMnvqojE",
    "thumbnail": "https://i.ytimg.com/vi/HzXkMnvqojE/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "_y39T5jQfFM",
    "title": "25 MIN FEEL GOOD PILATES | At-Home Pilates Workout (No Equipment)",
    "channel": "Move With Nicole",
    "duration": 25,
    "focus": "pilates",
    "position": "mat",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=_y39T5jQfFM",
    "thumbnail": "https://i.ytimg.com/vi/_y39T5jQfFM/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "Xs6gah4DseA",
    "title": "35 MIN GENTLE PILATES || Full Body Workout (No Equipment)",
    "channel": "Move With Nicole",
    "duration": 35,
    "focus": "pilates",
    "position": "mat",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=Xs6gah4DseA",
    "thumbnail": "https://i.ytimg.com/vi/Xs6gah4DseA/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "y2RcYo36boM",
    "title": "20 MIN EXPRESS PILATES WORKOUT || Beginner to Moderate Pilates (No Equipment)",
    "channel": "Move With Nicole",
    "duration": 20,
    "focus": "pilates",
    "position": "mat",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=y2RcYo36boM",
    "thumbnail": "https://i.ytimg.com/vi/y2RcYo36boM/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "NyP_waVgL1w",
    "title": "25 MIN FULL BODY PILATES WORKOUT FOR BEGINNERS (No Equipment)",
    "channel": "Move With Nicole",
    "duration": 25,
    "focus": "pilates",
    "position": "mat",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=NyP_waVgL1w",
    "thumbnail": "https://i.ytimg.com/vi/NyP_waVgL1w/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "gDfK9zf76AY",
    "title": "20 MIN MORNING PILATES || Full Body Workout",
    "channel": "Move With Nicole",
    "duration": 20,
    "focus": "pilates",
    "position": "mat",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=gDfK9zf76AY",
    "thumbnail": "https://i.ytimg.com/vi/gDfK9zf76AY/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "XDt6xS3dI60",
    "title": "20 MIN BOOTY WORKOUT || At-Home Pilates (No Squats & No Equipment)",
    "channel": "Move With Nicole",
    "duration": 20,
    "focus": "glutes",
    "position": "mat",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=XDt6xS3dI60",
    "thumbnail": "https://i.ytimg.com/vi/XDt6xS3dI60/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "oYrgxnRDhIc",
    "title": "12 MIN BOOTY WORKOUT || Sculpting Pilates (Knee Friendly)",
    "channel": "Move With Nicole",
    "duration": 12,
    "focus": "glutes",
    "position": "mat",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=oYrgxnRDhIc",
    "thumbnail": "https://i.ytimg.com/vi/oYrgxnRDhIc/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "CscxGprl1yw",
    "title": "Stillness For Stress Relief | 15-Minute Meditation",
    "channel": "Yoga With Adriene",
    "duration": 15,
    "focus": "meditation",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=CscxGprl1yw",
    "thumbnail": "https://i.ytimg.com/vi/CscxGprl1yw/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "X3-gKPNyrTA",
    "title": "Yoga For Neck, Shoulders, Upper Back | 10-Minute Yoga Quickie",
    "channel": "Yoga With Adriene",
    "duration": 10,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=X3-gKPNyrTA",
    "thumbnail": "https://i.ytimg.com/vi/X3-gKPNyrTA/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "mgpjd4JMSZg",
    "title": "Upper Back and Neck Mobility | 13-Minute Yoga Practice",
    "channel": "Yoga With Adriene",
    "duration": 13,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=mgpjd4JMSZg",
    "thumbnail": "https://i.ytimg.com/vi/mgpjd4JMSZg/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "j4-7XX2AhAs",
    "title": "Regulate Your Nervous System | 15 Minute Yoga Practice",
    "channel": "Yoga With Adriene",
    "duration": 15,
    "focus": "meditation",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=j4-7XX2AhAs",
    "thumbnail": "https://i.ytimg.com/vi/j4-7XX2AhAs/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "62rrpPfiAoI",
    "title": "25-Minute Upper Body Yoga | Feel Good Flow",
    "channel": "Yoga With Adriene",
    "duration": 25,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=62rrpPfiAoI",
    "thumbnail": "https://i.ytimg.com/vi/62rrpPfiAoI/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "SedzswEwpPw",
    "title": "Yoga for Neck and Shoulder Relief - Yoga With Adriene",
    "channel": "Yoga With Adriene",
    "duration": 17,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=SedzswEwpPw",
    "thumbnail": "https://i.ytimg.com/vi/SedzswEwpPw/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "fKL795a4vHA",
    "title": "15 MIN Calorie Burner Fat Burn Home Workout (Low Impact & Knee Friendly)",
    "channel": "MIZI",
    "duration": 15,
    "focus": "cardio",
    "position": "standing",
    "risk": "medium",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=fKL795a4vHA",
    "thumbnail": "https://i.ytimg.com/vi/fKL795a4vHA/hqdefault.jpg",
    "publishedAt": "",
    "note": "MIZI 低冲击站立有氧；仅在恢复良好且足部、膝盖无不适时低频使用。"
  },
  {
    "id": "VcBgwCgoKH0",
    "title": "Full Body Fat Burning Workout at Home 20 Min Standing Workout - No Jumping",
    "channel": "MIZI",
    "duration": 20,
    "focus": "cardio",
    "position": "standing",
    "risk": "medium",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=VcBgwCgoKH0",
    "thumbnail": "https://i.ytimg.com/vi/VcBgwCgoKH0/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置备用视频；首次跟练前请根据当日状态确认是否合适。"
  },
  {
    "id": "zZyosxYeTSE",
    "title": "DAY 11: Mobility & Dynamic Stretch // FIERCE 2.0",
    "channel": "Heather Robertson",
    "duration": 20,
    "focus": "mobility",
    "position": "mixed",
    "risk": "medium",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=zZyosxYeTSE",
    "thumbnail": "https://i.ytimg.com/vi/zZyosxYeTSE/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置候选：Heather Robertson；高强度备用，仅恢复良好时考虑。"
  },
  {
    "id": "cA11MYXhBfI",
    "title": "20MIN Low Impact Cardio At Home Workout (No Jumping)",
    "channel": "Heather Robertson",
    "duration": 20,
    "focus": "cardio",
    "position": "standing",
    "risk": "medium",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=cA11MYXhBfI",
    "thumbnail": "https://i.ytimg.com/vi/cA11MYXhBfI/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置候选：Heather Robertson；低冲击但整体强度较高，设为备用。"
  },
  {
    "id": "H7eFjFoGkHY",
    "title": "Day 5: Active Recovery // Full Body Stretch + Mobility",
    "channel": "Heather Robertson",
    "duration": 30,
    "focus": "mobility",
    "position": "mixed",
    "risk": "low",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=H7eFjFoGkHY",
    "thumbnail": "https://i.ytimg.com/vi/H7eFjFoGkHY/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置候选：Heather Robertson；活动恢复备用。"
  },
  {
    "id": "_tPuCuiG5q8",
    "title": "10MIN Full Body Recovery / Mobility & Flexibility Routine",
    "channel": "Heather Robertson",
    "duration": 10,
    "focus": "mobility",
    "position": "mixed",
    "risk": "low",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=_tPuCuiG5q8",
    "thumbnail": "https://i.ytimg.com/vi/_tPuCuiG5q8/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置候选：Heather Robertson；短时恢复备用。"
  },
  {
    "id": "xdLxMzb7g5c",
    "title": "Full Body STRETCH & FLEXIBILITY // Fusion Flow: DAY 4",
    "channel": "Heather Robertson",
    "duration": 30,
    "focus": "mobility",
    "position": "mixed",
    "risk": "low",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=xdLxMzb7g5c",
    "thumbnail": "https://i.ytimg.com/vi/xdLxMzb7g5c/hqdefault.jpg",
    "publishedAt": "",
    "note": "内置候选：Heather Robertson；全身拉伸备用。"
  }
];


const pregnancyPostpartumExpansion = [
  {
    "id": "gRFTpwQ433U",
    "title": "Feel Good Postnatal Yoga For Core Healing and Flattening",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=gRFTpwQ433U",
    "thumbnail": "https://i.ytimg.com/vi/gRFTpwQ433U/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "TlJqbvoJ3E8",
    "title": "Best Exercises for Diastasis Recti - Postpartum Ab Workout",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 15,
    "focus": "postpartum",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=TlJqbvoJ3E8",
    "thumbnail": "https://i.ytimg.com/vi/TlJqbvoJ3E8/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "gdy9-Az8Mzg",
    "title": "18-Min Postpartum Cardio Walking Workout (Get Fit After Pregnancy)",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 18,
    "focus": "cardio",
    "position": "standing",
    "risk": "medium",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=gdy9-Az8Mzg",
    "thumbnail": "https://i.ytimg.com/vi/gdy9-Az8Mzg/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "7uzmlxnq2y8",
    "title": "15 Minute Postpartum Workout | Cardio + Pilates Abs | Diastasis Recti Safe",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 15,
    "focus": "postpartum",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=7uzmlxnq2y8",
    "thumbnail": "https://i.ytimg.com/vi/7uzmlxnq2y8/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "LVlreaCRkR4",
    "title": "Lower Belly & Pelvic Floor Healing (Postpartum Ab Exercises)",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "postpartum",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=LVlreaCRkR4",
    "thumbnail": "https://i.ytimg.com/vi/LVlreaCRkR4/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "Yh4f3jHgaJI",
    "title": "Postnatal Pilates After Pregnancy (Full Body Tone)",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "pilates",
    "position": "mat",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=Yh4f3jHgaJI",
    "thumbnail": "https://i.ytimg.com/vi/Yh4f3jHgaJI/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "jWBjDk2wIUU",
    "title": "Postpartum Ab Workout & Postpartum Pelvic Floor Exercises",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "postpartum",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=jWBjDk2wIUU",
    "thumbnail": "https://i.ytimg.com/vi/jWBjDk2wIUU/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "KRVfIKmSAl8",
    "title": "Day 2 Postpartum Workout Challenge | Postnatal Arm Workout",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "pilates",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=KRVfIKmSAl8",
    "thumbnail": "https://i.ytimg.com/vi/KRVfIKmSAl8/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "S-CMw7bCNDI",
    "title": "Indoor Walking HIIT (Pregnancy, Postpartum & Baby Wearing)",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "cardio",
    "position": "standing",
    "risk": "high",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=S-CMw7bCNDI",
    "thumbnail": "https://i.ytimg.com/vi/S-CMw7bCNDI/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 进阶备用；恢复期不会自动排入。首次跟练前请确认腹部压力、足膝和整体恢复状态。"
  },
  {
    "id": "5FyrPxLkOgY",
    "title": "30 Min Walking Workout + Ab Sculpt | Pregnancy & Postpartum Safe",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 30,
    "focus": "cardio",
    "position": "standing",
    "risk": "high",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=5FyrPxLkOgY",
    "thumbnail": "https://i.ytimg.com/vi/5FyrPxLkOgY/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 进阶备用；恢复期不会自动排入。首次跟练前请确认腹部压力、足膝和整体恢复状态。"
  },
  {
    "id": "BQE7WB6UTew",
    "title": "Postpartum Ab Exercises To Fix An Abdominal Bulge",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 10,
    "focus": "postpartum",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=BQE7WB6UTew",
    "thumbnail": "https://i.ytimg.com/vi/BQE7WB6UTew/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "AaNkPignECU",
    "title": "30-Min Postpartum Cardio + AB Finisher",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 30,
    "focus": "postpartum",
    "position": "mixed",
    "risk": "high",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": true,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=AaNkPignECU",
    "thumbnail": "https://i.ytimg.com/vi/AaNkPignECU/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 进阶备用；恢复期不会自动排入。首次跟练前请确认腹部压力、足膝和整体恢复状态。"
  },
  {
    "id": "HLMyKuH7e-k",
    "title": "20-Min Postpartum Pilates For Core Healing & Flattening",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "postpartum",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=HLMyKuH7e-k",
    "thumbnail": "https://i.ytimg.com/vi/HLMyKuH7e-k/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "sBJLnyOzHts",
    "title": "Daily Postpartum Ab Workout (28 Day Challenge After Pregnancy)",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 10,
    "focus": "postpartum",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=sBJLnyOzHts",
    "thumbnail": "https://i.ytimg.com/vi/sBJLnyOzHts/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "Lpf8kqpg86I",
    "title": "Indoor Walking Workout | Walk The Weight Off",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 30,
    "focus": "cardio",
    "position": "standing",
    "risk": "medium",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=Lpf8kqpg86I",
    "thumbnail": "https://i.ytimg.com/vi/Lpf8kqpg86I/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "ZiA8E5KIWtE",
    "title": "Indoor Walking Workout | 5000 Steps | Pregnancy & Postpartum Safe",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 40,
    "focus": "cardio",
    "position": "standing",
    "risk": "medium",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=ZiA8E5KIWtE",
    "thumbnail": "https://i.ytimg.com/vi/ZiA8E5KIWtE/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "wXuQ8ZeHcrE",
    "title": "Postnatal Pilates X Strength Training",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "glutes",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=wXuQ8ZeHcrE",
    "thumbnail": "https://i.ytimg.com/vi/wXuQ8ZeHcrE/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "ZPFc2noQGaw",
    "title": "Postnatal Pilates For Core Healing & Flattening After Pregnancy",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "postpartum",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=ZPFc2noQGaw",
    "thumbnail": "https://i.ytimg.com/vi/ZPFc2noQGaw/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "Yc2HofypTmY",
    "title": "Postpartum Yoga Flow For 6 Month+ Postpartum",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=Yc2HofypTmY",
    "thumbnail": "https://i.ytimg.com/vi/Yc2HofypTmY/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "BoCJGv8DV0w",
    "title": "Best Postpartum Ab Workout (28-Day Challenge)",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 10,
    "focus": "postpartum",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=BoCJGv8DV0w",
    "thumbnail": "https://i.ytimg.com/vi/BoCJGv8DV0w/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "pfTWYxbTS2c",
    "title": "Postpartum Pilates x Strength Workout to Tone & Strengthen",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "glutes",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=pfTWYxbTS2c",
    "thumbnail": "https://i.ytimg.com/vi/pfTWYxbTS2c/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "D7TOUSW8cI8",
    "title": "10-Min Postpartum Lower Belly Workout To Flatten & Tighten",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 10,
    "focus": "postpartum",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=D7TOUSW8cI8",
    "thumbnail": "https://i.ytimg.com/vi/D7TOUSW8cI8/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "ID8be_wh3zQ",
    "title": "Best Exercises For Postpartum Back Pain Relief",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 15,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=ID8be_wh3zQ",
    "thumbnail": "https://i.ytimg.com/vi/ID8be_wh3zQ/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "0taqjtOzY_k",
    "title": "15-Min Postnatal Pilates For Neck & Back Pain Relief",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 15,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=0taqjtOzY_k",
    "thumbnail": "https://i.ytimg.com/vi/0taqjtOzY_k/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "hheUnKUPOmY",
    "title": "Postpartum Back Pain Relief Exercises and Stretches",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 15,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=hheUnKUPOmY",
    "thumbnail": "https://i.ytimg.com/vi/hheUnKUPOmY/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "sgUkR6Rqkc4",
    "title": "Best Postpartum Stretches | Full-Body Stretch Routine",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 15,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=sgUkR6Rqkc4",
    "thumbnail": "https://i.ytimg.com/vi/sgUkR6Rqkc4/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "1n2p0Ha9Yng",
    "title": "Pelvic Floor Stretches & Manual Pelvic Floor Release",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 15,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=1n2p0Ha9Yng",
    "thumbnail": "https://i.ytimg.com/vi/1n2p0Ha9Yng/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "ERAvgQyYlc4",
    "title": "10-Min Postnatal Yoga | Release Tension and Feel Refreshed",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 10,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=ERAvgQyYlc4",
    "thumbnail": "https://i.ytimg.com/vi/ERAvgQyYlc4/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "f0jfKfCfcMY",
    "title": "Postpartum Cardio Workout (10 Minutes Only)",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 10,
    "focus": "cardio",
    "position": "standing",
    "risk": "medium",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=f0jfKfCfcMY",
    "thumbnail": "https://i.ytimg.com/vi/f0jfKfCfcMY/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "fRVCn5VZLaE",
    "title": "Day 1: 20 Min Postpartum Strength Workout",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "glutes",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=fRVCn5VZLaE",
    "thumbnail": "https://i.ytimg.com/vi/fRVCn5VZLaE/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "3d1CTLwN5ts",
    "title": "Full-Body Postpartum Workout (20-Min Tone After Baby)",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "glutes",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=3d1CTLwN5ts",
    "thumbnail": "https://i.ytimg.com/vi/3d1CTLwN5ts/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "IwSy105hNIg",
    "title": "Postnatal Yoga For A Restful Deep Sleep",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 12,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=IwSy105hNIg",
    "thumbnail": "https://i.ytimg.com/vi/IwSy105hNIg/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "soX1YVo0Lf8",
    "title": "Postpartum Cardio Workout | Full Body Tone with Optional Weights",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "cardio",
    "position": "standing",
    "risk": "high",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=soX1YVo0Lf8",
    "thumbnail": "https://i.ytimg.com/vi/soX1YVo0Lf8/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 进阶备用；恢复期不会自动排入。首次跟练前请确认腹部压力、足膝和整体恢复状态。"
  },
  {
    "id": "EH18ikq09BQ",
    "title": "Feel Good Postnatal Yoga | Feel Refreshed After This Class",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=EH18ikq09BQ",
    "thumbnail": "https://i.ytimg.com/vi/EH18ikq09BQ/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "mnL_ItTSyGc",
    "title": "Full-Body Postpartum Dumbbell Workout | Get Strong After Pregnancy",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "glutes",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=mnL_ItTSyGc",
    "thumbnail": "https://i.ytimg.com/vi/mnL_ItTSyGc/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "sd1tLoD-EKw",
    "title": "Postnatal Yoga For Breastfeeding | Relieve Postpartum Back Pain",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 15,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=sd1tLoD-EKw",
    "thumbnail": "https://i.ytimg.com/vi/sd1tLoD-EKw/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "Bfn773iyg9w",
    "title": "Day 1 New Postpartum Workout Challenge | Legs & Glutes",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 15,
    "focus": "glutes",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=Bfn773iyg9w",
    "thumbnail": "https://i.ytimg.com/vi/Bfn773iyg9w/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "L-ZP0dss5g0",
    "title": "15 Minute Postnatal Yoga For Breastfeeding",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 15,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=L-ZP0dss5g0",
    "thumbnail": "https://i.ytimg.com/vi/L-ZP0dss5g0/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "VBE4a99Af5s",
    "title": "Postpartum Cardio + Full Body Workout",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "cardio",
    "position": "standing",
    "risk": "high",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=VBE4a99Af5s",
    "thumbnail": "https://i.ytimg.com/vi/VBE4a99Af5s/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 进阶备用；恢复期不会自动排入。首次跟练前请确认腹部压力、足膝和整体恢复状态。"
  },
  {
    "id": "BFiQpemClEc",
    "title": "Postnatal Yoga | 20-Minute Postpartum Yoga Flow",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=BFiQpemClEc",
    "thumbnail": "https://i.ytimg.com/vi/BFiQpemClEc/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "N1UUfNnMocU",
    "title": "Postpartum Cardio Walking HIIT Workout + ABS",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 27,
    "focus": "cardio",
    "position": "standing",
    "risk": "high",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=N1UUfNnMocU",
    "thumbnail": "https://i.ytimg.com/vi/N1UUfNnMocU/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 进阶备用；恢复期不会自动排入。首次跟练前请确认腹部压力、足膝和整体恢复状态。"
  },
  {
    "id": "93hONjTp0qo",
    "title": "Full Body Postpartum Strength Workout | Get Strong & Fit",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "glutes",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=93hONjTp0qo",
    "thumbnail": "https://i.ytimg.com/vi/93hONjTp0qo/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "tJ59xRdygeg",
    "title": "Full Body Postpartum Cardio + Strength Workout",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "cardio",
    "position": "standing",
    "risk": "high",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=tJ59xRdygeg",
    "thumbnail": "https://i.ytimg.com/vi/tJ59xRdygeg/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 进阶备用；恢复期不会自动排入。首次跟练前请确认腹部压力、足膝和整体恢复状态。"
  },
  {
    "id": "bC28T9iB06I",
    "title": "Day 4: 20-Min Full Body Postpartum Strength Workout",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "glutes",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=bC28T9iB06I",
    "thumbnail": "https://i.ytimg.com/vi/bC28T9iB06I/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "VZVqrdOEJAo",
    "title": "Postpartum Workout Arms & Shoulders | Upper Body",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "pilates",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=VZVqrdOEJAo",
    "thumbnail": "https://i.ytimg.com/vi/VZVqrdOEJAo/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "dBprr0k5ahY",
    "title": "20-Min Postpartum Workout | Legs and Glutes Builder",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "glutes",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=dBprr0k5ahY",
    "thumbnail": "https://i.ytimg.com/vi/dBprr0k5ahY/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "kt2Cs82CnMY",
    "title": "Postpartum HIIT Workout | Legs & Glutes",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 10,
    "focus": "glutes",
    "position": "mixed",
    "risk": "high",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=kt2Cs82CnMY",
    "thumbnail": "https://i.ytimg.com/vi/kt2Cs82CnMY/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 进阶备用；恢复期不会自动排入。首次跟练前请确认腹部压力、足膝和整体恢复状态。"
  },
  {
    "id": "DoIVuR25Yqo",
    "title": "Full-Body Postpartum Workout | Tone After Pregnancy",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "glutes",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=DoIVuR25Yqo",
    "thumbnail": "https://i.ytimg.com/vi/DoIVuR25Yqo/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "jntIWDwJ_RM",
    "title": "Postpartum Workout Arms & Abs",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "postpartum",
    "position": "mixed",
    "risk": "high",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": true,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=jntIWDwJ_RM",
    "thumbnail": "https://i.ytimg.com/vi/jntIWDwJ_RM/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 进阶备用；恢复期不会自动排入。首次跟练前请确认腹部压力、足膝和整体恢复状态。"
  },
  {
    "id": "kJhR8vm0eSc",
    "title": "20-Minute Postpartum Leg & Glute Workout",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "glutes",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=kJhR8vm0eSc",
    "thumbnail": "https://i.ytimg.com/vi/kJhR8vm0eSc/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "qOhFS6eH5Rk",
    "title": "Postpartum Workout Legs & Glutes | Postnatal Workout",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "glutes",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=qOhFS6eH5Rk",
    "thumbnail": "https://i.ytimg.com/vi/qOhFS6eH5Rk/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "LP90y0waX3E",
    "title": "Day 5 Postpartum Workout Challenge | Glute Workout",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "glutes",
    "position": "mixed",
    "risk": "medium",
    "level": "stable",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=LP90y0waX3E",
    "thumbnail": "https://i.ytimg.com/vi/LP90y0waX3E/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 内置候选；频道标签不代表已通过 YouTube API 全库验证。动作标签采用保守预分类，首次跟练后可在视频库中调整。"
  },
  {
    "id": "aqD5KdBG6bs",
    "title": "Advanced Postpartum Workout Challenge | Arms",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "glutes",
    "position": "mixed",
    "risk": "high",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=aqD5KdBG6bs",
    "thumbnail": "https://i.ytimg.com/vi/aqD5KdBG6bs/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 进阶备用；恢复期不会自动排入。首次跟练前请确认腹部压力、足膝和整体恢复状态。"
  },
  {
    "id": "Y3v15_WwWX8",
    "title": "Metabolism Booster | Advanced Postpartum Leg & Booty Workout",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "glutes",
    "position": "mixed",
    "risk": "high",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=Y3v15_WwWX8",
    "thumbnail": "https://i.ytimg.com/vi/Y3v15_WwWX8/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 进阶备用；恢复期不会自动排入。首次跟练前请确认腹部压力、足膝和整体恢复状态。"
  },
  {
    "id": "XRz0d2p1XuY",
    "title": "20 Min Cardio HIIT | Advanced Postpartum Challenge",
    "channel": "Pregnancy and Postpartum TV",
    "duration": 20,
    "focus": "cardio",
    "position": "standing",
    "risk": "high",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=XRz0d2p1XuY",
    "thumbnail": "https://i.ytimg.com/vi/XRz0d2p1XuY/hqdefault.jpg",
    "publishedAt": "",
    "note": "Pregnancy and Postpartum TV 进阶备用；恢复期不会自动排入。首次跟练前请确认腹部压力、足膝和整体恢复状态。"
  }
];
const existingChannelExpansion = [
  {
    "id": "136ZLuy40TE",
    "title": "10 MIN EXPRESS PILATES WORKOUT || At-Home Mat Pilates (Moderate)",
    "channel": "Move With Nicole",
    "duration": 10,
    "focus": "pilates",
    "position": "mat",
    "risk": "medium",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=136ZLuy40TE",
    "thumbnail": "https://i.ytimg.com/vi/136ZLuy40TE/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "wtVyZmHnlxM",
    "title": "30 MIN PILATES WORKOUT || Beginner to Moderate Pilates (No Equipment)",
    "channel": "Move With Nicole",
    "duration": 30,
    "focus": "pilates",
    "position": "mat",
    "risk": "medium",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=wtVyZmHnlxM",
    "thumbnail": "https://i.ytimg.com/vi/wtVyZmHnlxM/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "C2HX2pNbUCM",
    "title": "30 MIN FULL BODY WORKOUT || At-Home Pilates (No Equipment)",
    "channel": "Move With Nicole",
    "duration": 30,
    "focus": "pilates",
    "position": "mat",
    "risk": "medium",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=C2HX2pNbUCM",
    "thumbnail": "https://i.ytimg.com/vi/C2HX2pNbUCM/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "Wnwo1MvW-Ug",
    "title": "25 MIN MORNING PILATES || Wake Up & Feel Energised",
    "channel": "Move With Nicole",
    "duration": 25,
    "focus": "pilates",
    "position": "mat",
    "risk": "medium",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=Wnwo1MvW-Ug",
    "thumbnail": "https://i.ytimg.com/vi/Wnwo1MvW-Ug/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "Vr3h5X9kmUo",
    "title": "15 MIN MORNING YOGA FLOW || Wake Up & Feel Energised",
    "channel": "Move With Nicole",
    "duration": 15,
    "focus": "mobility",
    "position": "mixed",
    "risk": "low",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=Vr3h5X9kmUo",
    "thumbnail": "https://i.ytimg.com/vi/Vr3h5X9kmUo/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "8cltCOUpYTQ",
    "title": "20 MIN GENTLE YOGA FLOW || Relaxing Flow to Stretch & Unwind",
    "channel": "Move With Nicole",
    "duration": 20,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=8cltCOUpYTQ",
    "thumbnail": "https://i.ytimg.com/vi/8cltCOUpYTQ/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "YKtDkKUHtPU",
    "title": "20 MIN DAILY YOGA STRETCH || Full Body Yoga Flow for Flexibility",
    "channel": "Move With Nicole",
    "duration": 20,
    "focus": "mobility",
    "position": "mixed",
    "risk": "low",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=YKtDkKUHtPU",
    "thumbnail": "https://i.ytimg.com/vi/YKtDkKUHtPU/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "1ltZQ9rJiFw",
    "title": "25 MIN EXPRESS PILATES WORKOUT || Moderate to Intermediate Pilates (No Equipment)",
    "channel": "Move With Nicole",
    "duration": 25,
    "focus": "pilates",
    "position": "mat",
    "risk": "medium",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=1ltZQ9rJiFw",
    "thumbnail": "https://i.ytimg.com/vi/1ltZQ9rJiFw/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "ta_k5QZLkfk",
    "title": "20 MIN PILATES WORKOUT || Upper Body & Core (Moderate/Intermediate)",
    "channel": "Move With Nicole",
    "duration": 20,
    "focus": "pilates",
    "position": "mat",
    "risk": "medium",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=ta_k5QZLkfk",
    "thumbnail": "https://i.ytimg.com/vi/ta_k5QZLkfk/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "xNCj6JnQq4Q",
    "title": "25 MIN PILATES WORKOUT || Intermediate Mat Pilates (No Equipment)",
    "channel": "Move With Nicole",
    "duration": 25,
    "focus": "pilates",
    "position": "mat",
    "risk": "medium",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=xNCj6JnQq4Q",
    "thumbnail": "https://i.ytimg.com/vi/xNCj6JnQq4Q/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "M4dyK28GrE0",
    "title": "35 MIN PILATES WORKOUT || Intermediate Mat Pilates (No Equipment)",
    "channel": "Move With Nicole",
    "duration": 35,
    "focus": "pilates",
    "position": "mat",
    "risk": "medium",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=M4dyK28GrE0",
    "thumbnail": "https://i.ytimg.com/vi/M4dyK28GrE0/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "dYcNLMwwlMA",
    "title": "15 MIN PILATES CORE & ABS WORKOUT || Intermediate Pilates (No Equipment)",
    "channel": "Move With Nicole",
    "duration": 15,
    "focus": "pilates",
    "position": "mat",
    "risk": "high",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": true,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=dYcNLMwwlMA",
    "thumbnail": "https://i.ytimg.com/vi/dYcNLMwwlMA/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "7SU59GxGqbo",
    "title": "40 MIN FULL BODY YOGA FLOW || Vinyasa Flow For Balance, Flexibility & Strength (Intermediate)",
    "channel": "Move With Nicole",
    "duration": 40,
    "focus": "mobility",
    "position": "mixed",
    "risk": "medium",
    "level": "progress",
    "drFriendly": false,
    "crunchHeavy": false,
    "reserveOnly": true,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=7SU59GxGqbo",
    "thumbnail": "https://i.ytimg.com/vi/7SU59GxGqbo/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "g_tea8ZNk5A",
    "title": "15 Min. Full Body Stretch | Daily Routine for Flexibility, Mobility & Relaxation",
    "channel": "Mady Morrison",
    "duration": 15,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=g_tea8ZNk5A",
    "thumbnail": "https://i.ytimg.com/vi/g_tea8ZNk5A/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "4snu7NxD4nM",
    "title": "15 Min. Morning Stretch | Wake Up & Feel Amazing",
    "channel": "Mady Morrison",
    "duration": 15,
    "focus": "mobility",
    "position": "mixed",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=4snu7NxD4nM",
    "thumbnail": "https://i.ytimg.com/vi/4snu7NxD4nM/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "CY6QP4ofwx4",
    "title": "Full Body Stretch | Gentle Routine for Flexibility, Relaxation & Stress Relief",
    "channel": "Mady Morrison",
    "duration": 30,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=CY6QP4ofwx4",
    "thumbnail": "https://i.ytimg.com/vi/CY6QP4ofwx4/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "sAf67xFS-qE",
    "title": "5 Min. Morning Stretch | Full Body Flexibility Routine",
    "channel": "Mady Morrison",
    "duration": 5,
    "focus": "mobility",
    "position": "mixed",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=sAf67xFS-qE",
    "thumbnail": "https://i.ytimg.com/vi/sAf67xFS-qE/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "tnZ96Y2C28Y",
    "title": "25 Min. Full Body Stretch | Deep Stretching Routine",
    "channel": "Mady Morrison",
    "duration": 25,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=tnZ96Y2C28Y",
    "thumbnail": "https://i.ytimg.com/vi/tnZ96Y2C28Y/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "aGcwjh4kETQ",
    "title": "20 Min. Daily Yoga Stretch | Full Body Routine for All Levels",
    "channel": "Mady Morrison",
    "duration": 20,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=aGcwjh4kETQ",
    "thumbnail": "https://i.ytimg.com/vi/aGcwjh4kETQ/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "_9JZuOO9E_w",
    "title": "10 Minute Evening Stretch for Beginners | Better Sleep & Relaxation",
    "channel": "Mady Morrison",
    "duration": 10,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=_9JZuOO9E_w",
    "thumbnail": "https://i.ytimg.com/vi/_9JZuOO9E_w/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "IlHgLYdt3kc",
    "title": "10 Min. Full Body Stretch | Cool Down & Recover",
    "channel": "Mady Morrison",
    "duration": 10,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=IlHgLYdt3kc",
    "thumbnail": "https://i.ytimg.com/vi/IlHgLYdt3kc/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "yqeirBfn2j4",
    "title": "15 Min. Yoga Stretch for Stress & Anxiety Relief",
    "channel": "Mady Morrison",
    "duration": 15,
    "focus": "meditation",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=yqeirBfn2j4",
    "thumbnail": "https://i.ytimg.com/vi/yqeirBfn2j4/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "VJT6CPSK94Q",
    "title": "20 Minute Full Body Pilates Workout For Beginners - No Equipment",
    "channel": "Jessica Valant Pilates",
    "duration": 20,
    "focus": "pilates",
    "position": "mat",
    "risk": "low",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=VJT6CPSK94Q",
    "thumbnail": "https://i.ytimg.com/vi/VJT6CPSK94Q/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "CdjRQ6GG8bA",
    "title": "Gentle Pilates - 15 Minute Pilates for Beginners Workout",
    "channel": "Jessica Valant Pilates",
    "duration": 15,
    "focus": "pilates",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=CdjRQ6GG8bA",
    "thumbnail": "https://i.ytimg.com/vi/CdjRQ6GG8bA/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "p0ngO1SYR9U",
    "title": "Pilates for Beginners - Full Body Beginner Pilates at Home",
    "channel": "Jessica Valant Pilates",
    "duration": 20,
    "focus": "pilates",
    "position": "mat",
    "risk": "low",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=p0ngO1SYR9U",
    "thumbnail": "https://i.ytimg.com/vi/p0ngO1SYR9U/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "iY0acFOmbgI",
    "title": "Pilates for Beginners - 15 Minute Beginner Pilates Workout",
    "channel": "Jessica Valant Pilates",
    "duration": 15,
    "focus": "pilates",
    "position": "mat",
    "risk": "low",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=iY0acFOmbgI",
    "thumbnail": "https://i.ytimg.com/vi/iY0acFOmbgI/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "izLw13GhJGM",
    "title": "10 Minute Gentle Pilates Workout - Knee Friendly | No Kneeling",
    "channel": "Jessica Valant Pilates",
    "duration": 10,
    "focus": "pilates",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=izLw13GhJGM",
    "thumbnail": "https://i.ytimg.com/vi/izLw13GhJGM/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "MRV_WO3DZ3o",
    "title": "10 Minute Everyday Pilates",
    "channel": "Jessica Valant Pilates",
    "duration": 10,
    "focus": "pilates",
    "position": "mat",
    "risk": "medium",
    "level": "stable",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=MRV_WO3DZ3o",
    "thumbnail": "https://i.ytimg.com/vi/MRV_WO3DZ3o/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "JUP_YdYyfQw",
    "title": "Yoga For Text Neck | Yoga With Adriene",
    "channel": "Yoga With Adriene",
    "duration": 20,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=JUP_YdYyfQw",
    "thumbnail": "https://i.ytimg.com/vi/JUP_YdYyfQw/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "lMTyp5npt78",
    "title": "Upper Back Love | Yoga For Back Pain",
    "channel": "Yoga With Adriene",
    "duration": 30,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=lMTyp5npt78",
    "thumbnail": "https://i.ytimg.com/vi/lMTyp5npt78/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "d6zJkHcjbWc",
    "title": "Yoga For Upper Back Pain | Yoga With Adriene",
    "channel": "Yoga With Adriene",
    "duration": 25,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=d6zJkHcjbWc",
    "thumbnail": "https://i.ytimg.com/vi/d6zJkHcjbWc/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "CZJVeUD_Ou8",
    "title": "Chest & Upper Body Opening Flow",
    "channel": "Yoga With Adriene",
    "duration": 20,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=CZJVeUD_Ou8",
    "thumbnail": "https://i.ytimg.com/vi/CZJVeUD_Ou8/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  },
  {
    "id": "n1E8aTKJmVg",
    "title": "Yoga for Neck Hump | Upper Spine Posture",
    "channel": "Yoga With Adriene",
    "duration": 20,
    "focus": "mobility",
    "position": "mat",
    "risk": "low",
    "level": "recovery",
    "drFriendly": true,
    "crunchHeavy": false,
    "reserveOnly": false,
    "approved": true,
    "rejected": false,
    "demo": false,
    "starter": true,
    "url": "https://www.youtube.com/watch?v=n1E8aTKJmVg",
    "thumbnail": "https://i.ytimg.com/vi/n1E8aTKJmVg/hqdefault.jpg",
    "publishedAt": "",
    "note": "现有候选频道条目；频道标签不代表已通过 YouTube API 全库验证。"
  }
];

const kneeFriendlyExpansion = [
  {
    id: "v3B2vk5THOU",
    title: "35 MIN PILATES WORKOUT || Classical Mat Pilates Inspired (Knee & Wrist Friendly)",
    channel: "Move With Nicole", duration: 35, focus: "pilates", position: "mat", risk: "medium", level: "stable",
    drFriendly: false, crunchHeavy: false, reserveOnly: false, approved: true, rejected: false, demo: false, starter: true, kneeFriendly: true,
    url: youtubeWatchUrl("v3B2vk5THOU"), thumbnail: youtubeThumbnail("v3B2vk5THOU"), publishedAt: "",
    note: "膝盖友好候选：Move With Nicole 标题明确标注 Knee & Wrist Friendly；垫上训练可在膝盖不适时优先考虑。"
  },
  {
    id: "1jWkjpSmQhc",
    title: "15 MIN BOOTY BAND WORKOUT (Knee Friendly) || At-Home Pilates",
    channel: "Move With Nicole", duration: 15, focus: "glutes", position: "mat", risk: "medium", level: "stable",
    drFriendly: false, crunchHeavy: false, reserveOnly: false, approved: true, rejected: false, demo: false, starter: true, kneeFriendly: true,
    pelvicInversion: true, menstrualEligible: false,
    url: youtubeWatchUrl("1jWkjpSmQhc"), thumbnail: youtubeThumbnail("1jWkjpSmQhc"), publishedAt: "",
    note: "膝盖友好候选：低冲击臀部训练；可能包含臀桥/骨盆抬高，因此生理期不自动安排。"
  },
  {
    id: "KQ6b-_dC1Mo",
    title: "35 MIN ABS & BOOTY WORKOUT || Mat Pilates (No Squats & No Equipment)",
    channel: "Move With Nicole", duration: 35, focus: "pilates", position: "mat", risk: "medium", level: "stable",
    drFriendly: false, crunchHeavy: false, reserveOnly: false, approved: true, rejected: false, demo: false, starter: true, kneeFriendly: true,
    abTraining: true, pelvicInversion: true, menstrualEligible: false,
    url: youtubeWatchUrl("KQ6b-_dC1Mo"), thumbnail: youtubeThumbnail("KQ6b-_dC1Mo"), publishedAt: "",
    note: "膝盖友好候选：视频说明为低冲击、无深蹲/平板；含腹肌与臀部训练，生理期及腹部压力不适时不自动安排。"
  },
  {
    id: "VVahExTVlt4",
    title: "Postpartum Workout | 20 Minute HIIT Workout (Knee Friendly) Low Impact, NO Squats, NO Lunges",
    channel: "Pregnancy and Postpartum TV", duration: 20, focus: "cardio", position: "mixed", risk: "medium", level: "stable",
    drFriendly: true, crunchHeavy: false, reserveOnly: false, approved: true, rejected: false, demo: false, starter: true, kneeFriendly: true,
    menstrualEligible: false,
    url: youtubeWatchUrl("VVahExTVlt4"), thumbnail: youtubeThumbnail("VVahExTVlt4"), publishedAt: "",
    note: "膝盖友好产后候选：低冲击、无深蹲、无弓步，并提供手膝位替代动作。"
  },
  {
    id: "VfSlEgg4ApE",
    title: "Yoga For Sensitive Knees | Yoga With Adriene",
    channel: "Yoga With Adriene", duration: 30, focus: "mobility", position: "mat", risk: "low", level: "recovery",
    drFriendly: true, crunchHeavy: false, reserveOnly: false, approved: true, rejected: false, demo: false, starter: true, kneeFriendly: true,
    menstrualEligible: false,
    url: youtubeWatchUrl("VfSlEgg4ApE"), thumbnail: youtubeThumbnail("VfSlEgg4ApE"), publishedAt: "",
    note: "膝盖敏感恢复候选：该练习明确针对 sensitive knees，并尽量避免给膝盖施压。"
  }
];
for (const video of kneeFriendlyExpansion) {
  if (!sampleVideos.some(existing => String(existing.id) === String(video.id))) sampleVideos.push(video);
}

const existingSeedIds = new Set(sampleVideos.map(video => String(video.id)));
sampleVideos.push(...pregnancyPostpartumExpansion.filter(video => !existingSeedIds.has(String(video.id))));
const expandedSeedIds = new Set(sampleVideos.map(video => String(video.id)));
sampleVideos.push(...existingChannelExpansion.filter(video => !expandedSeedIds.has(String(video.id))));
// 3.1: Jessica Valant 已按用户偏好从内置库彻底移除。
for (let i = sampleVideos.length - 1; i >= 0; i--) {
  if (isRetiredChannelName(sampleVideos[i]?.channel)) sampleVideos.splice(i, 1);
}
const verifiedSeedVideoIds = new Set(sampleVideos.map(video => String(video.id)));
const verifiedSeedById = new Map(sampleVideos.map(video => [String(video.id), video]));
sampleVideos.forEach(video => {
  Object.assign(video, normalizeMenstrualSafety(video));
  video.kneeFriendly = inferKneeFriendly(video);
  video.verificationStatus = video.starter ? 'curated' : (video.verificationStatus || 'manual');
  video.verifiedAt = video.starter ? null : (video.verifiedAt || null);
  video.verifiedChannel = video.starter ? '' : (video.verifiedChannel || '');
  video.linkAuditStatus = video.starter ? 'curated' : (video.linkAuditStatus || 'manual');
  video.linkAuditedAt = video.starter ? null : (video.linkAuditedAt || null);
  video.originalChannel = video.originalChannel || '';
  video.originalTitle = video.originalTitle || '';
  video.verificationNote = /^本次未能核实/.test(String(video.verificationNote || '')) ? '' : (video.verificationNote || '');
  if (video.autoPlanEligible === undefined) video.autoPlanEligible = true;
  video.needsReview = !!video.needsReview;
});

const samplePending = [];

function defaultState() {
  return {
    version: APP_DATA_VERSION,
    videos: structuredClone(sampleVideos),
    pending: structuredClone(samplePending),
    assessment: {
      energy: 3, load: 3, pains: ['shoulder'], timeAvailable: 15,
      desiredMode: 'auto', note: '默认状态：带娃负荷中等，肩颈略紧。', mode: 'recovery', updatedAt: new Date().toISOString()
    },
    menstrual: {
      enabled: false,
      startDate: torontoDate(),
      duration: 5,
      flow: 'medium',
      severity: 3,
      symptoms: [],
      gentleFirstTwoDays: true,
      avoidAbTraining: true,
      avoidPelvicInversion: true,
      note: '',
      updatedAt: null
    },
    plan: [],
    plansByWeek: {},
    planMetaByWeek: {},
    feedback: [],
    weekPreferences: {
      weekStart: startOfPlanWeek(),
      excludedChannels: []
    },
    weekPreferencesByStart: {},
    libraryPreferences: {
      channel: 'all',
      focus: 'all',
      position: 'all',
      preference: 'all',
      sort: 'default'
    },
    libraryAudit: {
      lastRun: null,
      running: false,
      total: 0,
      completed: 0,
      verified: 0,
      corrected: 0,
      pending: 0,
      failed: 0
    },
    settings: {
      apiKey: '', // legacy; 3.4.1 起不再使用或保存新的 API Key
      workerUrl: '',
      autoYouTubeSync: true,
      youtubeSyncHours: 6,
      channels: structuredClone(defaultChannels),
      preferMat: true,
      avoidCrunch: true,
      autoDowngrade: true,
      miziGap: 14,
      lastSync: null
    }
  };
}

let state = loadState();
let deferredInstallPrompt = null;
let editSearchResults = new Map();
let selectedWeekStart = startOfPlanWeek();
let lastKnownTorontoDate = torontoDate();

function mergeDefaultChannels(channels = []) {
  const existing = Array.isArray(channels) ? channels.filter(c => !isRetiredChannelName(c?.name)).map(c => {
    const item = { usage: 'primary', ...c };
    if (/^dr\.? sarah duvall$/i.test(String(item.name || '').trim())) item.name = 'Dr. Sara Duvall';
    return item;
  }) : [];
  const byName = new Map(existing.map(c => [String(c.name || '').toLowerCase(), c]));
  for (const candidate of defaultChannels) {
    const key = candidate.name.toLowerCase();
    if (!byName.has(key)) existing.push(structuredClone(candidate));
    else {
      const current = byName.get(key);
      if (!current.usage) current.usage = candidate.usage;
      if (!current.id && candidate.id) current.id = candidate.id;
    }
  }
  return existing;
}

function availableChannelNames() {
  const seen = new Set();
  const names = [];
  const add = value => {
    const name = String(value || '').trim();
    const key = name.toLowerCase();
    if (!name || isRetiredChannelName(name) || seen.has(key)) return;
    seen.add(key); names.push(name);
  };
  defaultChannels.forEach(channel => add(channel.name));
  (state.settings?.channels || []).forEach(channel => add(channel.name));
  (state.videos || []).forEach(video => add(video.channel));
  return names;
}

function renderAddVideoChannelOptions(preferred = '') {
  const select = document.getElementById('videoChannel');
  if (!select) return;
  const preferredName = String(preferred || '').trim();
  const names = availableChannelNames();
  select.innerHTML = [
    '<option value="">请选择 YouTuber</option>',
    ...names.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`),
    '<option value="__custom__">其他／自定义频道</option>'
  ].join('');
  if (preferredName && names.some(name => name.toLowerCase() === preferredName.toLowerCase())) {
    select.value = names.find(name => name.toLowerCase() === preferredName.toLowerCase());
  } else if (preferredName) {
    select.value = '__custom__';
    document.getElementById('videoChannelCustom').value = preferredName;
  } else {
    select.value = '';
  }
  updateAddVideoChannelField();
}

function updateAddVideoChannelField() {
  const select = document.getElementById('videoChannel');
  const field = document.getElementById('videoCustomChannelField');
  const input = document.getElementById('videoChannelCustom');
  if (!select || !field || !input) return;
  const isCustom = select.value === '__custom__';
  field.classList.toggle('hidden', !isCustom);
  input.required = isCustom;
  if (!isCustom) input.value = '';
}

function selectedAddVideoChannel() {
  const select = document.getElementById('videoChannel');
  if (!select) return '';
  return select.value === '__custom__'
    ? document.getElementById('videoChannelCustom').value.trim()
    : select.value.trim();
}

function openAddVideoDialog() {
  const form = document.getElementById('videoForm');
  form?.reset();
  renderAddVideoChannelOptions();
  document.getElementById('videoDialog').showModal();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const defaults = defaultState();
    const parsedVersion = Number(parsed.version || 1);
    const merged = {
      ...defaults,
      ...parsed,
      menstrual: { ...defaults.menstrual, ...(parsed.menstrual || {}) },
      plansByWeek: { ...(parsed.plansByWeek || {}) },
      planMetaByWeek: { ...(parsed.planMetaByWeek || {}) },
      weekPreferences: { ...defaults.weekPreferences, ...(parsed.weekPreferences || {}) },
      weekPreferencesByStart: { ...(parsed.weekPreferencesByStart || {}) },
      libraryPreferences: { ...defaults.libraryPreferences, ...(parsed.libraryPreferences || {}) },
      libraryAudit: { ...defaults.libraryAudit, ...(parsed.libraryAudit || {}), running: false },
      settings: { ...defaults.settings, ...(parsed.settings || {}) }
    };
    merged.menstrual.duration = Math.min(10, Math.max(1, Number(merged.menstrual.duration || 5)));
    merged.menstrual.severity = Math.min(5, Math.max(1, Number(merged.menstrual.severity || 3)));
    merged.menstrual.symptoms = Array.isArray(merged.menstrual.symptoms) ? merged.menstrual.symptoms : [];
    if (!['light','medium','heavy'].includes(merged.menstrual.flow)) merged.menstrual.flow = 'medium';
    const savedChannels = Array.isArray(parsed.settings?.channels) ? parsed.settings.channels : [];
    merged.settings.channels = parsedVersion < APP_DATA_VERSION
      ? mergeDefaultChannels(savedChannels)
      : savedChannels.map(channel => ({ usage:'primary', ...channel }));
    // 3.1: 退休频道无论数据来自旧版本还是备份，都不再回到候选频道。
    merged.settings.channels = (merged.settings.channels || []).filter(channel => !isRetiredChannelName(channel?.name));
    if (parsedVersion < 13) {
      const removedV12Channels = new Set(['bodyfit by amy', 'core exercise solutions']);
      merged.settings.channels = merged.settings.channels.filter(channel => !removedV12Channels.has(String(channel.name || '').trim().toLowerCase()));
    }
    const parsedPlan = Array.isArray(parsed.plan) ? parsed.plan : [];
    const parsedVideos = Array.isArray(parsed.videos) ? parsed.videos : [];
    merged.feedback = (Array.isArray(parsed.feedback) ? parsed.feedback : []).map((record, index) => {
      const source = record.source || 'plan';
      const planItem = source === 'library' ? null : parsedPlan.find(item => item.date === record.date);
      const videoId = record.videoId || planItem?.videoId || '';
      const video = parsedVideos.find(item => item.id === videoId);
      return {
        ...record,
        recordId: record.recordId || `legacy-${record.date || 'unknown'}-${index}`,
        source,
        videoId,
        videoTitle: record.videoTitle || video?.title || '',
        videoChannel: record.videoChannel || video?.channel || ''
      };
    });
    if (parsedVersion < APP_DATA_VERSION) {
      const personalVideos = (parsed.videos || []).filter(v =>
        !isRetiredChannelName(v.channel) &&
        !v.demo &&
        !String(v.id || '').startsWith('demo-') &&
        !(v.starter && RETIRED_SEED_VIDEO_IDS.has(String(v.id || '')))
      ).map(video => {
        const auditedSeed = video.starter ? verifiedSeedById.get(String(video.id || '')) : null;
        const preservedStatus = auditedSeed ? 'curated' : (['verified','corrected','curated'].includes(video.verificationStatus) ? video.verificationStatus : 'manual');
        const oldFailure = /^本次未能核实/.test(String(video.verificationNote || ''));
        return {
          ...(auditedSeed || {}),
          ...video,
          ...(auditedSeed ? {
            title: auditedSeed.title, channel: auditedSeed.channel, url: auditedSeed.url, thumbnail: auditedSeed.thumbnail,
            verificationStatus: 'curated', verifiedAt: null, verifiedChannel: '',
            linkAuditStatus: 'curated', linkAuditedAt: null
          } : {}),
          verificationStatus: preservedStatus,
          verifiedAt: auditedSeed ? null : (video.verifiedAt || null),
          verifiedChannel: auditedSeed ? '' : (video.verifiedChannel || ''),
          verificationNote: oldFailure ? '' : (auditedSeed?.note || video.verificationNote || ''),
          originalChannel: video.originalChannel || '',
          originalTitle: video.originalTitle || '',
          autoPlanEligible: video.autoPlanEligible !== false,
          needsReview: !!video.needsReview && preservedStatus === 'corrected'
        };
      });
      const personalIds = new Set(personalVideos.map(v => v.id));
      merged.videos = [...personalVideos, ...sampleVideos.filter(v => !personalIds.has(v.id))];
      merged.pending = (parsed.pending || []).filter(v => !v.demo && !String(v.id || '').startsWith('pending-demo-'));
      merged.plan = parsedPlan;
      merged.libraryAudit = { ...defaults.libraryAudit, running:false, pending:0 };
      merged.version = APP_DATA_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
    const currentWeekStart = startOfPlanWeek();
    merged.plansByWeek = merged.plansByWeek && typeof merged.plansByWeek === 'object' ? merged.plansByWeek : {};
    merged.weekPreferencesByStart = merged.weekPreferencesByStart && typeof merged.weekPreferencesByStart === 'object' ? merged.weekPreferencesByStart : {};
    const legacyPlan = Array.isArray(merged.plan) ? merged.plan : [];
    if (legacyPlan.length) {
      const legacyWeekStart = startOfPlanWeek(legacyPlan[0].date || currentWeekStart);
      if (!Array.isArray(merged.plansByWeek[legacyWeekStart]) || !merged.plansByWeek[legacyWeekStart].length) {
        merged.plansByWeek[legacyWeekStart] = legacyPlan;
      }
    }
    const legacyPreferenceStart = merged.weekPreferences?.weekStart || currentWeekStart;
    if (!merged.weekPreferencesByStart[legacyPreferenceStart]) {
      merged.weekPreferencesByStart[legacyPreferenceStart] = {
        excludedChannels: Array.isArray(merged.weekPreferences?.excludedChannels) ? merged.weekPreferences.excludedChannels : []
      };
    }
    for (const [weekStart, plan] of Object.entries(merged.plansByWeek)) {
      if (!Array.isArray(plan)) delete merged.plansByWeek[weekStart];
    }
    if (parsedVersion < 19 && merged.menstrual?.enabled) {
      delete merged.plansByWeek[currentWeekStart];
      delete merged.plansByWeek[addDays(currentWeekStart, 7)];
    }
    if (parsedVersion < 20) {
      delete merged.plansByWeek[currentWeekStart];
      delete merged.plansByWeek[addDays(currentWeekStart, 7)];
    }
    // 3.2.1：旧计划可能包含超过“可用运动时间”硬上限的视频，升级后重建本周与下周。
    if (parsedVersion < 34) {
      delete merged.plansByWeek[currentWeekStart];
      delete merged.plansByWeek[addDays(currentWeekStart, 7)];
      if (merged.planMetaByWeek) {
        delete merged.planMetaByWeek[currentWeekStart];
        delete merged.planMetaByWeek[addDays(currentWeekStart, 7)];
      }
    }
    // 3.3：让既有体感反馈立即参与后续排课，升级时重建本周与下周。
    if (parsedVersion < 35) {
      delete merged.plansByWeek[currentWeekStart];
      delete merged.plansByWeek[addDays(currentWeekStart, 7)];
      if (merged.planMetaByWeek) {
        delete merged.planMetaByWeek[currentWeekStart];
        delete merged.planMetaByWeek[addDays(currentWeekStart, 7)];
      }
    }
    merged.plan = Array.isArray(merged.plansByWeek[currentWeekStart]) ? merged.plansByWeek[currentWeekStart] : [];
    const currentPreferences = merged.weekPreferencesByStart[currentWeekStart] || { excludedChannels: [] };
    merged.weekPreferences = { weekStart: currentWeekStart, excludedChannels: Array.isArray(currentPreferences.excludedChannels) ? currentPreferences.excludedChannels : [] };
    const allowedSorts = new Set(['default','channel-asc','channel-desc','usage-desc','usage-asc','recent-desc','recent-asc','title-asc','title-desc','duration-asc','duration-desc','preference']);
    if (!allowedSorts.has(merged.libraryPreferences.sort)) merged.libraryPreferences.sort = 'default';
    for (const key of ['channel','focus','position','preference']) {
      if (!merged.libraryPreferences[key]) merged.libraryPreferences[key] = 'all';
    }
    merged.videos = (merged.videos || []).map(video => {
      const existingStatus = String(video.verificationStatus || '');
      const verificationStatus = ['verified','corrected','curated','manual'].includes(existingStatus)
        ? existingStatus
        : (video.starter ? 'curated' : 'manual');
      const verificationNote = /^本次未能核实/.test(String(video.verificationNote || '')) ? '' : (video.verificationNote || '');
      return normalizeMenstrualSafety({
        verifiedAt:null, verifiedChannel:'', originalChannel:'', originalTitle:'', linkAuditStatus:'', linkAuditedAt:null, autoPlanEligible:true, needsReview:false,
        ...video,
        verificationStatus,
        verificationNote
      });
    }).filter(video => !isRetiredChannelName(video.channel));
    if (isRetiredChannelName(merged.libraryPreferences.channel)) merged.libraryPreferences.channel = 'all';
    for (const pref of Object.values(merged.weekPreferencesByStart || {})) {
      if (Array.isArray(pref?.excludedChannels)) pref.excludedChannels = pref.excludedChannels.filter(name => !isRetiredChannelName(name));
    }
    merged.libraryAudit = { ...defaults.libraryAudit, running:false, pending:0 };
    const loadedVideoMap = new Map((merged.videos || []).map(video => [String(video.id), video]));
    for (const plan of Object.values(merged.plansByWeek || {})) {
      if (!Array.isArray(plan)) continue;
      for (const item of plan) {
        if (item.videoSnapshot || !item.videoId) continue;
        const video = loadedVideoMap.get(String(item.videoId));
        if (video) item.videoSnapshot = {id:video.id,title:video.title,channel:video.channel,duration:video.duration,focus:video.focus,position:video.position,risk:video.risk,abTraining:!!video.abTraining,pelvicInversion:!!video.pelvicInversion,menstrualEligible:!!video.menstrualEligible,reserveOnly:!!video.reserveOnly,url:video.url,thumbnail:video.thumbnail};
      }
    }
    return merged;
  } catch (error) {
    console.error(error);
    return defaultState();
  }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function torontoDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(date);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}
function parseLocalDate(iso) { return new Date(`${iso}T12:00:00`); }
function addDays(iso, days) { const d = parseLocalDate(iso); d.setDate(d.getDate()+days); return torontoDate(d); }
function formatDate(iso, options = {}) {
  return new Intl.DateTimeFormat('zh-CN', { timeZone: TZ, month:'short', day:'numeric', weekday:'short', ...options }).format(parseLocalDate(iso));
}
function startOfPlanWeek(dateIso = torontoDate()) {
  const d = parseLocalDate(dateIso);
  const day = d.getDay();
  const diff = day === 6 ? 0 : -(day + 1);
  d.setDate(d.getDate() + diff);
  return torontoDate(d);
}
function getWeekDates(weekStart = startOfPlanWeek()) { return Array.from({length:7}, (_,i) => addDays(weekStart,i)); }
function menstrualEndDate() {
  const m = state?.menstrual;
  if (!m?.enabled || !m.startDate) return '';
  return addDays(m.startDate, Math.max(1, Number(m.duration || 5)) - 1);
}
function isMenstrualDay(dateIso) {
  const m = state?.menstrual;
  if (!m?.enabled || !m.startDate || !dateIso) return false;
  return dateIso >= m.startDate && dateIso <= menstrualEndDate();
}
function menstrualDayNumber(dateIso) {
  if (!isMenstrualDay(dateIso)) return 0;
  return Math.round((parseLocalDate(dateIso) - parseLocalDate(state.menstrual.startDate)) / 86400000) + 1;
}
function menstrualContextForDate(dateIso) {
  if (!isMenstrualDay(dateIso)) return { active:false, day:0, severe:false, gentleOnly:false };
  const m = state.menstrual;
  const day = menstrualDayNumber(dateIso);
  const symptoms = Array.isArray(m.symptoms) ? m.symptoms : [];
  const severe = Number(m.severity || 3) >= 4 || m.flow === 'heavy' || symptoms.includes('headache');
  const gentleOnly = severe || (m.gentleFirstTwoDays && day <= 2);
  return { active:true, day, severe, gentleOnly, flow:m.flow, severity:Number(m.severity||3), symptoms, avoidAbTraining:true, avoidPelvicInversion:true };
}
function menstrualTemplateForDay(baseTemplate, context) {
  if (!context.active) return baseTemplate;
  if (context.gentleOnly) {
    return { ...baseTemplate, type: 'mobility', label: `生理期第 ${context.day} 天 · 非核心温和恢复`, target: 10 };
  }
  return { ...baseTemplate, type: 'mobility', label: `生理期第 ${context.day} 天 · 非核心低强度训练`, target: Math.min(15, baseTemplate.target) };
}
function menstrualStatusText() {
  const m = state.menstrual;
  if (!m?.enabled) return '尚未启用生理期模式。';
  const symptoms = (m.symptoms || []).map(item => menstrualSymptomLabels[item] || item);
  return `${formatDate(m.startDate)} 至 ${formatDate(menstrualEndDate())} · ${m.duration} 天 · 经量${menstrualFlowLabels[m.flow] || m.flow} · 不适 ${m.severity}/5${symptoms.length ? ` · ${symptoms.join('、')}` : ''}`;
}
function isoDurationToMinutes(duration = 'PT0M') {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return Number(match[1]||0)*60 + Number(match[2]||0) + Math.round(Number(match[3]||0)/60);
}
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message; toast.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function determineMode(assessment) {
  if (assessment.desiredMode && assessment.desiredMode !== 'auto') return assessment.desiredMode;
  const painScore = assessment.pains?.length || 0;
  if (assessment.energy <= 2 || assessment.load >= 4 || painScore >= 2) return 'recovery';
  if (assessment.energy >= 4 && assessment.load <= 2 && painScore === 0) return 'progress';
  return 'stable';
}

const dayTemplates = [
  { day: '周六', type:'mobility', label:'恢复拉伸', target:10 },
  { day: '周日', type:'pilates', label:'轻量垫上 Pilates', target:15 },
  { day: '周一', type:'pilates', label:'主 Pilates', target:20 },
  { day: '周二', type:'postpartum', label:'功能恢复', target:15 },
  { day: '周三', type:'glutes', label:'主 Pilates / 臀部稳定', target:20 },
  { day: '周四', type:'mobility', label:'恢复与活动度', target:10 },
  { day: '周五', type:'pilates', label:'主训练或恢复', target:20 }
];

function daysBetweenIso(a, b) {
  if (!a || !b) return Infinity;
  return Math.round((parseLocalDate(b) - parseLocalDate(a)) / 86400000);
}
function videoRotationStats(targetWeekStart = startOfPlanWeek()) {
  const stats = new Map((state.videos || []).map(video => [String(video.id), { plannedCount:0, completedCount:0, lastPlanned:'', lastCompleted:'' }]));
  const touch = id => {
    id = String(id || '');
    if (!id) return null;
    if (!stats.has(id)) stats.set(id, { plannedCount:0, completedCount:0, lastPlanned:'', lastCompleted:'' });
    return stats.get(id);
  };
  for (const [weekStart, plan] of Object.entries(state.plansByWeek || {})) {
    if (!Array.isArray(plan) || weekStart >= targetWeekStart) continue;
    for (const item of plan) {
      if (!item?.videoId || !item.date || item.date >= targetWeekStart) continue;
      const row = touch(item.videoId); if (!row) continue;
      row.plannedCount += 1;
      if (!row.lastPlanned || item.date > row.lastPlanned) row.lastPlanned = item.date;
    }
  }
  for (const record of state.feedback || []) {
    if (!record?.videoId || !record.date || record.date >= targetWeekStart || !['completed','partial','swapped'].includes(record.status)) continue;
    const row = touch(record.videoId); if (!row) continue;
    row.completedCount += 1;
    if (!row.lastCompleted || record.date > row.lastCompleted) row.lastCompleted = record.date;
  }
  return stats;
}
function recentRotationBlockedIds(targetWeekStart, days = 14) {
  const stats = videoRotationStats(targetWeekStart);
  const blocked = new Set();
  for (const [id, row] of stats) {
    const last = [row.lastPlanned, row.lastCompleted].filter(Boolean).sort().at(-1) || '';
    if (last && daysBetweenIso(last, targetWeekStart) <= days) blocked.add(id);
  }
  return blocked;
}
function rotationScoreAdjustment(video, targetWeekStart, stats) {
  const row = stats?.get(String(video.id)) || { plannedCount:0, completedCount:0, lastPlanned:'', lastCompleted:'' };
  const last = [row.lastPlanned, row.lastCompleted].filter(Boolean).sort().at(-1) || '';
  const age = last ? daysBetweenIso(last, targetWeekStart) : Infinity;
  let adjustment = 0;
  if (!last) adjustment += 30;                // 从未安排/完成过的视频优先探索
  else if (age <= 30) adjustment -= 32;       // 30 天内显著降权
  else if (age <= 60) adjustment -= 12;
  else adjustment += Math.min(12, Math.floor(age / 30));
  adjustment -= row.plannedCount * 2.5;
  adjustment -= row.completedCount * 4;
  return adjustment;
}
function deterministicTieBreak(videoId, weekStart) {
  const text = `${weekStart}|${videoId}`;
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0) / 4294967295;
}

function workoutDurationPolicy(assessment = {}) {
  const limit = Math.max(1, Number(assessment.timeAvailable || 15));
  return {
    limit,
    preferredMin: Math.max(1, Math.floor(limit * 0.8)),
    preferredMax: Math.ceil(limit * 1.2),
    hardMax: limit + 5
  };
}
function isVideoWithinTimeLimit(video, assessment = {}) {
  const duration = Number(video?.duration || 0);
  if (!Number.isFinite(duration) || duration <= 0) return false;
  return duration <= workoutDurationPolicy(assessment).hardMax;
}

// 3.3：把实际训练后的体感强度用于个人化排课。最近 3 次优先，避免一次偶然状态永久定义视频。
function personalEffortProfile(videoOrId) {
  const id = String(typeof videoOrId === 'object' ? videoOrId?.id : videoOrId || '');
  if (!id) return { count:0, average:null, recent:[], pains:new Set() };
  const recent = (state.feedback || [])
    .filter(record => String(record.videoId || '') === id && ['completed','partial','swapped'].includes(record.status) && Number(record.effort) >= 1)
    .sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
    .slice(0, 3);
  const average = recent.length ? recent.reduce((sum, record) => sum + Number(record.effort || 0), 0) / recent.length : null;
  const pains = new Set(recent.flatMap(record => Array.isArray(record.pains) ? record.pains : []));
  return { count:recent.length, average, recent, pains };
}
function fallbackVideoEffort(video) {
  let effort = video?.level === 'progress' ? 4 : video?.level === 'recovery' ? 2 : 3;
  if (video?.risk === 'high') effort += .6;
  else if (video?.risk === 'low') effort -= .3;
  if (video?.reserveOnly || video?.channel === 'Heather Robertson') effort = Math.max(effort, 4.5);
  return Math.max(1, Math.min(5, effort));
}
function personalVideoEffort(video) {
  const profile = personalEffortProfile(video);
  return profile.average ?? fallbackVideoEffort(video);
}
function targetEffortForAssessment(assessment = {}) {
  const mode = assessment.mode || determineMode(assessment);
  if (mode === 'recovery') return 2;
  if (mode === 'progress') return 4;
  return 3;
}
function personalEffortScoreAdjustment(video, assessment = {}, planContext = {}) {
  const profile = personalEffortProfile(video);
  const effort = profile.average ?? fallbackVideoEffort(video);
  const target = planContext.period?.active ? 1.8 : targetEffortForAssessment(assessment);
  let adjustment = -Math.abs(effort - target) * 13;
  if (profile.count) adjustment += 5; // 有真实体感数据时略优先于仅靠预设标签的同等候选
  if ((assessment.pains || []).some(pain => profile.pains.has(pain))) adjustment -= 70;
  return adjustment;
}

function videoScore(video, template, mode, usedIds, assessment, planContext = {}) {
  let score = 0;
  const period = planContext.period || { active:false };
  if (videoPreference(video) === 'favorite') score += 24;
  if (usedIds.has(video.id)) score -= 100;
  if (video.focus === template.type) score += 30;
  if (template.type === 'pilates' && ['pilates','postpartum','glutes'].includes(video.focus)) score += 12;
  if (template.type === 'glutes' && ['glutes','pilates'].includes(video.focus)) score += 12;
  if (mode === video.level) score += 15;
  if (mode === 'recovery' && video.risk === 'low') score += 16;
  if (mode === 'progress' && video.level === 'progress') score += 8;
  if (state.settings.preferMat && video.position === 'mat') score += 11;
  if (state.settings.avoidCrunch && video.crunchHeavy) score -= 80;
  if (assessment.pains.includes('foot') && video.position === 'standing') score -= 50;
  if (assessment.pains.includes('knee') && inferKneeFriendly(video)) score += 55;
  if (assessment.pains.includes('knee') && video.position === 'standing' && !inferKneeFriendly(video)) score -= 35;
  if (assessment.pains.includes('core') && !video.drFriendly) score -= 45;
  if (assessment.pains.includes('shoulder') && video.focus === 'mobility') score += 8;
  const durationPolicy = workoutDurationPolicy(assessment);
  const targetDuration = Math.min(template.target, durationPolicy.limit);
  const videoDuration = Number(video.duration || 0);
  score -= Math.abs(Math.min(videoDuration, 60) - targetDuration) * .8;
  if (videoDuration >= durationPolicy.preferredMin && videoDuration <= durationPolicy.preferredMax) score += 8;
  if (videoDuration > durationPolicy.limit) score -= (videoDuration - durationPolicy.limit) * 2.5;
  if (video.channel === 'MIZI' && mode !== 'progress') score -= 45;
  if ((video.reserveOnly || video.channel === 'Heather Robertson') && mode !== 'progress') score -= 120;
  if ((video.reserveOnly || video.channel === 'Heather Robertson') && mode === 'progress') score -= 18;
  score += personalEffortScoreAdjustment(video, assessment, planContext);
  if (period.active) {
    if (isStrictMenstrualVideo(video)) score += 80;
    if (video.risk === 'low') score += 24;
    if (['mobility','meditation'].includes(video.focus)) score += 34;
    if (video.duration <= 15) score += 14;
    if (/gentle|stretch|relax|recovery|mobility|breath|meditation|walking/i.test(`${video.title} ${video.note || ''}`)) score += 16;
    if (video.focus === 'cardio') score -= period.gentleOnly ? 60 : 15;
    if (video.level === 'progress') score -= 70;
  }
  if (planContext.weekStart && planContext.rotationStats) score += rotationScoreAdjustment(video, planContext.weekStart, planContext.rotationStats);
  if (planContext.weekStart) score += deterministicTieBreak(video.id, planContext.weekStart) * 1.5;
  return score;
}

function isVideoEligibleForAssessment(video, assessment, planContext = {}) {
  if (videoPreference(video) === 'dislike') return false;
  // 可用运动时间是硬限制：例如 15 分钟设置下，任何超过 20 分钟的视频都不能进入自动排课候选。
  if (!isVideoWithinTimeLimit(video, assessment)) return false;
  const period = planContext.period || { active:false };

  const personal = personalEffortProfile(video);
  const perceived = personal.average ?? fallbackVideoEffort(video);
  // 恢复/低精力时，用户自己评为 4/5 以上的视频不进入自动候选；5/5 仅在状态很好时自动候选。
  if (!period.active && (assessment.mode === 'recovery' || Number(assessment.energy || 3) <= 2) && perceived >= 4) return false;
  if (!period.active && perceived >= 4.75 && !(assessment.mode === 'progress' && Number(assessment.energy || 3) >= 4 && Number(assessment.load || 3) <= 3 && !(assessment.pains || []).length)) return false;
  // 若最近做这支视频时记录过与当前相同的不适，当前同部位不适时自动避开。
  if ((assessment.pains || []).some(pain => personal.pains.has(pain))) return false;
  if (period.active) {
    if (video.reserveOnly || video.channel === 'Heather Robertson' || video.channel === 'MIZI') return false;
    if (video.risk === 'high' || video.crunchHeavy || video.level === 'progress') return false;
    if (!isStrictMenstrualVideo(video)) return false;
    if (video.abTraining || video.pelvicInversion) return false;
    if (!['mobility','meditation','cardio'].includes(video.focus)) return false;
    if (period.gentleOnly && (video.focus === 'cardio' || video.risk !== 'low')) return false;
    if (!period.gentleOnly && video.risk === 'medium' && !['mobility','cardio'].includes(video.focus)) return false;
  } else {
    if (assessment.mode !== 'progress' && (video.reserveOnly || video.channel === 'Heather Robertson')) return false;
    if (assessment.mode === 'recovery' && video.channel === 'MIZI') return false;
  }
  if (state.settings.autoDowngrade && assessment.pains.includes('foot') && video.position === 'standing') return false;
  if (state.settings.autoDowngrade && assessment.pains.includes('knee') && video.position === 'standing' && !inferKneeFriendly(video)) return false;
  if (state.settings.autoDowngrade && assessment.pains.includes('core') && !video.drFriendly) return false;
  return true;
}

function rankedUnusedCandidates(approved, template, used, assessment, planContext = {}) {
  const effectiveMode = planContext.period?.active ? 'recovery' : assessment.mode;
  return approved
    .filter(video => !used.has(video.id))
    .filter(video => isVideoEligibleForAssessment(video, assessment, planContext))
    .map(video => ({ video, score: videoScore(video, template, effectiveMode, used, assessment, planContext) }))
    .sort((a, b) => b.score - a.score);
}

function chooseUniqueVideo(approved, template, used, assessment, index, planContext = {}) {
  const ranked = rankedUnusedCandidates(approved, template, used, assessment, planContext);
  if (!ranked.length) return null;
  if ((assessment.mode === 'recovery' || planContext.period?.active) && index === 6) {
    const gentle = ranked.find(item => ['mobility', 'meditation'].includes(item.video.focus));
    if (gentle) return gentle.video;
  }
  return ranked[0].video;
}

function buildWeeklyPlan(weekStart = startOfPlanWeek(), options = {}) {
  const dates = getWeekDates(weekStart);
  const assessment = state.assessment;
  assessment.mode = determineMode(assessment);
  const approved = approvedPlanVideos(weekStart);
  const blockedVideoIds = options.blockedVideoIds instanceof Set
    ? new Set(options.blockedVideoIds)
    : new Set(options.blockedVideoIds || []);
  const preserveBeforeDate = options.preserveBeforeDate || '';
  const existingPlan = Array.isArray(options.existingPlan) ? options.existingPlan : [];
  const existingByDate = new Map(existingPlan.map(item => [item.date, item]));
  const rotationStats = videoRotationStats(weekStart);
  // 除相邻两周去重外，默认硬性避开过去 14 天已安排或完成的视频。
  for (const id of recentRotationBlockedIds(weekStart, 14)) blockedVideoIds.add(id);
  // 当前周中“今天之前”的既有安排属于历史部分：保留原视频，并占用视频 ID，
  // 这样从今天开始重排时不会把已经练过/已经安排过的视频再次排进本周。
  if (preserveBeforeDate) {
    for (const item of existingPlan) {
      if (item?.date && item.date < preserveBeforeDate && item.videoId) blockedVideoIds.add(item.videoId);
    }
  }
  const used = new Set(blockedVideoIds);
  return dayTemplates.map((baseTemplate, index) => {
    const date = dates[index];
    if (preserveBeforeDate && date < preserveBeforeDate) {
      const existing = existingByDate.get(date);
      if (existing) {
        if (existing.videoId) used.add(existing.videoId);
        return existing; // 完整保留过去日期，不改视频、理由或生成时间。
      }
      return {
        date, day: baseTemplate.day, category: baseTemplate.label,
        videoId: null, videoSnapshot: null, periodDay: 0,
        rationale: '该日期已过去，重新生成计划时不再补排或改动。',
        generatedAt: new Date().toISOString()
      };
    }
    const period = menstrualContextForDate(date);
    const template = menstrualTemplateForDay(baseTemplate, period);
    const planContext = { date, period, weekStart, rotationStats };
    const chosen = chooseUniqueVideo(approved, template, used, assessment, index, planContext);
    if (chosen) used.add(chosen.id);
    return {
      date, day: baseTemplate.day, category: template.label,
      videoId: chosen?.id || null,
      videoSnapshot: chosen ? {
        id: chosen.id, title: chosen.title, channel: chosen.channel, duration: chosen.duration,
        focus: chosen.focus, position: chosen.position, risk: chosen.risk, reserveOnly: !!chosen.reserveOnly,
        url: chosen.url, thumbnail: chosen.thumbnail
      } : null,
      periodDay: period.active ? period.day : 0,
      rationale: buildRationale(template, chosen, assessment, index, planContext),
      generatedAt: new Date().toISOString()
    };
  });
}

function markPlanLocked(weekStart, reason = 'generated') {
  if (!state.planMetaByWeek || typeof state.planMetaByWeek !== 'object') state.planMetaByWeek = {};
  state.planMetaByWeek[weekStart] = { locked:true, reason, updatedAt:new Date().toISOString() };
}
function isPlanLocked(weekStart) {
  return !!state.planMetaByWeek?.[weekStart]?.locked && planForWeek(weekStart).length === 7;
}

function planVideoIds(weekStart) {
  return new Set(planForWeek(weekStart).map(item => item.videoId).filter(Boolean));
}
function currentAndNextWeekStarts() {
  const current = startOfPlanWeek();
  return { current, next: addDays(current, 7) };
}
function crossWeekBlockedVideoIds(weekStart) {
  const { current, next } = currentAndNextWeekStarts();
  if (weekStart === next) return planVideoIds(current);
  if (weekStart === current) return planVideoIds(next);
  return new Set();
}
function buildPlanWithCrossWeekRules(weekStart) {
  const { current, next } = currentAndNextWeekStarts();
  if (weekStart === next) {
    return buildWeeklyPlan(next, { blockedVideoIds: planVideoIds(current) });
  }
  return buildWeeklyPlan(weekStart);
}
function generatePlan(weekStart = selectedWeekStart) {
  if (weekRelation(weekStart) === 'past') { showToast('历史周计划已锁定，避免覆盖原安排'); return; }
  const { current, next } = currentAndNextWeekStarts();
  let plan;
  if (weekStart === current) {
    const today = torontoDate();
    plan = buildWeeklyPlan(current, { preserveBeforeDate: today, existingPlan: planForWeek(current) });
    setPlanForWeek(current, plan); markPlanLocked(current, 'manual-regenerate-from-today');
    setPlanForWeek(next, buildWeeklyPlan(next, { blockedVideoIds: planVideoIds(current) })); markPlanLocked(next, 'paired-with-current');
  } else {
    plan = buildPlanWithCrossWeekRules(weekStart);
    setPlanForWeek(weekStart, plan); markPlanLocked(weekStart, 'manual-regenerate');
  }
  saveState(); renderAll();
  const blankDays = plan.filter(item => !item.videoId).length;
  const periodDays = plan.filter(item => item.periodDay).length;
  const label = weekViewLabel(weekStart);
  showToast(blankDays
    ? `${label}已生成；${blankDays} 天因周内及跨周候选不足安排休息或自主恢复`
    : periodDays
      ? `${label}已为 ${periodDays} 个生理期日期安排温和训练，并避免与相邻计划周重复`
      : weekStart === current
        ? '本周从今天起已重新生成；过去日期保持不变，下周也已按最新状态更新'
        : `${label}已生成；周内无重复，并已避开本周使用的视频`);
}
function regenerateCurrentAndNext() {
  const { current, next } = currentAndNextWeekStarts();
  const today = torontoDate();
  const currentPlan = buildWeeklyPlan(current, { preserveBeforeDate: today, existingPlan: planForWeek(current) });
  setPlanForWeek(current, currentPlan); markPlanLocked(current, 'state-change-from-today');
  setPlanForWeek(next, buildWeeklyPlan(next, { blockedVideoIds: planVideoIds(current) })); markPlanLocked(next, 'state-change');
  saveState(); renderAll();
}

function buildRationale(template, video, assessment, index, planContext = {}) {
  const period = planContext.period || { active:false };
  if (!video) return period.active
    ? '没有已确认同时不含腹肌训练和臀桥／骨盆抬高动作的视频，本日改为休息、轻松散步或自主舒缓。'
    : '已避免周内及本周／下周之间重复；当前可用候选视频不足，本日改为休息或自主恢复。';
  const reasons = [];
  if (period.active) {
    reasons.push(`生理期第 ${period.day} 天`);
    reasons.push(period.gentleOnly ? '仅安排已确认不含腹肌训练和骨盆倒置的温和视频' : '排除腹肌训练及臀桥／骨盆抬高动作');
    if (period.flow === 'heavy') reasons.push('经量偏多，避免高强度');
  } else if (assessment.mode === 'recovery') reasons.push('本周以恢复为主');
  if (assessment.pains.includes('foot') && video?.position !== 'standing') reasons.push('减少足部站立负荷');
  if (assessment.pains.includes('shoulder') && video?.focus === 'mobility') reasons.push('照顾肩颈紧张');
  if (video?.position === 'mat') reasons.push('垫上训练优先');
  if (!period.active && (index === 0 || index === 5)) reasons.push('作为主动恢复日');
  return reasons.length ? reasons.join('；') + '。' : `按${template.label}结构安排，强度与本周状态匹配。`;
}

function getVideo(id) { return state.videos.find(v => v.id === id); }
function getPlanVideo(planItem) {
  if (!planItem) return null;
  const live = getVideo(planItem.videoId);
  const snapshot = planItem.videoSnapshot;
  if (weekRelation(weekStartForDate(planItem.date)) === 'past' && snapshot) return snapshot;
  return live || snapshot || null;
}
function isPlanFeedback(record) {
  const source = record?.source || 'plan';
  return source === 'plan' || (source === 'community' && record?.overridesPlan !== false);
}
function getFeedback(date) {
  const records = (state.feedback || []).filter(f => f.date === date && isPlanFeedback(f));
  return records.find(record => record.source === 'community' && record.overridesPlan !== false)
    || records.find(record => (record.source || 'plan') === 'plan')
    || null;
}
function communityRecordForDate(date) {
  return (state.feedback || []).find(record => record.date === date && record.source === 'community') || null;
}
function communityClassTitle(type = 'pilates') {
  return type === 'yoga' ? 'Community Centre 瑜伽课' : 'Community Centre 普拉提课';
}
function createFeedbackRecordId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `feedback-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
}
function normalizedChannelName(name = '') { return String(name).trim().toLowerCase(); }
function ensureWeekCollections() {
  if (!state.plansByWeek || typeof state.plansByWeek !== 'object') state.plansByWeek = {};
  if (!state.planMetaByWeek || typeof state.planMetaByWeek !== 'object') state.planMetaByWeek = {};
  if (!state.weekPreferencesByStart || typeof state.weekPreferencesByStart !== 'object') state.weekPreferencesByStart = {};
}
function weekPreferencesFor(weekStart = selectedWeekStart) {
  ensureWeekCollections();
  const existing = state.weekPreferencesByStart[weekStart] || { excludedChannels: [] };
  if (!Array.isArray(existing.excludedChannels)) existing.excludedChannels = [];
  state.weekPreferencesByStart[weekStart] = existing;
  if (weekStart === startOfPlanWeek()) state.weekPreferences = { weekStart, excludedChannels: [...existing.excludedChannels] };
  return existing;
}
function planForWeek(weekStart = selectedWeekStart) {
  ensureWeekCollections();
  return Array.isArray(state.plansByWeek[weekStart]) ? state.plansByWeek[weekStart] : [];
}
function setPlanForWeek(weekStart, plan) {
  ensureWeekCollections();
  state.plansByWeek[weekStart] = Array.isArray(plan) ? plan : [];
  if (weekStart === startOfPlanWeek()) state.plan = state.plansByWeek[weekStart];
}
function weekStartForDate(date) { return startOfPlanWeek(date || torontoDate()); }
function findPlanItemByDate(date) {
  if (!date) return null;
  return planForWeek(weekStartForDate(date)).find(item => item.date === date) || null;
}
function allPlanItems() {
  ensureWeekCollections();
  return Object.values(state.plansByWeek).flatMap(plan => Array.isArray(plan) ? plan : []);
}
function weekRelation(weekStart = selectedWeekStart) {
  const current = startOfPlanWeek();
  if (weekStart < current) return 'past';
  if (weekStart > current) return 'future';
  return 'current';
}
function weekViewLabel(weekStart = selectedWeekStart) {
  const relation = weekRelation(weekStart);
  if (relation === 'current') return '本周计划';
  if (weekStart === addDays(startOfPlanWeek(), -7)) return '上周回顾';
  if (weekStart === addDays(startOfPlanWeek(), 7)) return '下周预览';
  return relation === 'past' ? '历史周回顾' : '未来周预览';
}
function excludedChannelSet(weekStart = selectedWeekStart) {
  return new Set(weekPreferencesFor(weekStart).excludedChannels.map(normalizedChannelName));
}
function isChannelExcluded(channel, weekStart = selectedWeekStart) { return excludedChannelSet(weekStart).has(normalizedChannelName(channel)); }
function approvedPlanVideos(weekStart = selectedWeekStart) {
  const excluded = excludedChannelSet(weekStart);
  return state.videos.filter(v => v.approved && !v.rejected && v.autoPlanEligible !== false && !v.needsReview && !excluded.has(normalizedChannelName(v.channel)));
}
function availableWeekChannels() {
  const names = [];
  const seen = new Set();
  const add = name => {
    const clean = String(name || '').trim(); const key = normalizedChannelName(clean);
    if (clean && !seen.has(key)) { seen.add(key); names.push(clean); }
  };
  defaultChannels.forEach(c => add(c.name));
  (state.settings.channels || []).forEach(c => add(c.name));
  state.videos.filter(v => v.approved && !v.rejected).forEach(v => add(v.channel));
  return names;
}
function actualRecordsForDate(date) {
  return (state.feedback || [])
    .filter(record => record.date === date)
    .sort((a,b) => {
      const priority = record => record.source === 'community' && record.overridesPlan !== false ? 0 : record.source === 'plan' ? 1 : 2;
      return priority(a) - priority(b) || String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
    });
}
function actualTrainingMarkup(date) {
  const records = actualRecordsForDate(date);
  if (!records.length) return '<div class="actual-empty">实际：未记录训练</div>';
  return `<div class="actual-training"><strong>实际记录</strong>${records.map(record => {
    const video = getVideo(record.videoId);
    const isCommunity = record.source === 'community';
    const title = isCommunity ? (record.activityTitle || communityClassTitle(record.activityType)) : (video?.title || record.videoTitle || '自主训练');
    const channel = isCommunity ? 'Community Centre' : (video?.channel || record.videoChannel || '');
    const source = isCommunity
      ? (record.overridesPlan !== false ? '现场课 · 覆盖当天计划' : '现场课 · 额外训练')
      : record.source === 'library' ? '额外训练' : '周计划';
    return `<div class="actual-training-row ${isCommunity ? 'community-actual-row' : ''}"><span>${escapeHtml(statusLabels[record.status] || record.status)} · ${Number(record.minutes || 0)} 分钟</span><b>${escapeHtml(title)}</b>${channel ? `<small>${escapeHtml(channel)} · ${source}</small>` : `<small>${source}</small>`}</div>`;
  }).join('')}</div>`;
}


function verificationBadge(video) {
  const status = video.verificationStatus || (video.starter ? 'curated' : 'manual');
  if (video.needsReview) return '<span class="mini-tag audit-corrected">资料已修改 · 待确认</span>';
  if (status === 'verified') return '<span class="mini-tag audit-verified">人工确认资料</span>';
  if (status === 'corrected') return '<span class="mini-tag audit-corrected">资料已校正</span>';
  if (video.starter || status === 'curated') return '<span class="mini-tag audit-verified">内置资料</span>';
  return '<span class="mini-tag audit-pending">手动资料</span>';
}

function renderLibraryAuditStatus() {
  const host = document.getElementById('libraryAuditStatus');
  if (!host) return;
  const starterCount = state.videos.filter(video => video.starter && video.approved && !video.rejected).length;
  const manualCount = state.videos.filter(video => !video.starter && video.approved && !video.rejected).length;
  host.innerHTML = `<div class="audit-panel"><div><strong>v17 定向纠错</strong><p>已移除 47EwctVwir4、zYInbggfukg、32DsAJUru8E 三条误标为 Pregnancy and Postpartum TV 的内置视频。内置频道标签仅用于整理，不再显示为“全库已核实”；发现不符时可在视频库中直接修改。</p></div><span class="audit-ok-count">已移除 3 条</span></div>`;
}

window.verifyVideoMetadata = function(id) {
  const video = getVideo(id);
  if (!video) return;
  const url = normalizeYouTubeVideoUrl(video.url || youtubeWatchUrl(video.id || ''));
  if (!url) {
    showToast('这条记录缺少有效的 YouTube 视频链接');
    return;
  }
  openYouTubeUrl(url);
  showToast('正在打开 YouTube；核对后可用“搜索 / 修改”更新频道或标题');
};

window.confirmCorrectedVideo = function(id) {
  const video = getVideo(id);
  if (!video) return;
  video.needsReview = false;
  video.autoPlanEligible = true;
  video.verificationStatus = video.starter ? 'curated' : 'manual';
  video.verificationNote = '';
  saveState(); generatePlanSilently(); renderAll(); showToast('已确认，视频可继续参与自动排课');
};

function clearLegacyVerificationErrors() {
  let cleared = 0;
  state.videos.forEach(video => {
    if (/^本次未能核实/.test(String(video.verificationNote || '')) || ['pending','unavailable'].includes(video.verificationStatus)) {
      video.verificationNote = '';
      video.verificationStatus = video.starter ? 'curated' : 'manual';
      video.needsReview = false;
      if (video.autoPlanEligible === undefined) video.autoPlanEligible = true;
      cleared += 1;
    }
  });
  state.libraryAudit = { ...defaultState().libraryAudit, running:false, pending:0 };
  saveState(); renderAll();
  return cleared;
}

function mergeStarterLibrary() {
  const existingIds = new Set(state.videos.map(video => String(video.id)));
  const additions = sampleVideos.filter(video => !existingIds.has(String(video.id))).map(video => structuredClone(video));
  if (!additions.length) { showToast(`内置备用视频已完整，共 ${sampleVideos.length} 条`); return; }
  state.videos.push(...additions);
  saveState();
  generatePlanSilently();
  renderAll();
  showToast(`已补充 ${additions.length} 条内置备用视频`);
}

function bindDialogCloseControls() {
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelectorAll('button[value="cancel"], [data-close-dialog]').forEach(button => {
      button.type = 'button';
      button.addEventListener('click', event => {
        event.preventDefault();
        dialog.close('cancel');
      });
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) dialog.close('cancel');
    });
  });
  const videoDialog = document.getElementById('videoDialog');
  videoDialog?.addEventListener('close', () => {
    if (videoDialog.returnValue === 'cancel') document.getElementById('videoForm')?.reset();
    renderAddVideoChannelOptions();
  });
}

function fillMissingPlanSlots(weekStart) {
  const existing = planForWeek(weekStart);
  if (!Array.isArray(existing) || !existing.length) return false;
  const dates = getWeekDates(weekStart);
  const assessment = state.assessment;
  assessment.mode = determineMode(assessment);
  const approved = approvedPlanVideos(weekStart);
  const used = new Set(existing.map(item => item?.videoId).filter(Boolean));
  const { current, next } = currentAndNextWeekStarts();
  if (weekStart === current) for (const id of planVideoIds(next)) used.add(id);
  if (weekStart === next) for (const id of planVideoIds(current)) used.add(id);
  for (const id of recentRotationBlockedIds(weekStart, 14)) used.add(id);
  const rotationStats = videoRotationStats(weekStart);
  let changed = false;
  const repaired = existing.map((item, index) => {
    if (item?.videoId) return item;
    const date = item?.date || dates[index];
    const baseTemplate = dayTemplates[index] || dayTemplates[0];
    const period = menstrualContextForDate(date);
    const template = menstrualTemplateForDay(baseTemplate, period);
    const chosen = chooseUniqueVideo(approved, template, used, assessment, index, { date, period, weekStart, rotationStats });
    if (!chosen) return { ...item, date, day:baseTemplate.day, category:template.label, rationale:buildRationale(template, null, assessment, index, {date,period,weekStart,rotationStats}) };
    used.add(chosen.id); changed = true;
    return { ...item, date, day:baseTemplate.day, category:template.label, videoId:chosen.id, videoSnapshot:{id:chosen.id,title:chosen.title,channel:chosen.channel,duration:chosen.duration,focus:chosen.focus,position:chosen.position,risk:chosen.risk,reserveOnly:!!chosen.reserveOnly,url:chosen.url,thumbnail:chosen.thumbnail}, periodDay:period.active?period.day:0, rationale:buildRationale(template, chosen, assessment, index, {date,period,weekStart,rotationStats}), generatedAt:new Date().toISOString() };
  });
  if (changed) { setPlanForWeek(weekStart, repaired); markPlanLocked(weekStart, 'retired-channel-repair'); }
  return changed;
}
function repairRetiredChannelSlots() {
  state.videos = (state.videos || []).filter(video => !isRetiredChannelName(video.channel));
  state.settings.channels = (state.settings?.channels || []).filter(channel => !isRetiredChannelName(channel.name));
  const current = startOfPlanWeek();
  for (const [weekStart, plan] of Object.entries(state.plansByWeek || {})) {
    if (!Array.isArray(plan) || weekStart < current) continue; // 历史快照保留
    let changed = false;
    state.plansByWeek[weekStart] = plan.map(item => {
      const snapshotChannel = item?.videoSnapshot?.channel || '';
      const live = (state.videos || []).find(video => String(video.id) === String(item?.videoId));
      if (isRetiredChannelName(snapshotChannel) || (!live && item?.videoId && isRetiredChannelName(snapshotChannel))) {
        changed = true;
        return { ...item, videoId:null, videoSnapshot:null, rationale:'Jessica Valant 已从视频库移除，本日将从其他频道补位。' };
      }
      return item;
    });
    if (changed) fillMissingPlanSlots(weekStart);
  }
}
function ensureCurrentAndNextPlans() {
  const current = startOfPlanWeek();
  const next = addDays(current, 7);
  if (!planForWeek(current).length) { setPlanForWeek(current, buildWeeklyPlan(current)); markPlanLocked(current, 'auto-first-create'); }
  if (!planForWeek(next).length) { setPlanForWeek(next, buildWeeklyPlan(next, { blockedVideoIds:planVideoIds(current) })); markPlanLocked(next, 'auto-first-create'); }
}

function renderAll() {
  ensureWeekCollections();
  const current = startOfPlanWeek();
  const next = addDays(current, 7);
  ensureCurrentAndNextPlans();
  state.plan = planForWeek(current);
  state.weekPreferences = { weekStart: current, excludedChannels: [...weekPreferencesFor(current).excludedChannels] };
  renderHeader(); renderHome(); renderWeek(); renderLibrary(); renderReview(); renderInsights(); renderSettings();
}
function generatePlanSilently(weekStart = startOfPlanWeek()) {
  const { current, next } = currentAndNextWeekStarts();
  // 自动渲染只补“尚不存在”的计划，绝不重算已经生成的周计划。
  if (weekStart === current) {
    if (!planForWeek(current).length) {
      setPlanForWeek(current, buildWeeklyPlan(current)); markPlanLocked(current, 'auto-first-create');
    }
    if (!planForWeek(next).length) {
      setPlanForWeek(next, buildWeeklyPlan(next, { blockedVideoIds: planVideoIds(current) })); markPlanLocked(next, 'auto-first-create');
    }
  } else if (!planForWeek(weekStart).length) {
    setPlanForWeek(weekStart, buildPlanWithCrossWeekRules(weekStart)); markPlanLocked(weekStart, 'auto-first-create');
  }
  saveState();
}

function renderHeader() {
  const today = torontoDate();
  document.getElementById('todayDate').textContent = new Intl.DateTimeFormat('zh-CN',{timeZone:TZ,year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(new Date());
  document.getElementById('reviewBadge').textContent = state.pending.filter(v => !v.approved && !v.rejected).length;
  const week = getWeekDates(selectedWeekStart);
  document.getElementById('weekRange').textContent = `${formatDate(week[0],{year:'numeric'})} — ${formatDate(week[6],{year:'numeric'})}`;
}

function renderHome() {
  const today = torontoDate();
  const planItem = state.plan.find(p => p.date === today) || state.plan[0];
  const video = getVideo(planItem?.videoId);
  const feedback = getFeedback(planItem?.date);
  const communityRecord = communityRecordForDate(today);
  const todayFeedbackLabel = feedback?.source === 'community'
    ? `已由${communityClassTitle(feedback.activityType)}覆盖`
    : feedback ? statusLabels[feedback.status] : '尚未记录';
  document.getElementById('todayHero').innerHTML = video ? `
    <div class="hero-layout">
      <div class="hero-content">
        <p class="eyebrow hero-eyebrow">${escapeHtml(planItem.category)} · ${escapeHtml(todayFeedbackLabel)}</p>
        <h3>${escapeHtml(video.title)}</h3>
        <p class="hero-channel">${escapeHtml(video.channel)}</p>
        <div class="hero-meta">
          <span class="pill">${video.duration} 分钟</span>
          <span class="pill">${positionLabels[video.position]}</span><span class="pill">${riskLabels[video.risk]}</span>
        </div>
        <p class="hero-rationale">${escapeHtml(planItem.rationale)}</p>
        <div class="hero-actions">
          ${videoLinkMarkup(video, '▶ 开始训练', 'primary-btn')}
          <button class="secondary-btn" onclick="openFeedback('${planItem.date}')">${feedback && feedback.source !== 'community' ? '修改记录' : '训练后打卡'}</button>
          <button class="secondary-btn community-btn" onclick="openCommunityClass('${today}')">${communityRecord ? '修改现场课' : '现场课打卡'}</button>
        </div>
      </div>
      <div class="hero-visual">${video.thumbnail ? `<img src="${escapeHtml(video.thumbnail)}" alt="${escapeHtml(video.title)}的视频封面">` : `<div class="hero-visual-placeholder">${escapeHtml(video.channel)}</div>`}</div>
    </div>` : `<div class="hero-layout hero-rest-layout"><div class="hero-content"><p class="eyebrow hero-eyebrow">今日恢复</p><h3>休息 / 自主恢复</h3><p class="hero-rationale">${escapeHtml(planItem?.rationale || '当前可用候选视频不足，已避免周内及本周／下周重复安排。')}</p><div class="hero-actions"><button class="secondary-btn community-btn" onclick="openCommunityClass('${today}')">${communityRecord ? '修改现场课' : 'Community Centre 课程打卡'}</button></div></div><div class="hero-rest-mark">REST</div></div>`;

  const pains = state.assessment.pains || [];
  document.getElementById('quickCheck').innerHTML = `
    <div class="check-option"><div><strong>精力状态</strong><div class="helper" style="margin:4px 0 0">本周评估 ${state.assessment.energy}/5</div></div><button onclick="document.getElementById('assessmentDialog').showModal()">调整</button></div>
    <div class="check-option"><div><strong>当前不适</strong><div class="helper" style="margin:4px 0 0">${pains.length ? pains.map(painName).join('、') : '未记录不适'}</div></div><button onclick="document.getElementById('assessmentDialog').showModal()">更新</button></div>
    <div class="check-option"><div><strong>生理期安排</strong><div class="helper" style="margin:4px 0 0">${state.menstrual.enabled ? menstrualStatusText() : '未启用；可按日期自动降低强度'}</div></div><button onclick="openMenstrualDialog()">${state.menstrual.enabled ? '修改' : '设置'}</button></div>
    <div class="check-option"><div><strong>今日替换</strong><div class="helper" style="margin:4px 0 0">按今天状态临时调整，不改变整周评估</div></div><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end"><button onclick="swapPlan('${planItem?.date}')">换轻一点</button><button onclick="challengePlan('${planItem?.date}')">挑战一点</button></div></div>
    <div class="check-option community-check-option"><div><strong>Community Centre 现场课</strong><div class="helper" style="margin:4px 0 0">普拉提或瑜伽课可直接覆盖今日视频</div></div><button onclick="openCommunityClass('${today}')">${communityRecord ? '修改' : '打卡'}</button></div>`;

  const activeStatuses = new Set(['completed','partial','swapped']);
  const completed = new Set(state.feedback.filter(f => getWeekDates().includes(f.date) && activeStatuses.has(f.status)).map(f => f.date)).size;
  const minutes = state.feedback.filter(f => getWeekDates().includes(f.date)).reduce((sum,f)=>sum+Number(f.minutes||0),0);
  document.getElementById('weekSummary').innerHTML = `
    ${summaryCard('恢复等级', modeLabels[state.assessment.mode])}
    ${summaryCard('完成天数', `${completed}/7`)}
    ${summaryCard('累计分钟', `${minutes}`)}
    ${summaryCard('待审核视频', `${state.pending.filter(v=>!v.approved&&!v.rejected).length}`)}
  `;
}
function summaryCard(label, value, small='') { return `<div class="summary-card"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong>${small?`<small>${escapeHtml(small)}</small>`:''}</div>`; }
function painName(p) { return ({foot:'足弓/前脚掌',knee:'膝盖',back:'下背',shoulder:'肩颈',hip:'髋屈肌',core:'腹部压力'})[p] || p; }

function renderWeeklyChannelFilter() {
  const excluded = excludedChannelSet(selectedWeekStart);
  const channels = availableWeekChannels();
  document.getElementById('weeklyChannelChoices').innerHTML = channels.map(channel => {
    const checked = excluded.has(normalizedChannelName(channel));
    return `<label class="weekly-channel-choice ${checked ? 'selected' : ''}"><input type="checkbox" name="weeklyExcludedChannel" value="${escapeHtml(channel)}" ${checked ? 'checked' : ''}><span>${escapeHtml(channel)}</span></label>`;
  }).join('');
  const selected = weekPreferencesFor(selectedWeekStart).excludedChannels || [];
  document.getElementById('weeklyChannelStatus').textContent = selected.length
    ? `这一周已排除 ${selected.length} 个频道：${selected.join('、')}`
    : '这一周所有候选频道都可以参与排课。';
  document.querySelectorAll('input[name="weeklyExcludedChannel"]').forEach(input => {
    input.addEventListener('change', () => input.closest('.weekly-channel-choice')?.classList.toggle('selected', input.checked));
  });
}

function weekThumbnailMarkup(video) {
  if (!video) return '<div class="day-thumb-placeholder">REST</div>';
  const image = video.thumbnail
    ? `<img src="${escapeHtml(video.thumbnail)}" alt="${escapeHtml(video.title)}的视频封面" loading="lazy">`
    : `<div class="day-thumb-placeholder">${escapeHtml(video.channel)}</div>`;
  const url = normalizeYouTubeVideoUrl(video.url || '');
  return url ? `<a class="day-thumb-link youtube-app-link" href="${escapeHtml(url)}" onclick="return openYouTubeFromApp(event, this.href)">${image}</a>` : image;
}

function renderMenstrualPanel() {
  const m = state.menstrual;
  const currentWeekPeriodDays = getWeekDates(selectedWeekStart).filter(isMenstrualDay);
  const summary = document.getElementById('menstrualSummary');
  const clearBtn = document.getElementById('clearMenstrualBtn');
  if (!summary || !clearBtn) return;
  clearBtn.classList.toggle('hidden', !m.enabled);
  summary.innerHTML = m.enabled
    ? `<div class="menstrual-active"><div><strong>${escapeHtml(menstrualStatusText())}</strong><p>${currentWeekPeriodDays.length ? `所选周有 ${currentWeekPeriodDays.length} 天处于生理期，重新生成后这些日期只会安排已确认不含腹肌训练、臀桥或骨盆抬高动作的视频。` : '当前设置的生理期不与所选周重叠；日期到达相应周时会自动应用。'}</p></div><span class="period-mode-tag">已启用</span></div>`
    : `<div class="menstrual-inactive"><strong>尚未设置生理期</strong><p>设置开始日期和症状后，可一键重新安排所选周的重叠日期。生理期模式不会自动安排腹肌训练、臀桥／骨盆抬高类动作、MIZI、Heather Robertson、高腹压或进阶视频。</p></div>`;
}

function renderWeek() {
  const a = state.assessment;
  const relation = weekRelation(selectedWeekStart);
  const selectedPlan = planForWeek(selectedWeekStart);
  const preferences = weekPreferencesFor(selectedWeekStart);
  const excluded = preferences.excludedChannels || [];
  const isPast = relation === 'past';
  const isFuture = relation === 'future';
  document.getElementById('weekViewLabel').textContent = weekViewLabel(selectedWeekStart);
  if (document.getElementById('view-week').classList.contains('active')) document.getElementById('viewTitle').textContent = weekViewLabel(selectedWeekStart);
  document.getElementById('currentWeekBtn').classList.toggle('hidden', relation === 'current');
  document.getElementById('generateBtn').classList.toggle('hidden', isPast);
  document.getElementById('assessmentBtn').classList.toggle('hidden', isPast);
  document.getElementById('generateBtn').textContent = isFuture ? '重新生成下周计划' : '重新生成计划';
  document.getElementById('weeklyChannelPanel').classList.toggle('read-only-week', isPast);
  document.getElementById('applyWeeklyChannelsBtn').disabled = isPast;
  document.getElementById('clearWeeklyChannelsBtn').disabled = isPast;
  document.getElementById('menstrualSettingsBtn').disabled = isPast;
  document.getElementById('clearMenstrualBtn').disabled = isPast;
  renderMenstrualPanel();
  const contextNote = isFuture ? ' · 下周预览沿用当前身体状态，可在下周开始前重新评估' : isPast ? ' · 历史周计划已锁定' : '';
  document.getElementById('assessmentSummary').innerHTML = `<div class="assessment-banner"><div><strong>${weekViewLabel(selectedWeekStart)}：${modeLabels[a.mode]}</strong><p>精力 ${a.energy}/5 · 带娃负荷 ${a.load}/5 · 每天约 ${a.timeAvailable} 分钟${a.pains.length ? ` · 不适：${a.pains.map(painName).join('、')}` : ''}${state.menstrual.enabled ? ' · 已设置生理期' : ''}${excluded.length ? ` · 所选周排除 ${excluded.length} 个频道` : ''}${contextNote}</p></div><span class="mode-tag">${isPast ? '回顾' : isFuture ? '预览' : modeLabels[a.mode]}</span></div>`;
  renderWeeklyChannelFilter();
  document.querySelectorAll('input[name="weeklyExcludedChannel"]').forEach(input => input.disabled = isPast);
  const pairedWeekIds = crossWeekBlockedVideoIds(selectedWeekStart);
  const availableCount = approvedPlanVideos(selectedWeekStart).filter(video => !pairedWeekIds.has(video.id) && isVideoEligibleForAssessment(video, a)).length;
  const blankDays = selectedPlan.filter(item => !item.videoId).length;
  const scheduledCount = selectedPlan.length - blankDays;
  const weekRecords = state.feedback.filter(record => getWeekDates(selectedWeekStart).includes(record.date));
  const completedDates = new Set(weekRecords.filter(record => ['completed','partial','swapped'].includes(record.status)).map(record => record.date));
  const actualActivities = new Set(weekRecords
    .filter(record => ['completed','partial','swapped'].includes(record.status))
    .map(record => record.videoId || (record.source === 'community' ? `community:${record.activityType || 'class'}:${record.date}` : record.recordId))
    .filter(Boolean));
  document.getElementById('weekReviewSummary').innerHTML = `
    ${summaryCard(isPast ? '原计划视频' : '计划视频', String(scheduledCount))}
    ${summaryCard('实际训练天数', String(completedDates.size))}
    ${summaryCard('实际完成项目', String(actualActivities.size))}
    ${summaryCard('实际分钟', String(weekRecords.filter(record => ['completed','partial','swapped'].includes(record.status)).reduce((sum, record) => sum + Number(record.minutes || 0), 0)))}
  `;
  document.getElementById('planAvailabilityNotice').innerHTML = !selectedPlan.length
    ? `<div class="notice"><strong>这一周还没有保存计划。</strong><br>${isPast ? '升级前未保存该周计划，但下方仍会显示已有实际训练记录。' : '点击重新生成计划创建这一周的安排。'}</div>`
    : blankDays
      ? `<div class="notice"><strong>已启用周内与跨周不重复排课。</strong><br>排除相邻计划周已用视频后，这一周有 ${availableCount} 个可用候选，已安排 ${scheduledCount} 个不同视频；其余 ${blankDays} 天显示为休息或自主恢复。</div>`
      : `<div class="notice"><strong>${isPast ? '历史计划与实际记录并列显示。' : selectedWeekStart === addDays(startOfPlanWeek(), 7) ? '下周与本周没有重复视频。' : '本周内部没有重复；下周生成时也会避开这些视频。'}</strong><br>已从 ${availableCount} 个可用候选中安排 ${scheduledCount} 个不同视频。</div>`;
  const today = torontoDate();
  const dates = getWeekDates(selectedWeekStart);
  const planByDate = new Map(selectedPlan.map(item => [item.date, item]));
  document.getElementById('weekPlan').innerHTML = dates.map((date, index) => {
    const item = planByDate.get(date) || { date, day: dayTemplates[index].day, category: dayTemplates[index].label, videoId:null, rationale:'该周没有保存此日期的计划。', periodDay:0 };
    const video = getPlanVideo(item); const feedback = getFeedback(item.date);
    const communityRecord = communityRecordForDate(item.date);
    const canEditPlan = !isPast;
    const canRecord = item.date <= today && !!video;
    const canRecordCommunity = item.date <= today;
    return `<article class="day-card ${item.date===today?'today':''} ${isPast?'past-week-card':''} ${isFuture?'future-week-card':''}">
      <div class="day-date"><strong>${parseLocalDate(item.date).getDate()}</strong><span>${item.day}</span></div>
      <div class="day-media">${weekThumbnailMarkup(video)}</div>
      <div class="day-content">
        <p class="day-category">计划 · ${escapeHtml(item.category)}</p>
        ${item.periodDay ? `<span class="period-day-badge">生理期第 ${item.periodDay} 天</span>` : ''}
        <h4>${video ? escapeHtml(video.title) : '休息 / 自主恢复'}</h4>
        ${video ? `<p class="day-channel">${escapeHtml(video.channel)}</p>` : ''}
        <p class="day-rationale">${escapeHtml(item.rationale)}</p>
        ${video ? `<div class="mini-tags"><span class="mini-tag">${video.duration} 分钟</span><span class="mini-tag">${focusLabels[video.focus]||video.focus}</span><span class="mini-tag">${positionLabels[video.position]}</span>${video.reserveOnly?'<span class="mini-tag reserve-tag">高强度备用</span>':''}</div>` : ''}
        ${actualTrainingMarkup(item.date)}
      </div>
      <div class="day-actions">
        ${video ? videoLinkMarkup(video, '播放') : ''}
        ${canEditPlan ? `<button class="icon-action" onclick="swapPlan('${item.date}')">替换</button>` : ''}
        ${canRecord ? `<button class="icon-action ${feedback && feedback.source !== 'community' ? 'done' : ''}" onclick="openFeedback('${item.date}')">${feedback && feedback.source !== 'community' ? '修改视频记录' : '视频打卡'}</button>` : ''}
        ${canRecordCommunity ? `<button class="icon-action community-action ${communityRecord ? 'done' : ''}" onclick="openCommunityClass('${item.date}')">${communityRecord ? '修改现场课' : 'Community Centre 课'}</button>` : ''}
      </div>
    </article>`;
  }).join('');
}

function ensureLibraryPreferences() {
  const defaults = { channel:'all', focus:'all', position:'all', preference:'all', sort:'default' };
  state.libraryPreferences = { ...defaults, ...(state.libraryPreferences || {}) };
}

function approvedLibraryChannels() {
  return [...new Set(state.videos
    .filter(video => video.approved && !video.rejected)
    .map(video => String(video.channel || '').trim())
    .filter(Boolean))]
    .sort((a,b) => a.localeCompare(b, 'en', { sensitivity:'base' }));
}

function renderLibraryControls() {
  ensureLibraryPreferences();
  const preferences = state.libraryPreferences;
  const channelSelect = document.getElementById('libraryChannelFilter');
  const channels = approvedLibraryChannels();
  if (preferences.channel !== 'all' && !channels.includes(preferences.channel)) preferences.channel = 'all';
  channelSelect.innerHTML = `<option value="all">全部频道</option>${channels.map(channel => `<option value="${escapeHtml(channel)}">${escapeHtml(channel)}</option>`).join('')}`;
  channelSelect.value = preferences.channel;
  document.getElementById('libraryFocusFilter').value = preferences.focus;
  document.getElementById('libraryPositionFilter').value = preferences.position;
  document.getElementById('libraryPreferenceFilter').value = preferences.preference;
  document.getElementById('librarySort').value = preferences.sort;
}

function videoUsageStats() {
  const stats = new Map(state.videos.map(video => [video.id, { count:0, lastUsed:'' }]));
  const countedStatuses = new Set(['completed','partial','swapped']);
  for (const record of state.feedback || []) {
    if (!countedStatuses.has(record.status)) continue;
    let videoId = record.videoId || '';
    if (!videoId) videoId = findPlanItemByDate(record.date)?.videoId || '';
    if (!videoId) continue;
    if (!stats.has(videoId)) stats.set(videoId, { count:0, lastUsed:'' });
    const item = stats.get(videoId);
    item.count += 1;
    if (!item.lastUsed || String(record.date) > item.lastUsed) item.lastUsed = String(record.date);
  }
  return stats;
}

function compareText(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'en', { sensitivity:'base', numeric:true });
}

function sortLibraryVideos(videos, stats) {
  const sort = state.libraryPreferences.sort || 'default';
  const originalOrder = new Map(state.videos.map((video,index) => [video.id,index]));
  const fallback = (a,b) => (originalOrder.get(a.id) ?? 0) - (originalOrder.get(b.id) ?? 0);
  return [...videos].sort((a,b) => {
    const aStats = stats.get(a.id) || { count:0, lastUsed:'' };
    const bStats = stats.get(b.id) || { count:0, lastUsed:'' };
    let result = 0;
    if (sort === 'channel-asc') result = compareText(a.channel,b.channel) || compareText(a.title,b.title);
    else if (sort === 'channel-desc') result = compareText(b.channel,a.channel) || compareText(a.title,b.title);
    else if (sort === 'usage-desc') result = bStats.count - aStats.count || compareText(a.channel,b.channel) || compareText(a.title,b.title);
    else if (sort === 'usage-asc') result = aStats.count - bStats.count || compareText(a.channel,b.channel) || compareText(a.title,b.title);
    else if (sort === 'recent-desc') result = compareText(bStats.lastUsed,aStats.lastUsed) || bStats.count - aStats.count;
    else if (sort === 'recent-asc') {
      if (!aStats.lastUsed && bStats.lastUsed) result = 1;
      else if (aStats.lastUsed && !bStats.lastUsed) result = -1;
      else result = compareText(aStats.lastUsed,bStats.lastUsed) || bStats.count - aStats.count;
    }
    else if (sort === 'title-asc') result = compareText(a.title,b.title);
    else if (sort === 'title-desc') result = compareText(b.title,a.title);
    else if (sort === 'duration-asc') result = Number(a.duration||0)-Number(b.duration||0) || compareText(a.title,b.title);
    else if (sort === 'duration-desc') result = Number(b.duration||0)-Number(a.duration||0) || compareText(a.title,b.title);
    else if (sort === 'preference') {
      const rank = value => value === 'favorite' ? 0 : value === 'neutral' ? 1 : 2;
      result = rank(videoPreference(a)) - rank(videoPreference(b)) || compareText(a.channel,b.channel) || compareText(a.title,b.title);
    }
    return result || fallback(a,b);
  });
}

function filteredVideos() {
  ensureLibraryPreferences();
  const q = document.getElementById('librarySearch')?.value.toLowerCase().trim() || '';
  const { channel, focus, position, preference } = state.libraryPreferences;
  const stats = videoUsageStats();
  const videos = state.videos.filter(v => v.approved && !v.rejected)
    .filter(v => !q || `${v.title} ${v.channel}`.toLowerCase().includes(q))
    .filter(v => channel === 'all' || v.channel === channel)
    .filter(v => focus === 'all' || v.focus === focus)
    .filter(v => position === 'all' || v.position === position)
    .filter(v => preference === 'all' || videoPreference(v) === preference);
  return { videos: sortLibraryVideos(videos, stats), stats };
}

function renderLibrary() {
  renderLibraryControls();
  renderLibraryAuditStatus();
  const { videos, stats } = filteredVideos();
  const approvedTotal = state.videos.filter(v => v.approved && !v.rejected).length;
  const starterTotal = state.videos.filter(v => v.starter).length;
  const selectedChannel = state.libraryPreferences.channel === 'all' ? '全部频道' : state.libraryPreferences.channel;
  document.getElementById('libraryCountSummary').textContent = `当前显示 ${videos.length} 条 · ${selectedChannel} · 已批准 ${approvedTotal} 条 · 其中内置备用 ${starterTotal} 条`;
  document.getElementById('libraryGrid').innerHTML = videos.length ? videos.map(v => {
    const usage = stats.get(v.id) || { count:0, lastUsed:'' };
    const recent = usage.lastUsed ? ` · 最近 ${formatDate(usage.lastUsed)}` : '';
    const preference = videoPreference(v);
    return `
    <article class="video-card ${preference === 'favorite' ? 'video-favorite' : preference === 'dislike' ? 'video-disliked' : ''}">
      <div class="video-thumb">${v.thumbnail?`<img src="${escapeHtml(v.thumbnail)}" alt="">`:`${escapeHtml(v.channel)}<br><small>已批准</small>`}</div>
      <div class="video-body">
        <h4>${escapeHtml(v.title)}</h4><p>${escapeHtml(v.channel)} · ${v.duration} 分钟</p>
        <p class="video-usage-meta">已使用 ${usage.count} 次${recent}</p>
        <div class="mini-tags"><span class="mini-tag">${focusLabels[v.focus]||v.focus}</span><span class="mini-tag">${positionLabels[v.position]}</span><span class="mini-tag">${riskLabels[v.risk]}</span>${preference==='favorite'?'<span class="mini-tag preference-favorite-tag">♥ 喜欢</span>':''}${preference==='dislike'?'<span class="mini-tag preference-dislike-tag">不喜欢 · 不排课</span>':''}${v.kneeFriendly?'<span class="mini-tag knee-friendly-tag">膝盖友好</span>':''}${v.reserveOnly?'<span class="mini-tag reserve-tag">高强度备用</span>':''}${v.abTraining?'<span class="mini-tag warning-tag">含腹肌训练</span>':''}${v.pelvicInversion?'<span class="mini-tag warning-tag">含臀桥/骨盆抬高</span>':''}${isStrictMenstrualVideo(v)?'<span class="mini-tag period-safe-tag">生理期可用</span>':'<span class="mini-tag muted-tag">生理期未确认</span>'}${verificationBadge(v)}${v.autoPlanEligible===false&&!v.needsReview?'<span class="mini-tag info-only-tag">仅资料库</span>':''}</div>
        ${v.verificationNote ? `<p class="verification-note">${escapeHtml(v.verificationNote)}</p>` : ''}
        ${v.originalChannel && v.originalChannel !== v.channel ? `<p class="original-channel">原标注频道：${escapeHtml(v.originalChannel)}</p>` : ''}
        <div class="video-footer video-footer-wrap">
          ${videoLinkMarkup(v, '在 YouTube 打开', 'text-link')}
          <div class="video-preference-actions"><button class="preference-btn favorite-btn ${preference==='favorite'?'active':''}" onclick="setVideoPreference('${v.id}','favorite')" aria-pressed="${preference==='favorite'}">♥ 喜欢</button><button class="preference-btn dislike-btn ${preference==='dislike'?'active':''}" onclick="setVideoPreference('${v.id}','dislike')" aria-pressed="${preference==='dislike'}">不喜欢</button></div><div class="button-row compact"><button class="icon-action library-checkin-btn" onclick="openLibraryFeedback('${v.id}')">打卡记录</button>${v.needsReview?`<button class="icon-action confirm-video-btn" onclick="confirmCorrectedVideo('${v.id}')">确认用于排课</button>`:''}<button class="icon-action" data-verify-video="${escapeHtml(v.id)}" onclick="verifyVideoMetadata('${v.id}')">打开核对</button><button class="icon-action" onclick="openEditVideo('${v.id}')">搜索 / 修改</button><button class="icon-action" onclick="removeVideo('${v.id}')">移除</button></div>
        </div>
      </div>
    </article>`;
  }).join('') : `<div class="empty-state">没有符合筛选条件的视频。</div>`;
}

function renderReview() {
  const pending = state.pending.filter(v => !v.approved && !v.rejected);
  document.getElementById('reviewList').innerHTML = pending.length ? pending.map(v => `
    <article class="review-card">
      ${v.thumbnail?`<img src="${escapeHtml(v.thumbnail)}" alt="">`:`<div class="review-placeholder">NEW</div>`}
      <div><h4>${escapeHtml(v.title)}</h4><p>${escapeHtml(v.channel)} · ${v.duration||'?'} 分钟 · ${formatPublished(v.publishedAt)}</p><div class="mini-tags">${v.sourceUsage==='reserve'?'<span class="mini-tag reserve-tag">高强度备用频道</span>':''}${keywordTags(v).map(t=>`<span class="mini-tag">${escapeHtml(t)}</span>`).join('')}</div></div>
      <div class="button-row">${videoLinkMarkup(v, '查看')}<button class="primary-btn" onclick="openReview('${v.id}')">审核</button></div>
    </article>`).join('') : `<div class="empty-state"><strong>没有待审核视频</strong><br>可直接手动添加已确认的单个 YouTube 视频；无需配置 API。</div>`;
}
function formatPublished(value) { try { return new Intl.DateTimeFormat('zh-CN',{timeZone:TZ,month:'short',day:'numeric'}).format(new Date(value)); } catch { return '日期未知'; } }
function keywordTags(video) {
  const text = `${video.title} ${video.description}`.toLowerCase(); const tags=[];
  if (/postpartum|postnatal|diastasis/.test(text)) tags.push('产后候选');
  if (/gentle|stretch|mobility|recovery/.test(text)) tags.push('恢复候选');
  if (/pilates/.test(text)) tags.push('Pilates');
  if (/abs|core|crunch/.test(text)) tags.push('需核对腹压');
  if (/standing|walk|cardio|hiit/.test(text)) tags.push('需核对站立负荷');
  return tags.length ? tags : ['未自动分类'];
}

function renderInsights() {
  const records = [...state.feedback].sort((a,b)=>b.date.localeCompare(a.date) || String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
  const completed = records.filter(f=>f.status==='completed').length;
  const totalMinutes = records.reduce((s,f)=>s+Number(f.minutes||0),0);
  const avgEffort = records.length ? (records.reduce((s,f)=>s+Number(f.effort||0),0)/records.length).toFixed(1) : '—';
  const painRecords = records.filter(f=>f.pains?.length && !f.pains.includes('none')).length;
  document.getElementById('insightCards').innerHTML = summaryCard('完整完成',String(completed)) + summaryCard('累计分钟',String(totalMinutes)) + summaryCard('平均体感',String(avgEffort)) + summaryCard('不适记录',String(painRecords));
  document.getElementById('historyList').innerHTML = records.length ? records.map(f=>{
    const plan = findPlanItemByDate(f.date); const video=getVideo(f.videoId||plan?.videoId)||getPlanVideo(plan);
    const isCommunity = f.source === 'community';
    const title=isCommunity ? (f.activityTitle || communityClassTitle(f.activityType)) : (video?.title||f.videoTitle||plan?.category||'自主训练');
    const channel=isCommunity ? 'Community Centre' : (video?.channel||f.videoChannel||'');
    const sourceLabel = isCommunity
      ? (f.overridesPlan !== false ? ' · 覆盖当天视频' : ' · 额外现场课')
      : f.source === 'library' ? ' · 视频库打卡' : '';
    return `<div class="history-row ${isCommunity ? 'community-history-row' : ''}"><span>${formatDate(f.date)}</span><strong>${escapeHtml(title)}${channel?`<small>${escapeHtml(channel)}${sourceLabel}</small>`:''}</strong><span>${statusLabels[f.status]} · ${f.minutes} 分钟</span></div>`;
  }).join('') : `<div class="empty-state">还没有训练记录。</div>`;
}

function renderSettings() {
  document.getElementById('youtubeWorkerUrl').value = state.settings.workerUrl || '';
  document.getElementById('autoYouTubeSync').checked = state.settings.autoYouTubeSync !== false;
  document.getElementById('youtubeSyncHours').value = state.settings.youtubeSyncHours || 6;
  document.getElementById('preferMat').checked = !!state.settings.preferMat;
  document.getElementById('avoidCrunch').checked = !!state.settings.avoidCrunch;
  document.getElementById('autoDowngrade').checked = !!state.settings.autoDowngrade;
  document.getElementById('miziGap').value = state.settings.miziGap || 14;
  const channels = state.settings.channels || [];
  document.getElementById('channelQuickLinks').innerHTML = channels.map((c,i)=>`
    <div class="channel-quick-card">
      <div><strong>${escapeHtml(c.name || '未命名频道')}</strong><span>${channelUsageLabels[c.usage] || '候选频道'}</span></div>
      <button class="secondary-btn" type="button" onclick="openChannelSearch(${i})">打开 YouTube</button>
    </div>`).join('');
  document.getElementById('channelSettings').innerHTML = channels.map((c,i)=>`<div class="channel-row"><input data-channel-name="${i}" value="${escapeHtml(c.name)}" placeholder="频道名称"><input data-channel-id="${i}" value="${escapeHtml(c.id)}" placeholder="频道地址 / @handle / UC... ID"><select data-channel-usage="${i}" aria-label="频道用途"><option value="primary" ${c.usage==='primary'?'selected':''}>主要候选</option><option value="secondary" ${c.usage==='secondary'?'selected':''}>次要候选</option><option value="occasional" ${c.usage==='occasional'?'selected':''}>低频使用</option><option value="reserve" ${c.usage==='reserve'?'selected':''}>高强度备用</option></select><button onclick="removeChannel(${i})" aria-label="删除">×</button></div>`).join('');
  const syncStatus = document.getElementById('youtubeSyncStatus');
  if (syncStatus) {
    if (!state.settings.workerUrl) syncStatus.textContent = '尚未连接 Vercel 后端。完成一次设置后即可自动检查。';
    else if (state.settings.lastSync) syncStatus.textContent = `上次检查：${new Date(state.settings.lastSync).toLocaleString('zh-CN', { timeZone: TZ })}`;
    else syncStatus.textContent = '后端已填写；尚未成功检查。';
  }
}
function setWeekView(weekStart) {
  selectedWeekStart = startOfPlanWeek(weekStart);
  if (weekRelation(selectedWeekStart) !== 'past' && !planForWeek(selectedWeekStart).length) generatePlanSilently(selectedWeekStart);
  renderHeader();
  renderWeek();
}
function changeWeekView(days) { setWeekView(addDays(selectedWeekStart, days)); }

function switchView(view) {
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${view}`));
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  const titles={home:'今天做什么',week:'本周运动安排',library:'训练视频库',review:'待审核新视频',insights:'训练记录',settings:'设置'};
  document.getElementById('viewTitle').textContent=view==='week' ? weekViewLabel(selectedWeekStart) : titles[view];
  window.scrollTo({top:0,behavior:'smooth'});
}

window.openChannelSearch = function(index) {
  const channel = state.settings.channels?.[index];
  const name = String(channel?.name || '').trim();
  if (!name) { showToast('频道名称为空'); return; }
  window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} latest workout`)}`, '_blank', 'noopener');
};

function applyWeeklyChannelExclusions() {
  if (weekRelation(selectedWeekStart) === 'past') { showToast('历史周频道设置已锁定'); return; }
  const selected = [...document.querySelectorAll('input[name="weeklyExcludedChannel"]:checked')].map(input => input.value);
  weekPreferencesFor(selectedWeekStart).excludedChannels = selected;
  saveState();
  generatePlan(selectedWeekStart);
}

function clearWeeklyChannelExclusions() {
  if (weekRelation(selectedWeekStart) === 'past') { showToast('历史周频道设置已锁定'); return; }
  weekPreferencesFor(selectedWeekStart).excludedChannels = [];
  saveState();
  generatePlan(selectedWeekStart);
}

window.swapPlan = function(date) {
  const weekStart = weekStartForDate(date);
  if (weekRelation(weekStart) === 'past') { showToast('历史周计划已锁定'); return; }
  const weekPlan = planForWeek(weekStart);
  const item = weekPlan.find(p=>p.date===date); if(!item) return;
  const current = getVideo(item.videoId);
  const period = menstrualContextForDate(date);
  const planContext = { date, period, weekStart, rotationStats:videoRotationStats(weekStart) };
  const usedOnOtherDays = new Set(weekPlan.filter(planItem => planItem.date !== date && planItem.videoId).map(planItem => planItem.videoId));
  const usedInPairedWeek = crossWeekBlockedVideoIds(weekStart);
  const approved = approvedPlanVideos(weekStart)
    .filter(video => video.id !== item.videoId && !usedOnOtherDays.has(video.id) && !usedInPairedWeek.has(video.id))
    .filter(video => isVideoEligibleForAssessment(video, state.assessment, planContext));
  const currentEffort = current ? personalVideoEffort(current) : 3;
  const template = menstrualTemplateForDay({type:current?.focus||'mobility',label:'替换训练',target:Math.min(15, state.assessment.timeAvailable || 15)}, period);
  const effectiveMode = period.active ? 'recovery' : 'recovery';
  let candidates = approved
    .filter(v => personalVideoEffort(v) < currentEffort - .2 || (v.risk === 'low' && current?.risk !== 'low'))
    .sort((a,b) => {
      const effortDiff = personalVideoEffort(a) - personalVideoEffort(b);
      if (Math.abs(effortDiff) > .15) return effortDiff;
      return videoScore(b,template,effectiveMode,new Set(),state.assessment,planContext)-videoScore(a,template,effectiveMode,new Set(),state.assessment,planContext);
    });
  if (!candidates.length) candidates = approved
    .filter(v=>v.risk==='low' && v.position!=='standing')
    .sort((a,b)=>videoScore(b,template,effectiveMode,new Set(),state.assessment,planContext)-videoScore(a,template,effectiveMode,new Set(),state.assessment,planContext));
  const chosen=candidates[0];
  if(!chosen){showToast(period.active ? '没有其他适合当前生理期日期的更轻视频' : '没有符合时长和安全限制的更轻视频');return;}
  item.videoId=chosen.id;
  item.videoSnapshot={id:chosen.id,title:chosen.title,channel:chosen.channel,duration:chosen.duration,focus:chosen.focus,position:chosen.position,risk:chosen.risk,abTraining:!!chosen.abTraining,pelvicInversion:!!chosen.pelvicInversion,menstrualEligible:!!chosen.menstrualEligible,reserveOnly:!!chosen.reserveOnly,url:chosen.url,thumbnail:chosen.thumbnail};
  item.periodDay=period.active ? period.day : 0;
  item.category=period.active ? template.label : item.category;
  item.rationale=`今日手动选择“换轻一点”：个人体感预计 ${personalVideoEffort(chosen).toFixed(1)}/5；仍遵守时长、安全与跨周不重复限制。`;
  setPlanForWeek(weekStart, weekPlan);
  saveState();renderAll();showToast('已换成更轻一点的训练');
};

window.challengePlan = function(date) {
  const weekStart = weekStartForDate(date);
  if (weekRelation(weekStart) === 'past') { showToast('历史周计划已锁定'); return; }
  const period = menstrualContextForDate(date);
  if (period.active) { showToast('生理期日期不提供“挑战一点”，继续按生理期安全规则排课'); return; }
  const weekPlan = planForWeek(weekStart);
  const item = weekPlan.find(p=>p.date===date); if(!item) return;
  const current = getVideo(item.videoId);
  const currentEffort = current ? personalVideoEffort(current) : targetEffortForAssessment(state.assessment);
  const usedOnOtherDays = new Set(weekPlan.filter(planItem => planItem.date !== date && planItem.videoId).map(planItem => planItem.videoId));
  const usedInPairedWeek = crossWeekBlockedVideoIds(weekStart);
  // 临时挑战只提升今天，不修改整周 assessment；疼痛、核心、时长等硬限制照常保留。
  const challengeAssessment = { ...state.assessment, mode:'progress' };
  const planContext = { date, period:{active:false}, weekStart, rotationStats:videoRotationStats(weekStart) };
  const template = {type:current?.focus||'pilates',label:'挑战训练',target:Math.min(Number(state.assessment.timeAvailable || 15), current?.duration || 15)};
  const approved = approvedPlanVideos(weekStart)
    .filter(video => video.id !== item.videoId && !usedOnOtherDays.has(video.id) && !usedInPairedWeek.has(video.id))
    .filter(video => isVideoEligibleForAssessment(video, challengeAssessment, planContext));
  const target = Math.min(5, Math.max(3.5, currentEffort + .8));
  const candidates = approved
    .filter(v => personalVideoEffort(v) >= currentEffort + .3)
    .sort((a,b) => {
      const aGap = Math.abs(personalVideoEffort(a) - target);
      const bGap = Math.abs(personalVideoEffort(b) - target);
      if (Math.abs(aGap-bGap) > .1) return aGap-bGap;
      return videoScore(b,template,'progress',new Set(),challengeAssessment,planContext)-videoScore(a,template,'progress',new Set(),challengeAssessment,planContext);
    });
  const chosen = candidates[0];
  if (!chosen) { showToast('没有符合当前时长与安全限制、且比现有计划稍强的视频'); return; }
  item.videoId=chosen.id;
  item.videoSnapshot={id:chosen.id,title:chosen.title,channel:chosen.channel,duration:chosen.duration,focus:chosen.focus,position:chosen.position,risk:chosen.risk,abTraining:!!chosen.abTraining,pelvicInversion:!!chosen.pelvicInversion,menstrualEligible:!!chosen.menstrualEligible,reserveOnly:!!chosen.reserveOnly,url:chosen.url,thumbnail:chosen.thumbnail};
  item.rationale=`今日手动选择“挑战一点”：从约 ${currentEffort.toFixed(1)}/5 提升到约 ${personalVideoEffort(chosen).toFixed(1)}/5；仍遵守疼痛、核心安全、时长与跨周不重复限制。`;
  setPlanForWeek(weekStart, weekPlan);
  saveState();renderAll();showToast('已换成稍有挑战的训练');
};

function hydrateFeedbackFields({ source, date, video, existing, title, context }) {
  document.getElementById('feedbackSource').value = source;
  document.getElementById('feedbackRecordId').value = existing?.recordId || '';
  document.getElementById('feedbackVideoId').value = video?.id || existing?.videoId || '';
  const dateInput = document.getElementById('feedbackDate');
  dateInput.value = date || torontoDate();
  dateInput.disabled = source === 'plan';
  document.getElementById('feedbackTitle').textContent = title || video?.title || '记录训练';
  document.getElementById('feedbackContext').textContent = context || (video?.channel ? `${video.channel} · ${video.duration || '?'} 分钟` : '');
  document.getElementById('completionStatus').value = existing?.status || 'completed';
  document.getElementById('actualMinutes').value = existing?.minutes ?? video?.duration ?? 15;
  document.getElementById('effortRange').value = existing?.effort || 3;
  document.getElementById('effortValue').textContent = existing?.effort || 3;
  document.querySelectorAll('input[name="feedbackPain"]').forEach(cb => cb.checked = existing?.pains?.includes(cb.value) || false);
  document.getElementById('feedbackNote').value = existing?.note || '';
}

window.openFeedback = function(date) {
  const plan = findPlanItemByDate(date);
  const video = getPlanVideo(plan);
  const existing = (state.feedback || []).find(record => record.date === date && (record.source || 'plan') === 'plan') || null;
  hydrateFeedbackFields({
    source: 'plan', date, video, existing,
    title: video?.title || plan?.category || '记录训练',
    context: `${formatDate(date)} · 周计划${video?.channel ? ` · ${video.channel}` : ''}`
  });
  document.getElementById('feedbackDialog').showModal();
};

window.openLibraryFeedback = function(videoId) {
  const video = getVideo(videoId);
  if (!video) { showToast('找不到这条视频记录'); return; }
  hydrateFeedbackFields({
    source: 'library', date: torontoDate(), video, existing: null,
    title: `打卡：${video.title}`,
    context: `${video.channel} · ${video.duration} 分钟 · 从视频库直接记录`
  });
  document.getElementById('feedbackDialog').showModal();
};

window.openCommunityClass = function(date = torontoDate()) {
  const existing = communityRecordForDate(date);
  document.getElementById('communityRecordId').value = existing?.recordId || '';
  document.getElementById('communityDate').value = date || torontoDate();
  const activityType = existing?.activityType || 'pilates';
  document.getElementById('communityClassType').value = activityType;
  document.querySelectorAll('input[name="communityClassChoice"]').forEach(input => input.checked = input.value === activityType);
  document.getElementById('communityMinutes').value = existing?.minutes ?? 60;
  document.getElementById('communityEffort').value = existing?.effort || 3;
  document.getElementById('communityEffortValue').textContent = existing?.effort || 3;
  document.getElementById('communityOverridePlan').checked = existing ? existing.overridesPlan !== false : true;
  document.querySelectorAll('input[name="communityPain"]').forEach(cb => cb.checked = existing?.pains?.includes(cb.value) || false);
  document.getElementById('communityNote').value = existing?.note || '';
  document.getElementById('communityDialogTitle').textContent = existing ? '修改 Community Centre 课程' : 'Community Centre 课程打卡';
  document.getElementById('communityDialog').showModal();
};
window.openReview = function(id) {
  const v=state.pending.find(x=>x.id===id); if(!v)return;
  document.getElementById('reviewVideoId').value=id; document.getElementById('reviewDialogTitle').textContent=v.title;
  const text=`${v.title} ${v.description}`.toLowerCase();
  document.getElementById('reviewFocus').value=/postpartum|postnatal|diastasis/.test(text)?'postpartum':/stretch|mobility|recovery/.test(text)?'mobility':/glute|booty/.test(text)?'glutes':/meditation|breath/.test(text)?'meditation':/cardio|hiit|walk/.test(text)?'cardio':'pilates';
  document.getElementById('reviewPosition').value=/standing|walk|cardio/.test(text)?'standing':'mat';
  document.getElementById('reviewRisk').value=/abs|crunch|hiit/.test(text)?'medium':'low';
  document.getElementById('reviewLevel').value=(v.sourceUsage==='reserve'||/heather robertson|mizi/i.test(v.channel))?'progress':'stable';
  document.getElementById('reviewCrunch').checked=/crunch|abs/.test(text);
  document.getElementById('reviewDR').checked=/postpartum|postnatal|diastasis/.test(text);
  document.getElementById('reviewAbTraining').checked=/abs|abdominal|core|diastasis|pilates|glute|booty/.test(text);
  document.getElementById('reviewPelvicInversion').checked=/bridge|hip thrust|hip lift|glute|booty|pilates|postpartum/.test(text);
  document.getElementById('reviewMenstrualEligible').checked=false;
  document.getElementById('reviewNote').value=''; document.getElementById('reviewDialog').showModal();
};
function setEditSearchStatus(message, isError = false) {
  const helper = document.getElementById('editSearchHelper');
  helper.textContent = message;
  helper.classList.toggle('error-text', isError);
}

window.openEditVideo = function(id) {
  const video = getVideo(id); if (!video) return;
  editSearchResults = new Map();
  document.getElementById('editOriginalVideoId').value = video.id;
  document.getElementById('editVideoPublishedAt').value = video.publishedAt || '';
  document.getElementById('editVideoThumbnail').value = video.thumbnail || '';
  document.getElementById('editVideoDialogTitle').textContent = `修改：${video.title}`;
  document.getElementById('editVideoSearchQuery').value = `${video.channel} ${video.title}`;
  document.getElementById('editVideoUrl').value = normalizeYouTubeVideoUrl(video.url || '') || '';
  document.getElementById('editVideoTitle').value = video.title || '';
  document.getElementById('editVideoChannel').value = video.channel || '';
  document.getElementById('editVideoDuration').value = video.duration || 15;
  document.getElementById('editVideoFocus').value = video.focus || 'pilates';
  document.getElementById('editVideoPosition').value = video.position || 'mat';
  document.getElementById('editVideoRisk').value = video.risk || 'low';
  document.getElementById('editVideoLevel').value = video.level || 'stable';
  document.getElementById('editVideoCrunch').checked = !!video.crunchHeavy;
  document.getElementById('editVideoDR').checked = !!video.drFriendly;
  document.getElementById('editVideoAbTraining').checked = !!video.abTraining;
  document.getElementById('editVideoPelvicInversion').checked = !!video.pelvicInversion;
  document.getElementById('editVideoMenstrualEligible').checked = !!video.menstrualEligible && !video.abTraining && !video.pelvicInversion;
  document.getElementById('editVideoReserve').checked = !!video.reserveOnly || /heather robertson/i.test(video.channel || '');
  document.getElementById('editVideoNote').value = video.note || '';
  document.getElementById('editVideoSearchResults').innerHTML = '';
  const inAppSearchButton = document.getElementById('searchVideoInAppBtn');
  const hasWorker = !!normalizedWorkerUrl(state.settings.workerUrl);
  inAppSearchButton.classList.toggle('hidden', !hasWorker);
  setEditSearchStatus(hasWorker ? '可通过安全 Worker 在 App 内搜索，或打开 YouTube 搜索后粘贴单个视频链接。' : '连接 Vercel 后端 后可在 App 内搜索；也可以打开 YouTube 搜索后粘贴单个视频链接。');
  document.getElementById('editVideoDialog').showModal();
};

function openExternalVideoSearch() {
  const query = document.getElementById('editVideoSearchQuery').value.trim();
  if (!query) { showToast('请先输入搜索关键词'); return; }
  window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank', 'noopener');
}

async function searchYouTubeForEdit() {
  const query = document.getElementById('editVideoSearchQuery').value.trim();
  const workerUrl = normalizedWorkerUrl(state.settings.workerUrl);
  if (!query) { showToast('请先输入搜索关键词'); return; }
  if (!workerUrl) {
    setEditSearchStatus('尚未连接 Vercel 后端。可点击“打开 YouTube 搜索”，然后粘贴正确视频链接。', true);
    return;
  }
  const button = document.getElementById('searchVideoInAppBtn');
  const oldText = button.textContent;
  button.disabled = true; button.textContent = '搜索中…';
  document.getElementById('editVideoSearchResults').innerHTML = '';
  setEditSearchStatus('正在通过安全 Worker 读取 YouTube 搜索结果…');
  try {
    const searchRes = await fetch(`${workerUrl}/search`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({q:query,maxResults:8})
    });
    const searchData = await searchRes.json().catch(()=>({}));
    if (!searchRes.ok) throw new Error(searchData.error || '搜索请求失败');
    const results = (searchData.videos || []).map(item => ({
      id:item.id,title:item.title||'未命名视频',channel:item.channelTitle||'未知频道',
      duration:Number(item.durationMinutes||1),publishedAt:item.publishedAt||'',thumbnail:item.thumbnail||youtubeThumbnail(item.id),url:youtubeWatchUrl(item.id)
    }));
    editSearchResults = new Map(results.map(item => [item.id,item]));
    if (!results.length) { setEditSearchStatus('没有找到视频。可修改关键词后重试。'); return; }
    document.getElementById('editVideoSearchResults').innerHTML = results.map(result => `
      <article class="search-result-card">
        <img src="${escapeHtml(result.thumbnail)}" alt="">
        <div><strong>${escapeHtml(result.title)}</strong><p>${escapeHtml(result.channel)} · ${result.duration} 分钟</p></div>
        <button type="button" class="secondary-btn" onclick="selectEditSearchResult('${result.id}')">选用</button>
      </article>`).join('');
    setEditSearchStatus(`找到 ${results.length} 个结果。请核对频道和缩略图后再选用。`);
  } catch (error) {
    console.error(error);
    setEditSearchStatus(`搜索失败：${error.message}`, true);
  } finally {
    button.disabled = false; button.textContent = oldText;
  }
}

window.selectEditSearchResult = function(id) {
  const result = editSearchResults.get(id); if (!result) return;
  document.getElementById('editVideoUrl').value = result.url;
  document.getElementById('editVideoTitle').value = result.title;
  document.getElementById('editVideoChannel').value = result.channel;
  document.getElementById('editVideoDuration').value = result.duration;
  document.getElementById('editVideoPublishedAt').value = result.publishedAt;
  document.getElementById('editVideoThumbnail').value = result.thumbnail;
  if (/heather robertson/i.test(result.channel)) {
    document.getElementById('editVideoReserve').checked = true;
    document.getElementById('editVideoLevel').value = 'progress';
  }
  setEditSearchStatus('已选用该搜索结果。可继续修改训练标签，然后保存。');
  showToast('已填入选中的视频');
};

function saveEditedVideo() {
  const originalId = document.getElementById('editOriginalVideoId').value;
  const index = state.videos.findIndex(video => video.id === originalId);
  if (index < 0) { showToast('原视频记录不存在'); return; }
  const url = normalizeYouTubeVideoUrl(document.getElementById('editVideoUrl').value.trim());
  if (!url) { showToast('请填写单个 YouTube 视频直达链接'); return; }
  const id = extractYouTubeVideoId(url);
  const duplicate = state.videos.find(video => video.id === id && video.id !== originalId);
  if (duplicate) { showToast(`这个视频已存在：${duplicate.title}`); return; }
  const title = document.getElementById('editVideoTitle').value.trim();
  const channel = document.getElementById('editVideoChannel').value.trim();
  if (!title || !channel) { showToast('请填写标题和频道'); return; }
  const previous = state.videos[index];
  const reserveOnly = document.getElementById('editVideoReserve').checked || /heather robertson/i.test(channel);
  state.videos[index] = {
    ...previous,
    id, url, title, channel,
    duration:Number(document.getElementById('editVideoDuration').value || 15),
    focus:document.getElementById('editVideoFocus').value,
    position:document.getElementById('editVideoPosition').value,
    risk:document.getElementById('editVideoRisk').value,
    level:reserveOnly ? 'progress' : document.getElementById('editVideoLevel').value,
    crunchHeavy:document.getElementById('editVideoCrunch').checked,
    drFriendly:document.getElementById('editVideoDR').checked,
    abTraining:document.getElementById('editVideoAbTraining').checked,
    pelvicInversion:document.getElementById('editVideoPelvicInversion').checked,
    menstrualEligible:document.getElementById('editVideoMenstrualEligible').checked && !document.getElementById('editVideoAbTraining').checked && !document.getElementById('editVideoPelvicInversion').checked,
    reserveOnly,
    note:document.getElementById('editVideoNote').value.trim(),
    thumbnail:document.getElementById('editVideoThumbnail').value || youtubeThumbnail(id),
    publishedAt:document.getElementById('editVideoPublishedAt').value || previous.publishedAt || new Date().toISOString(),
    approved:true,rejected:false,demo:false,
    verificationStatus:'manual',verifiedAt:null,verifiedChannel:'',verificationNote:'',originalChannel:'',originalTitle:'',needsReview:false,autoPlanEligible:true
  };
  const updatedVideo = state.videos[index];
  allPlanItems().forEach(item => {
    if (item.videoId !== originalId) return;
    item.videoId = id;
    if (weekRelation(weekStartForDate(item.date)) !== 'past') item.videoSnapshot = {id:updatedVideo.id,title:updatedVideo.title,channel:updatedVideo.channel,duration:updatedVideo.duration,focus:updatedVideo.focus,position:updatedVideo.position,risk:updatedVideo.risk,abTraining:!!updatedVideo.abTraining,pelvicInversion:!!updatedVideo.pelvicInversion,menstrualEligible:!!updatedVideo.menstrualEligible,reserveOnly:!!updatedVideo.reserveOnly,url:updatedVideo.url,thumbnail:updatedVideo.thumbnail};
  });
  state.feedback.forEach(record => {
    if (record.videoId === originalId) {
      record.videoId = id;
      record.videoTitle = title;
      record.videoChannel = channel;
    }
  });
  saveState();
  document.getElementById('editVideoDialog').close();
  regenerateCurrentAndNext();
  showToast('视频链接、动作标签和本周计划已更新');
}

window.removeVideo = function(id) {
  const v=getVideo(id); if(!v)return;
  if(!confirm(`从视频库移除“${v.title}”？`))return;
  state.videos=state.videos.filter(x=>x.id!==id); regenerateCurrentAndNext();showToast('已移除视频；历史周仍保留当时的计划快照');
};
window.removeChannel = function(index){ state.settings.channels.splice(index,1); saveState();renderSettings(); };

let youtubeSyncInFlight = false;

function normalizedWorkerUrl(value = '') {
  return String(value || '').trim().replace(/\/+$/, '');
}

function youtubeSyncDue() {
  if (state.settings.autoYouTubeSync === false) return false;
  if (!normalizedWorkerUrl(state.settings.workerUrl)) return false;
  if (!(state.settings.channels || []).some(c => String(c.id || '').trim())) return false;
  const hours = Math.max(1, Number(state.settings.youtubeSyncHours || 6));
  const last = Date.parse(state.settings.lastSync || '');
  return !Number.isFinite(last) || (Date.now() - last) >= hours * 60 * 60 * 1000;
}

async function syncYouTube({ silent = false } = {}) {
  if (youtubeSyncInFlight) return;
  saveSettingsFromForm();
  const workerUrl = normalizedWorkerUrl(state.settings.workerUrl);
  const channels = (state.settings.channels || []).filter(c => String(c.id || '').trim());
  if(!workerUrl){ if(!silent){showToast('请先填写 YouTube 后端地址（Vercel）');switchView('settings');} return; }
  if(!channels.length){ if(!silent){showToast('请至少为一个频道填写频道地址、@handle 或频道 ID');switchView('settings');} return; }
  const button=document.getElementById('advancedSyncBtn');
  const old=button?.textContent || '';
  youtubeSyncInFlight = true;
  if (button) { button.disabled=true; button.textContent='正在检查…'; }
  try {
    const response = await fetch(`${workerUrl}/sync`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ channels: channels.map(c => ({ name:c.name, identifier:c.id, usage:c.usage })), maxResults:10 })
    });
    const data = await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.error || data.message || `Worker 返回 ${response.status}`);
    let added=0;
    for(const video of data.videos || []){
      const videoId=video.id; if(!videoId) continue;
      if(state.videos.some(v=>v.id===videoId)||state.pending.some(v=>v.id===videoId)) continue;
      state.pending.push({
        id:videoId,title:video.title||'未命名视频',channel:video.channelTitle||video.channel||'',
        description:video.description||'',duration:Number(video.durationMinutes||0),
        url:`https://www.youtube.com/watch?v=${videoId}`,thumbnail:video.thumbnail||youtubeThumbnail(videoId),
        publishedAt:video.publishedAt||new Date().toISOString(),addedAt:new Date().toISOString(),approved:false,rejected:false,demo:false,
        sourceUsage:video.sourceUsage||'primary',sourceChannelId:video.channelId||''
      }); added++;
    }
    // Worker 成功解析 @handle/频道地址后，保存成稳定的 UC… channel ID，之后同步更稳。
    for (const resolved of data.channels || []) {
      const match = state.settings.channels.find(c =>
        String(c.id || '').trim() === String(resolved.requestedIdentifier || '').trim() ||
        (c.name && resolved.requestedName && c.name === resolved.requestedName)
      );
      if (match && resolved.channelId) {
        match.id = resolved.channelId;
        if (!match.name && resolved.channelTitle) match.name = resolved.channelTitle;
      }
    }
    state.settings.lastSync=new Date().toISOString();
    state.settings.lastSyncError='';
    saveState();renderAll();
    if(!silent || added) showToast(added?`发现 ${added} 个新视频，已放入待审核`:'没有发现新视频');
  } catch(error){
    console.error(error);
    state.settings.lastSyncError = String(error.message || error);
    saveState();
    if(!silent) showToast(`检查失败：${error.message}`);
  } finally {
    youtubeSyncInFlight=false;
    if(button){button.disabled=false;button.textContent=old;}
    renderSettings();
  }
}

function maybeAutoSyncYouTube() {
  if (youtubeSyncDue()) syncYouTube({ silent:true });
}

function saveSettingsFromForm() {
  const rows=[...document.querySelectorAll('.channel-row')];
  state.settings.workerUrl=normalizedWorkerUrl(document.getElementById('youtubeWorkerUrl').value);
  state.settings.autoYouTubeSync=document.getElementById('autoYouTubeSync').checked;
  state.settings.youtubeSyncHours=Math.max(1, Math.min(48, Number(document.getElementById('youtubeSyncHours').value||6)));
  state.settings.apiKey='';
  state.settings.channels=rows.map(row=>({name:row.querySelector('[data-channel-name]').value.trim(),id:row.querySelector('[data-channel-id]').value.trim(),usage:row.querySelector('[data-channel-usage]')?.value||'primary'})).filter(c=>(c.name||c.id)&&!isRetiredChannelName(c.name));
  state.settings.preferMat=document.getElementById('preferMat').checked;
  state.settings.avoidCrunch=document.getElementById('avoidCrunch').checked;
  state.settings.autoDowngrade=document.getElementById('autoDowngrade').checked;
  state.settings.miziGap=Number(document.getElementById('miziGap').value||14); saveState();
}

async function exportData() {
  const filename = `weekly-reset-backup-${torontoDate()}.json`;
  const content = JSON.stringify(state, null, 2);
  const blob = new Blob([content], { type: 'application/json' });

  // iPad 主屏幕 App 中优先使用系统分享面板，可保存到“文件”、AirDrop 或发送给自己。
  try {
    if (typeof File !== 'undefined' && navigator.share && navigator.canShare) {
      const file = new File([blob], filename, { type: 'application/json' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Weekly Reset 完整备份',
          text: '包含视频库、周计划、训练记录、生理期设置和个人偏好。'
        });
        showToast('完整备份已交给系统分享面板');
        return;
      }
    }
  } catch (error) {
    if (error?.name === 'AbortError') return;
    console.warn('系统分享导出失败，改用文件下载：', error);
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('已导出完整 JSON 备份');
}
function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed.videos || !parsed.settings) throw new Error('文件结构不正确');
      parsed.version = APP_DATA_VERSION;
      parsed.settings = { ...defaultState().settings, ...(parsed.settings || {}) };
      parsed.settings.channels = mergeDefaultChannels(parsed.settings.channels || []).filter(channel => !isRetiredChannelName(channel.name));
      parsed.plansByWeek = parsed.plansByWeek && typeof parsed.plansByWeek === 'object' ? parsed.plansByWeek : {};
      parsed.planMetaByWeek = parsed.planMetaByWeek && typeof parsed.planMetaByWeek === 'object' ? parsed.planMetaByWeek : {};
      if (Array.isArray(parsed.plan) && parsed.plan.length) {
        const importedWeek = startOfPlanWeek(parsed.plan[0].date || torontoDate());
        if (!parsed.plansByWeek[importedWeek]) parsed.plansByWeek[importedWeek] = parsed.plan;
      }
      parsed.weekPreferencesByStart = parsed.weekPreferencesByStart && typeof parsed.weekPreferencesByStart === 'object' ? parsed.weekPreferencesByStart : {};
      const importedPreferenceWeek = parsed.weekPreferences?.weekStart || startOfPlanWeek();
      if (!parsed.weekPreferencesByStart[importedPreferenceWeek]) parsed.weekPreferencesByStart[importedPreferenceWeek] = { excludedChannels: Array.isArray(parsed.weekPreferences?.excludedChannels) ? parsed.weekPreferences.excludedChannels : [] };
      for (const pref of Object.values(parsed.weekPreferencesByStart)) if (Array.isArray(pref?.excludedChannels)) pref.excludedChannels = pref.excludedChannels.filter(name => !isRetiredChannelName(name));
      parsed.weekPreferences = { weekStart:startOfPlanWeek(), excludedChannels:Array.isArray(parsed.weekPreferencesByStart[startOfPlanWeek()]?.excludedChannels) ? parsed.weekPreferencesByStart[startOfPlanWeek()].excludedChannels : [] };
      parsed.libraryPreferences = { channel:'all', focus:'all', position:'all', preference:'all', sort:'default', ...(parsed.libraryPreferences || {}) };
      if (isRetiredChannelName(parsed.libraryPreferences.channel)) parsed.libraryPreferences.channel = 'all';
      parsed.libraryAudit = { ...defaultState().libraryAudit, ...(parsed.libraryAudit || {}), running:false };
      parsed.menstrual = { ...defaultState().menstrual, ...(parsed.menstrual || {}) };
      parsed.videos = (parsed.videos || [])
        .filter(video => !isRetiredChannelName(video.channel))
        .filter(video => !(video.starter && RETIRED_SEED_VIDEO_IDS.has(String(video.id || ''))))
        .map(video => {
          const seed = video.starter ? verifiedSeedById.get(String(video.id || '')) : null;
          const status = seed ? 'curated' : (['verified','corrected','curated','manual'].includes(video.verificationStatus) ? video.verificationStatus : 'manual');
          return normalizeMenstrualSafety({ ...(seed || {}), ...video, ...(seed ? { title:seed.title,channel:seed.channel,url:seed.url,thumbnail:seed.thumbnail } : {}), verificationStatus:status, verifiedAt:seed?null:(video.verifiedAt||null), verifiedChannel:seed?'':(video.verifiedChannel||''), linkAuditStatus:seed?'curated':(video.linkAuditStatus||'manual'), linkAuditedAt:seed?null:(video.linkAuditedAt||null), originalChannel:video.originalChannel||'', originalTitle:video.originalTitle||'', verificationNote:/^本次未能核实/.test(String(video.verificationNote||''))?'':(video.verificationNote||''), autoPlanEligible:video.autoPlanEligible!==false, needsReview:!!video.needsReview&&status==='corrected' });
        });
      state = parsed;
      selectedWeekStart = startOfPlanWeek();
      repairRetiredChannelSlots();
      ensureCurrentAndNextPlans();
      saveState(); renderAll();
      showToast('数据已恢复；原有周计划保持锁定，仅退休频道位置会被替换');
    } catch (e) { showToast(`导入失败：${e.message}`); }
  };
  reader.readAsText(file);
}

function bindSafetyCheckboxGroup(abId, inversionId, eligibleId) {
  const ab = document.getElementById(abId);
  const inversion = document.getElementById(inversionId);
  const eligible = document.getElementById(eligibleId);
  if (!ab || !inversion || !eligible) return;
  const blockEligibility = () => { if (ab.checked || inversion.checked) eligible.checked = false; };
  ab.addEventListener('change', blockEligibility);
  inversion.addEventListener('change', blockEligibility);
  eligible.addEventListener('change', () => {
    if (!eligible.checked) return;
    ab.checked = false;
    inversion.checked = false;
  });
}

function bindEvents() {
  bindDialogCloseControls();
  document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.view)));
  document.getElementById('assessmentBtn').addEventListener('click',()=>document.getElementById('assessmentDialog').showModal());
  document.getElementById('menstrualSettingsBtn').addEventListener('click',openMenstrualDialog);
  document.getElementById('clearMenstrualBtn').addEventListener('click',clearMenstrualMode);
  document.getElementById('generateBtn').addEventListener('click',()=>generatePlan(selectedWeekStart));
  document.getElementById('previousWeekBtn').addEventListener('click',()=>changeWeekView(-7));
  document.getElementById('currentWeekBtn').addEventListener('click',()=>setWeekView(startOfPlanWeek()));
  document.getElementById('nextWeekBtn').addEventListener('click',()=>changeWeekView(7));
  document.getElementById('addVideoBtn').addEventListener('click',openAddVideoDialog);
  document.getElementById('mergeStarterLibraryBtn').addEventListener('click',mergeStarterLibrary);
  document.getElementById('auditLibraryBtn')?.addEventListener('click',()=>clearLegacyVerificationErrors());
  document.getElementById('manualReviewAddBtn').addEventListener('click',openAddVideoDialog);
  document.getElementById('settingsAddVideoBtn').addEventListener('click',openAddVideoDialog);
  document.getElementById('advancedSyncBtn').addEventListener('click',()=>syncYouTube({silent:false}));
  document.getElementById('applyWeeklyChannelsBtn').addEventListener('click',applyWeeklyChannelExclusions);
  document.getElementById('clearWeeklyChannelsBtn').addEventListener('click',clearWeeklyChannelExclusions);
  document.getElementById('searchVideoInAppBtn').addEventListener('click',searchYouTubeForEdit);
  document.getElementById('openYouTubeSearchBtn').addEventListener('click',openExternalVideoSearch);
  document.getElementById('exportBtn').addEventListener('click',exportData);
  document.getElementById('settingsExportBtn')?.addEventListener('click',exportData);
  document.getElementById('importBtn').addEventListener('click',()=>document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change',e=>e.target.files[0]&&importData(e.target.files[0]));
  document.getElementById('librarySearch').addEventListener('input',renderLibrary);
  document.getElementById('libraryChannelFilter').addEventListener('change',event=>{
    ensureLibraryPreferences(); state.libraryPreferences.channel=event.target.value; saveState(); renderLibrary();
  });
  document.getElementById('libraryFocusFilter').addEventListener('change',event=>{
    ensureLibraryPreferences(); state.libraryPreferences.focus=event.target.value; saveState(); renderLibrary();
  });
  document.getElementById('libraryPositionFilter').addEventListener('change',event=>{
    ensureLibraryPreferences(); state.libraryPreferences.position=event.target.value; saveState(); renderLibrary();
  });
  document.getElementById('libraryPreferenceFilter').addEventListener('change',event=>{
    ensureLibraryPreferences(); state.libraryPreferences.preference=event.target.value; saveState(); renderLibrary();
  });
  document.getElementById('librarySort').addEventListener('change',event=>{
    ensureLibraryPreferences(); state.libraryPreferences.sort=event.target.value; saveState(); renderLibrary();
  });
  document.getElementById('energyRange').addEventListener('input',e=>document.getElementById('energyValue').textContent=e.target.value);
  document.getElementById('loadRange').addEventListener('input',e=>document.getElementById('loadValue').textContent=e.target.value);
  document.getElementById('menstrualSeverity').addEventListener('input',e=>document.getElementById('menstrualSeverityValue').textContent=e.target.value);
  document.getElementById('menstrualEnabled').addEventListener('change',toggleMenstrualFormFields);
  document.getElementById('effortRange').addEventListener('input',e=>document.getElementById('effortValue').textContent=e.target.value);
  document.getElementById('communityEffort').addEventListener('input',e=>document.getElementById('communityEffortValue').textContent=e.target.value);
  document.getElementById('saveMenstrualBtn').addEventListener('click',e=>{
    e.preventDefault();
    const enabled = document.getElementById('menstrualEnabled').checked;
    const startDate = document.getElementById('menstrualStartDate').value;
    if (enabled && !startDate) { showToast('请选择生理期开始日期'); return; }
    state.menstrual = {
      enabled,
      startDate: startDate || torontoDate(),
      duration: Math.min(10, Math.max(1, Number(document.getElementById('menstrualDuration').value || 5))),
      flow: document.getElementById('menstrualFlow').value,
      severity: Number(document.getElementById('menstrualSeverity').value || 3),
      symptoms: [...document.querySelectorAll('input[name="menstrualSymptom"]:checked')].map(input=>input.value),
      gentleFirstTwoDays: document.getElementById('menstrualGentleFirstTwo').checked,
      avoidAbTraining: true,
      avoidPelvicInversion: true,
      note: document.getElementById('menstrualNote').value.trim(),
      updatedAt: new Date().toISOString()
    };
    saveState();
    document.getElementById('menstrualDialog').close();
    regenerateCurrentAndNext();
  });
  document.getElementById('saveAssessmentBtn').addEventListener('click',e=>{
    e.preventDefault();
    state.assessment={energy:Number(document.getElementById('energyRange').value),load:Number(document.getElementById('loadRange').value),pains:[...document.querySelectorAll('input[name="pain"]:checked')].map(x=>x.value),timeAvailable:Number(document.getElementById('timeAvailable').value),desiredMode:document.getElementById('desiredMode').value,note:document.getElementById('assessmentNote').value.trim(),updatedAt:new Date().toISOString()};
    state.assessment.mode=determineMode(state.assessment); saveState(); document.getElementById('assessmentDialog').close(); regenerateCurrentAndNext();
  });
  document.getElementById('saveCommunityBtn').addEventListener('click',e=>{
    e.preventDefault();
    const date = document.getElementById('communityDate').value || torontoDate();
    if (!date) { showToast('请选择课程日期'); return; }
    const recordId = document.getElementById('communityRecordId').value || createFeedbackRecordId();
    const activityType = document.getElementById('communityClassType').value === 'yoga' ? 'yoga' : 'pilates';
    const overridesPlan = document.getElementById('communityOverridePlan').checked;
    const previous = state.feedback.find(record => record.recordId === recordId);
    const record = {
      recordId,
      source:'community',
      date,
      activityType,
      activityTitle:communityClassTitle(activityType),
      videoId:'',
      videoTitle:'',
      videoChannel:'Community Centre',
      overridesPlan,
      status:'completed',
      minutes:Number(document.getElementById('communityMinutes').value || 0),
      effort:Number(document.getElementById('communityEffort').value || 3),
      pains:[...document.querySelectorAll('input[name="communityPain"]:checked')].map(input => input.value),
      note:document.getElementById('communityNote').value.trim(),
      createdAt:previous?.createdAt || new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };
    state.feedback = state.feedback.filter(existing => {
      if (existing.recordId === recordId) return false;
      if (existing.date !== date) return true;
      if (existing.source === 'community') return false;
      if (overridesPlan && (existing.source || 'plan') === 'plan') return false;
      return true;
    });
    state.feedback.push(record);
    saveState();
    document.getElementById('communityDialog').close();
    renderAll();
    showToast(overridesPlan ? `${record.activityTitle}已覆盖当天视频计划` : `${record.activityTitle}已记录为额外训练`);
  });
  document.getElementById('saveFeedbackBtn').addEventListener('click',e=>{
    e.preventDefault();
    const source = document.getElementById('feedbackSource').value || 'plan';
    const date = document.getElementById('feedbackDate').value || torontoDate();
    const recordId = document.getElementById('feedbackRecordId').value || createFeedbackRecordId();
    const planItem = source === 'plan' ? findPlanItemByDate(date) : null;
    const videoId = document.getElementById('feedbackVideoId').value || planItem?.videoId || '';
    const video = getVideo(videoId);
    if (!date || !videoId || !video) { showToast('无法保存：缺少训练日期或视频'); return; }
    const previous = state.feedback.find(record => record.recordId === recordId);
    const record={recordId,source,date,videoId:video.id,videoTitle:video.title,videoChannel:video.channel,status:document.getElementById('completionStatus').value,minutes:Number(document.getElementById('actualMinutes').value||0),effort:Number(document.getElementById('effortRange').value),pains:[...document.querySelectorAll('input[name="feedbackPain"]:checked')].map(x=>x.value),note:document.getElementById('feedbackNote').value.trim(),createdAt:previous?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
    if (source === 'plan') {
      state.feedback = state.feedback.filter(f => !(f.recordId === recordId || (f.date === date && isPlanFeedback(f))));
    } else {
      state.feedback = state.feedback.filter(f => f.recordId !== recordId);
    }
    state.feedback.push(record);
    // 新体感立即影响“下周”自动安排，但不打乱已经排好的本周计划。
    const nextWeekStart = addDays(startOfPlanWeek(), 7);
    delete state.plansByWeek[nextWeekStart];
    if (state.planMetaByWeek) delete state.planMetaByWeek[nextWeekStart];
    saveState();document.getElementById('feedbackDialog').close();renderAll();showToast(source==='library'?'已记录；体感会用于后续排课':'训练记录已保存；体感会用于后续排课');
  });
  document.getElementById('saveEditedVideoBtn').addEventListener('click',e=>{e.preventDefault();saveEditedVideo();});
  document.getElementById('editVideoSearchQuery').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchYouTubeForEdit();}});
  document.getElementById('videoChannel').addEventListener('change',updateAddVideoChannelField);
  bindSafetyCheckboxGroup('videoAbTraining','videoPelvicInversion','videoMenstrualEligible');
  bindSafetyCheckboxGroup('editVideoAbTraining','editVideoPelvicInversion','editVideoMenstrualEligible');
  bindSafetyCheckboxGroup('reviewAbTraining','reviewPelvicInversion','reviewMenstrualEligible');
  document.getElementById('saveVideoBtn').addEventListener('click',e=>{
    e.preventDefault(); const title=document.getElementById('videoTitle').value.trim(); const channel=selectedAddVideoChannel(); if(!title||!channel){showToast('请填写标题并选择 YouTuber');return;}
    const url=normalizeYouTubeVideoUrl(document.getElementById('videoUrl').value.trim());
    if(!url){showToast('请粘贴单个 YouTube 视频的链接，不要使用搜索页或频道页');return;}
    const id=extractYouTubeVideoId(url);
    if(state.videos.some(v=>v.id===id)){showToast('这个 YouTube 视频链接已经在视频库中');return;}
    if (isRetiredChannelName(channel)) { showToast('Jessica Valant 已从候选频道中移除'); return; }
    const reserveOnly=/heather robertson/i.test(channel);
    state.videos.push({id,title,channel,url,duration:Number(document.getElementById('videoDuration').value||15),focus:document.getElementById('videoFocus').value,position:document.getElementById('videoPosition').value,risk:document.getElementById('videoRisk').value,level:reserveOnly?'progress':'stable',drFriendly:document.getElementById('videoRisk').value==='low',crunchHeavy:false,abTraining:document.getElementById('videoAbTraining').checked,pelvicInversion:document.getElementById('videoPelvicInversion').checked,menstrualEligible:document.getElementById('videoMenstrualEligible').checked&&!document.getElementById('videoAbTraining').checked&&!document.getElementById('videoPelvicInversion').checked,reserveOnly,approved:true,rejected:false,demo:false,thumbnail:youtubeThumbnail(id),publishedAt:new Date().toISOString(),addedAt:new Date().toISOString(),note:reserveOnly?'手动添加；高强度备用频道':'手动添加',verificationStatus:'manual',verifiedAt:null,verifiedChannel:'',verificationNote:'',originalChannel:'',originalTitle:'',needsReview:false,autoPlanEligible:true});
    saveState();document.getElementById('videoDialog').close();document.getElementById('videoForm').reset();renderAll();showToast('已加入视频库；现有周计划保持不变');
  });
  document.getElementById('approveVideoBtn').addEventListener('click',e=>{
    e.preventDefault(); const id=document.getElementById('reviewVideoId').value; const pending=state.pending.find(v=>v.id===id); if(!pending)return;
    state.videos.push({...pending,focus:document.getElementById('reviewFocus').value,position:document.getElementById('reviewPosition').value,risk:document.getElementById('reviewRisk').value,level:document.getElementById('reviewLevel').value,crunchHeavy:document.getElementById('reviewCrunch').checked,drFriendly:document.getElementById('reviewDR').checked,abTraining:document.getElementById('reviewAbTraining').checked,pelvicInversion:document.getElementById('reviewPelvicInversion').checked,menstrualEligible:document.getElementById('reviewMenstrualEligible').checked&&!document.getElementById('reviewAbTraining').checked&&!document.getElementById('reviewPelvicInversion').checked,reserveOnly:pending.sourceUsage==='reserve',addedAt:pending.addedAt||new Date().toISOString(),note:document.getElementById('reviewNote').value.trim(),approved:true,rejected:false,verificationStatus:'manual',verifiedAt:null,verifiedChannel:'',verificationNote:'',originalChannel:'',originalTitle:'',needsReview:false,autoPlanEligible:true});
    pending.approved=true;saveState();document.getElementById('reviewDialog').close();renderAll();showToast('已批准进入视频库；现有周计划保持不变');
  });
  document.getElementById('rejectVideoBtn').addEventListener('click',e=>{e.preventDefault();const id=document.getElementById('reviewVideoId').value;const pending=state.pending.find(v=>v.id===id);if(pending)pending.rejected=true;saveState();document.getElementById('reviewDialog').close();renderAll();showToast('已标记为不纳入');});
  document.getElementById('addChannelBtn').addEventListener('click',()=>{saveSettingsFromForm();state.settings.channels.push({name:'',id:'',usage:'primary'});renderSettings();});
  document.getElementById('saveSettingsBtn').addEventListener('click',()=>{saveSettingsFromForm();renderAll();showToast('设置已保存');});
  document.getElementById('resetBtn').addEventListener('click',()=>{if(confirm('恢复初始视频库会覆盖当前本地记录，确定继续？')){state=defaultState();saveState();generatePlanSilently();renderAll();showToast('已恢复初始视频库');}});
  document.getElementById('installBtn').addEventListener('click',async()=>{
    if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;document.getElementById('installBtn').classList.add('hidden');return;}
    if(isAppleTouchDevice()&&!isStandaloneApp()){document.getElementById('ipadInstallDialog')?.showModal();return;}
    showToast(isStandaloneApp()?'App 已从主屏幕运行':'请使用 Safari 的“分享 → 添加到主屏幕”安装');
  });
}

window.openMenstrualDialog = function() {
  hydrateMenstrualDialog();
  document.getElementById('menstrualDialog').showModal();
};
function clearMenstrualMode() {
  state.menstrual.enabled = false;
  state.menstrual.updatedAt = new Date().toISOString();
  saveState();
  regenerateCurrentAndNext();
  showToast('已关闭生理期模式并重新安排本周与下周');
}
function toggleMenstrualFormFields() {
  const enabled = document.getElementById('menstrualEnabled').checked;
  document.getElementById('menstrualFields').classList.toggle('form-disabled', !enabled);
  document.querySelectorAll('#menstrualFields input, #menstrualFields select, #menstrualFields textarea').forEach(el=>el.disabled=!enabled);
}
function hydrateMenstrualDialog() {
  const m = state.menstrual || defaultState().menstrual;
  document.getElementById('menstrualEnabled').checked = !!m.enabled;
  document.getElementById('menstrualStartDate').value = m.startDate || torontoDate();
  document.getElementById('menstrualDuration').value = String(m.duration || 5);
  document.getElementById('menstrualFlow').value = m.flow || 'medium';
  document.getElementById('menstrualSeverity').value = String(m.severity || 3);
  document.getElementById('menstrualSeverityValue').textContent = String(m.severity || 3);
  document.getElementById('menstrualGentleFirstTwo').checked = m.gentleFirstTwoDays !== false;
  document.getElementById('menstrualNote').value = m.note || '';
  document.querySelectorAll('input[name="menstrualSymptom"]').forEach(cb=>cb.checked=(m.symptoms||[]).includes(cb.value));
  toggleMenstrualFormFields();
}

function hydrateAssessmentDialog() {
  const a=state.assessment;
  document.getElementById('energyRange').value=a.energy;document.getElementById('energyValue').textContent=a.energy;
  document.getElementById('loadRange').value=a.load;document.getElementById('loadValue').textContent=a.load;
  document.getElementById('timeAvailable').value=String(a.timeAvailable);document.getElementById('desiredMode').value=a.desiredMode||'auto';document.getElementById('assessmentNote').value=a.note||'';
  document.querySelectorAll('input[name="pain"]').forEach(cb=>cb.checked=a.pains.includes(cb.value));
}

document.getElementById('assessmentDialog').addEventListener('close',hydrateAssessmentDialog);
document.getElementById('menstrualDialog').addEventListener('close',hydrateMenstrualDialog);

function refreshForCurrentDate({ force = false } = {}) {
  const today = torontoDate();
  const dateChanged = today !== lastKnownTorontoDate;
  if (!dateChanged && !force) return;

  lastKnownTorontoDate = today;
  if (dateChanged) {
    selectedWeekStart = startOfPlanWeek(today);
    renderAll();
    switchView('home');
    showToast('日期已更新，已切换到今天的训练');
    return;
  }

  // 从 YouTube 或后台返回同一天时，也刷新顶部日期和今日训练状态。
  renderHeader();
  renderHome();
}

function handleAppForeground() {
  refreshForCurrentDate({ force: true });
  updateInstallButtonForDevice();
  maybeAutoSyncYouTube();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') handleAppForeground();
});
window.addEventListener('focus', handleAppForeground);
// 即使 App 一直保持在前台，也会在跨过多伦多午夜后自动刷新。
setInterval(() => refreshForCurrentDate(), 60 * 1000);

window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;document.getElementById('installBtn').classList.remove('hidden');});
function updateInstallButtonForDevice(){
  const button=document.getElementById('installBtn');
  if(!button)return;
  if(isAppleTouchDevice()&&!isStandaloneApp()){
    button.textContent='安装到 iPad';
    button.classList.remove('hidden');
  } else if(isStandaloneApp()) {
    button.classList.add('hidden');
  }
}
window.addEventListener('pageshow',handleAppForeground);
window.addEventListener('appinstalled',()=>showToast('已安装到主屏幕'));

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error));}

repairRetiredChannelSlots();
bindEvents();hydrateAssessmentDialog();hydrateMenstrualDialog();renderAll();updateInstallButtonForDevice();
setTimeout(() => clearLegacyVerificationErrors(), 300);
setTimeout(() => maybeAutoSyncYouTube(), 1200);
