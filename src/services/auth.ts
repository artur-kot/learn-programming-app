import { ID } from 'appwrite';
import { account } from './appwrite';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { setStatus, setUser } from '~/store/features/authSlice';

export const getCurrentUser = async () => {
  try {
    const user = await account.get();
    return { user, error: null };
  } catch (error: any) {
    return {
      user: null,
      error: {
        code: error?.code || 500,
        message: error?.message || 'An error occurred',
      },
    };
  }
};

export const register = async (email: string, password: string) => {
  try {
    const user = await account.create(ID.unique(), email, password);
    return { user, error: null };
  } catch (error: any) {
    return {
      user: null,
      error: {
        code: error?.code || 500,
        message: error?.message || 'An error occurred',
      },
    };
  }
};

export const login = async (email: string, password: string) => {
  try {
    const user = await account.createEmailPasswordSession(email, password);
    return { user, error: null };
  } catch (error: any) {
    return {
      user: null,
      error: {
        code: error?.code || 500,
        message: error?.message || 'An error occurred',
      },
    };
  }
};

export const resetPassword = async (email: string) => {
  try {
    await account.createRecovery(email, 'http://localhost:3000/reset-password');
    return { success: true, error: null };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error?.code || 500,
        message: error?.message || 'An error occurred',
      },
    };
  }
};

export const useCurrentUser = () => {
  const user = useAppSelector((store) => store.auth.user);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      dispatch(setStatus('loading'));
      const { user, error } = await getCurrentUser();
      if (error) {
        dispatch(setStatus('error'));
      } else {
        dispatch(setUser(user));
        dispatch(setStatus('finished'));
      }
    };
    if (!user) {
      fetchUser();
    }
  }, []);

  return user;
};
