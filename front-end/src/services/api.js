import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor tự động gắn JWT Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== API SERVICES ====================

export const authAPI = {
  login: (credentials) => apiClient.post('accounts/login/', credentials),
  register: (data) => apiClient.post('accounts/register/', data),
  getProfile: () => apiClient.get('accounts/me/'),
};

export const courseAPI = {
  getCourses: (params) => apiClient.get('courses/', { params }),
  getCourseDetail: (slug) => apiClient.get(`courses/${slug}/`),
};

export const learningAPI = {
  getMyLearning: () => apiClient.get('learning/my-learning/'),
  trackProgress: (data) => apiClient.post('learning/progress/track-video/', data),
};

export const assessmentAPI = {
  getQuizzes: (params) => apiClient.get('assessments/quizzes/', { params }),
  getQuizDetail: (id) => apiClient.get(`assessments/quizzes/${id}/`),
  startAttempt: (quizId) => apiClient.post(`assessments/quizzes/${quizId}/start/`),
  submitAttempt: (attemptId, answers) => apiClient.post(`assessments/attempts/${attemptId}/submit/`, { answers }),
};

export const aiAPI = {
  getSessions: () => apiClient.get('ai/sessions/'),
  sendMessage: (sessionId, message, targetLevel = 'B1') =>
    apiClient.post('ai/send/', { session_id: sessionId, message, target_level: targetLevel }),
  checkGrammar: (text, targetLevel = 'B1') =>
    apiClient.post('ai/grammar-check/', { text, target_level: targetLevel }),
};

export const recommendationAPI = {
  getMyLearningPath: () => apiClient.get('recommendations/my-learning-path/'),
  generateLearningPath: (targetLevel, goalDescription) =>
    apiClient.post('recommendations/generate-path/', { target_level: targetLevel, goal_description: goalDescription }),
  getSkillGaps: () => apiClient.get('recommendations/skill-gaps/'),
  getRecommendedCourses: () => apiClient.get('recommendations/courses/'),
  completeStep: (stepId) => apiClient.patch(`recommendations/steps/${stepId}/complete/`),
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
