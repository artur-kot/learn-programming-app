import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CodeTheme = 'vs-dark' | 'light';

interface CodeEditorState {
  theme: CodeTheme;
}

const initialState: CodeEditorState = {
  theme: 'vs-dark',
};

const codeEditorSlice = createSlice({
  name: 'codeEditor',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<CodeTheme>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'vs-dark' ? 'light' : 'vs-dark';
    },
  },
});

export const { setTheme, toggleTheme } = codeEditorSlice.actions;
export default codeEditorSlice.reducer;
