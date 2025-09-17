import { themeHandlers } from './theme.handlers.js';
import { gitCourseHandlers } from './course-handlers/git.course.handlers.js';

export const ipcHandlers = {
  ...themeHandlers,
  ...gitCourseHandlers,
};
