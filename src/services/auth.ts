import { ID, Models } from 'appwrite';
import { account } from './appwrite';
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { setStatus, setUser } from '~/store/features/authSlice';

export const getCurrentUser = async () => {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const register = async (email: string, password: string) => {
  try {
    const user = await account.create(ID.unique(), email, password);
    return user;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const login = async (email: string, password: string) => {
  try {
    const user = await account.createEmailPasswordSession(email, password);
    return user;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await account.createRecovery(email, 'http://localhost:3000/reset-password');
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const useCurrentUser = () => {
  const user = useAppSelector(store => store.auth.user);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      dispatch(setStatus('loading'))
      const user = await getCurrentUser();
      dispatch(setUser(user))
      dispatch(setStatus('finished'))
    };
    if (!user) {
      fetchUser();
    }
  }, []);

  return user;
};