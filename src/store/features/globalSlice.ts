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

export const globalSlice = createSlice({
  name: 'global',
  initialState: {
    course: Course.HTML,
    selectedTopic: topics[Course.HTML][0], // Initialize with first topic
  },
  reducers: {
    setCourse: (state, action: PayloadAction<Course>) => {
      state.course = action.payload;
      state.selectedTopic = topics[action.payload][0]; // Set first topic of new course
    },
    setSelectedTopic: (state, action: PayloadAction<string>) => {
      state.selectedTopic = action.payload;
    },
  },
});

export const { setCourse, setSelectedTopic } = globalSlice.actions;

export default globalSlice.reducer;
