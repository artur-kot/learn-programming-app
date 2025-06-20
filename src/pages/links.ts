export const links = {
  home: '/',
  login: '/auth/login',
  register: '/auth/register',
  forgotPassword: '/auth/forgot-password',
  profile: '/profile',
  course: (courseId: string) => `/course/${courseId}`,
  topic: (courseId: string, topicId: string) => `/course/${courseId}/topic/${topicId}`,
  aiAssistant: '/ai-assistant',
};

export const AI_ASSISTANT = '/ai-assistant';
