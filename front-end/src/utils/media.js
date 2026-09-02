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

/**
 * Generate clean URL slug from Vietnamese text
 */
export function generateSlug(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Check if a course is already enrolled/registered by student
 */
export function isCourseEnrolled(course, myCourses = []) {
  if (!course || !Array.isArray(myCourses) || myCourses.length === 0) return false;
  const courseId = course.id ? String(course.id).toLowerCase() : null;
  const courseSlug = course.slug ? String(course.slug).toLowerCase().trim() : null;
  const courseTitle = course.title ? cleanCourseTitle(course.title).toLowerCase().trim() : null;

  return myCourses.some((item) => {
    const cObj = item.course || item;
    const enrolledId = cObj.id ? String(cObj.id).toLowerCase() : (item.course_id ? String(item.course_id).toLowerCase() : null);
    const enrolledSlug = cObj.slug ? String(cObj.slug).toLowerCase().trim() : null;
    const enrolledTitle = cObj.title ? cleanCourseTitle(cObj.title).toLowerCase().trim() : null;

    if (courseId && enrolledId && courseId === enrolledId) return true;
    if (courseSlug && enrolledSlug && courseSlug === enrolledSlug) return true;
    if (courseTitle && enrolledTitle && courseTitle === enrolledTitle) return true;
    return false;
  });
}
