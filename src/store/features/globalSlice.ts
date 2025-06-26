import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Course } from '~/types/shared.types';

// Hardcoded topics for now - same as in HomePage
const topics: Record<Course, string[]> = {
  [Course.HTML]: ['Introduction', 'Basic Elements', 'Forms', 'Tables'],
  [Course.CSS]: ['Selectors', 'Box Model', 'Flexbox', 'Grid'],
  [Course.JS]: ['Variables', 'Functions', 'Objects', 'Arrays'],
  [Course.TS]: ['Types', 'Interfaces', 'Generics', 'Type Guards'],
  [Course.REACT]: ['Components', 'Hooks', 'State Management', 'Routing'],
  [Course.NEXT]: ['Pages', 'API Routes', 'Server Components', 'Deployment'],
};

export type ThemeMode = 'light' | 'dark' | 'auto';

interface GlobalState {
  course: Course;
  selectedTopic: string;
  theme: ThemeMode;
}

const initialState: GlobalState = {
  course: Course.HTML,
  selectedTopic: topics[Course.HTML][0], // Initialize with first topic
  theme: 'auto',
};

export const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    setCourse: (state, action: PayloadAction<Course>) => {
      state.course = action.payload;
      state.selectedTopic = topics[action.payload][0]; // Set first topic of new course
    },
    setSelectedTopic: (state, action: PayloadAction<string>) => {
      state.selectedTopic = action.payload;
    },
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      if (state.theme === 'light') {
        state.theme = 'auto';
      } else if (state.theme === 'auto') {
        state.theme = 'dark';
      } else {
        state.theme = 'light';
      }
    },
  },
});

export const { setCourse, setSelectedTopic, setTheme, toggleTheme } = globalSlice.actions;

export default globalSlice.reducer;
