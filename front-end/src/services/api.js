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
  updateProfile: (data) => apiClient.patch('auth/me/', data),
  changePassword: (data) => apiClient.post('auth/change-password/', data),
  getUsers: (params) => apiClient.get('auth/users/', { params }),
  updateUser: (userId, data) => apiClient.patch(`auth/users/${userId}/`, data),
};

export const courseAPI = {
  getCategories: () => apiClient.get('courses/categories/'),
  createCategory: (data) => apiClient.post('courses/categories/', data),
  updateCategory: (categoryId, data) => apiClient.patch(`courses/categories/${categoryId}/`, data),
  deleteCategory: (categoryId) => apiClient.delete(`courses/categories/${categoryId}/`),
  getCourses: (params) => apiClient.get('courses/', { params }),
  getCourseDetail: (identifier) => apiClient.get(`courses/${identifier}/`),
  getTeachingCourses: () => apiClient.get('courses/teaching/'),
  createCourse: (data) => apiClient.post('courses/', data),
  updateCourse: (identifier, data) => apiClient.patch(`courses/${identifier}/`, data),
  deleteCourse: (identifier) => apiClient.delete(`courses/${identifier}/`),
  publishCourse: (identifier) => apiClient.post(`courses/${identifier}/publish/`),
  createChapter: (courseId, data) => apiClient.post(`courses/${courseId}/chapters/`, data),
  updateChapter: (chapterId, data) => apiClient.patch(`courses/chapters/${chapterId}/`, data),
  deleteChapter: (chapterId) => apiClient.delete(`courses/chapters/${chapterId}/`),
  createLesson: (chapterId, data) => apiClient.post(`courses/chapters/${chapterId}/lessons/`, data),
  getLessonDetail: (lessonId) => apiClient.get(`courses/lessons/${lessonId}/`),
  updateLesson: (lessonId, data) => apiClient.patch(`courses/lessons/${lessonId}/`, data),
  deleteLesson: (lessonId) => apiClient.delete(`courses/lessons/${lessonId}/`),
  uploadMaterial: (lessonId, data) => apiClient.post(`courses/lessons/${lessonId}/materials/`, data),
  deleteMaterial: (materialId) => apiClient.delete(`courses/materials/${materialId}/`),
};

export const learningAPI = {
  getMyCourses: () => apiClient.get('learning/my-courses/'),
  getMyCourseDetail: (courseIdentifier) => apiClient.get(`learning/my-courses/${courseIdentifier}/`),
  enrollCourse: (courseId) => apiClient.post(`learning/enroll/${courseId}/`),
  trackLessonProgress: (lessonId, data) => apiClient.post(`learning/lessons/${lessonId}/track-progress/`, data),
  completeLesson: (lessonId) => apiClient.post(`learning/lessons/${lessonId}/complete/`),
  getMyCertificates: () => apiClient.get('learning/certificates/'),
  verifyCertificate: (certificateCode) => apiClient.get(`learning/certificates/${certificateCode}/`),
};

export const assessmentAPI = {
  getQuizzes: (params) => apiClient.get('assessments/quizzes/', { params }),
  getQuizDetail: (id) => apiClient.get(`assessments/quizzes/${id}/`),
  createQuiz: (data) => apiClient.post('assessments/quizzes/', data),
  updateQuiz: (id, data) => apiClient.patch(`assessments/quizzes/${id}/`, data),
  deleteQuiz: (id) => apiClient.delete(`assessments/quizzes/${id}/`),
  createQuestion: (quizId, data) => apiClient.post(`assessments/quizzes/${quizId}/questions/`, data),
  updateQuestion: (questionId, data) => apiClient.patch(`assessments/questions/${questionId}/`, data),
  deleteQuestion: (questionId) => apiClient.delete(`assessments/questions/${questionId}/`),
  startAttempt: (quizId) => apiClient.post(`assessments/quizzes/${quizId}/start/`),
  submitAttempt: (attemptId, answers) => apiClient.post(`assessments/attempts/${attemptId}/submit/`, { answers }),
  getAttemptResult: (attemptId) => apiClient.get(`assessments/attempts/${attemptId}/results/`),
  getMyAttempts: () => apiClient.get('assessments/my-attempts/'),
};

export const aiAPI = {
  getSessions: () => apiClient.get('ai/sessions/'),
  getSessionDetail: (sessionId) => apiClient.get(`ai/sessions/${sessionId}/`),
  createSession: (data) => apiClient.post('ai/sessions/', data),
  deleteSession: (sessionId) => apiClient.delete(`ai/sessions/${sessionId}/`),
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
  getBatches: () => apiClient.get('quiz-import/batches/'),
  getBatchDetail: (batchId) => apiClient.get(`quiz-import/batches/${batchId}/`),
  confirmImport: (batchId, quizId, customQuestions) =>
    apiClient.post(`quiz-import/batches/${batchId}/confirm/`, { quiz_id: quizId, questions: customQuestions }),
};
