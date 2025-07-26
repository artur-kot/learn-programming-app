import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Models } from 'appwrite';

interface AuthState {
  user: Models.User<Models.Preferences> | null;
  status: 'idle' | 'loading' | 'finished' | 'error';
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Models.User<Models.Preferences> | null>) => {
      state.user = action.payload;
    },
    setStatus: (state, action: PayloadAction<AuthState['status']>) => {
      state.status = action.payload;
    },
  },
});

export const { setUser, setStatus } = authSlice.actions;

export default authSlice.reducer;
