/**
 * Utility function to parse any YouTube URL format (watch, embed, short link, shorts)
 * and return the proper embed URL for iframe rendering.
 */
export function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  const str = String(url).trim();

  // Pattern matching watch, youtu.be, embed, shorts
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = str.match(regExp);

  if (match && match[2] && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0`;
  }

  // Already an embed URL with params
  if (str.includes('youtube.com/embed/')) {
    return str;
  }

  return str;
}
