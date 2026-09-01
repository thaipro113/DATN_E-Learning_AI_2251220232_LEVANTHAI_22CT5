import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor tự động gắn JWT Token từ localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== 100% LIVE BACKEND API SERVICES ====================

export const authAPI = {
  login: (credentials) => apiClient.post('auth/login/', credentials),
  register: (data) => apiClient.post('auth/register/', data),
  getProfile: () => apiClient.get('auth/me/'),
  getUsers: (params) => apiClient.get('auth/users/', { params }),
  updateUser: (userId, data) => apiClient.patch(`auth/users/${userId}/`, data),
};

export const courseAPI = {
  getCategories: () => apiClient.get('courses/categories/'),
  getCourses: (params) => apiClient.get('courses/', { params }),
  getCourseDetail: (identifier) => apiClient.get(`courses/${identifier}/`),
  getTeachingCourses: () => apiClient.get('courses/teaching/'),
  createCourse: (data) => apiClient.post('courses/', data),
  createChapter: (courseId, data) => apiClient.post(`courses/${courseId}/chapters/`, data),
  createLesson: (chapterId, data) => apiClient.post(`courses/chapters/${chapterId}/lessons/`, data),
  publishCourse: (identifier) => apiClient.post(`courses/${identifier}/publish/`),
};

export const learningAPI = {
  getMyCourses: () => apiClient.get('learning/my-courses/'),
  getMyCourseDetail: (courseIdentifier) => apiClient.get(`learning/my-courses/${courseIdentifier}/`),
  enrollCourse: (courseId) => apiClient.post(`learning/enroll/${courseId}/`),
  trackLessonProgress: (lessonId, data) => apiClient.post(`learning/lessons/${lessonId}/track-progress/`, data),
  completeLesson: (lessonId) => apiClient.post(`learning/lessons/${lessonId}/complete/`),
  getMyCertificates: () => apiClient.get('learning/certificates/'),
};

export const assessmentAPI = {
  getQuizzes: (params) => apiClient.get('assessments/quizzes/', { params }),
  getQuizDetail: (id) => apiClient.get(`assessments/quizzes/${id}/`),
  createQuiz: (data) => apiClient.post('assessments/quizzes/', data),
  createQuestion: (quizId, data) => apiClient.post(`assessments/quizzes/${quizId}/questions/`, data),
  startAttempt: (quizId) => apiClient.post(`assessments/quizzes/${quizId}/start/`),
  submitAttempt: (attemptId, answers) => apiClient.post(`assessments/attempts/${attemptId}/submit/`, { answers }),
  getAttemptResult: (attemptId) => apiClient.get(`assessments/attempts/${attemptId}/results/`),
  getMyAttempts: () => apiClient.get('assessments/my-attempts/'),
};

export const aiAPI = {
  getSessions: () => apiClient.get('ai/sessions/'),
  createSession: (data) => apiClient.post('ai/sessions/', data),
  sendMessage: (sessionId, content, targetLevel = 'B1') =>
    apiClient.post(`ai/sessions/${sessionId}/send/`, { content, target_level: targetLevel }),
  checkGrammar: (text, targetLevel = 'B1') =>
    apiClient.post('ai/grammar-check/', { text, target_level: targetLevel }),
  // UC_S7: Sinh đề ôn tập AI theo tiến độ bài học đã hoàn thành trong Chapter
  generateProgressQuiz: (chapterId, numQuestions = 5) =>
    apiClient.post('ai/quizzes/generate-by-progress/', { chapter_id: chapterId, num_questions: numQuestions }),
  // UC_T4: Giáo viên / Admin sinh câu hỏi trắc nghiệm AI theo Chủ đề & Trình độ
  generateTeacherQuiz: (topic, level = 'B1', count = 5, skill = 'GRAMMAR') =>
    apiClient.post('ai/quizzes/generate/', { topic, level, count, skill }),
};

export const recommendationAPI = {
  getMyLearningPath: () => apiClient.get('recommendations/my-learning-path/'),
  generateLearningPath: (targetLevel, goalDescription) =>
    apiClient.post('recommendations/generate-path/', { target_level: targetLevel, goal_description: goalDescription }),
  completeStep: (stepId) => apiClient.patch(`recommendations/steps/${stepId}/complete/`),
  getSkillGaps: () => apiClient.get('recommendations/skill-gaps/'),
  getRecommendedCourses: () => apiClient.get('recommendations/courses/'),
  dismissRecommendation: (recommendationId) =>
    apiClient.post(`recommendations/courses/${recommendationId}/dismiss/`),
};

export const quizImportAPI = {
  uploadBatch: (formData) =>
    apiClient.post('quiz-import/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getBatchDetail: (batchId) => apiClient.get(`quiz-import/batches/${batchId}/`),
  confirmImport: (batchId, quizId, customQuestions) =>
    apiClient.post(`quiz-import/batches/${batchId}/confirm/`, { quiz_id: quizId, questions: customQuestions }),
};
