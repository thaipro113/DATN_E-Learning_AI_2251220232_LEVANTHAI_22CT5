/**
 * Utility functions for media parsing and course title formatting.
 */

export function isYouTubeUrl(url) {
  if (!url) return false;
  const str = String(url).trim().toLowerCase();
  return str.includes('youtube.com') || str.includes('youtu.be');
}

export function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  const str = String(url).trim();

  // Pattern matching watch, youtu.be, embed, shorts
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = str.match(regExp);

  if (match && match[2] && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0`;
  }

  if (str.includes('youtube.com/embed/')) {
    return str;
  }

  return str;
}

/**
 * Clean duplicate CEFR tag in title, e.g. "Ngữ Pháp (CEFR A1-A2)" -> "Ngữ Pháp"
 */
export function cleanCourseTitle(title) {
  if (!title) return '';
  return String(title).replace(/\s*\(\s*CEFR\s+[A-Z0-9-+\s]+\s*\)/gi, '').trim();
}
