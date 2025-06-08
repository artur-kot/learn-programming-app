import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Models } from 'appwrite';

interface AuthState {
  user: Models.Preferences | null;
}

const initialState: AuthState = {
  user: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Models.Preferences | null>) => {
      state.user = action.payload;
    },
  },
});

export const { setUser } = authSlice.actions;

export default authSlice.reducer;
