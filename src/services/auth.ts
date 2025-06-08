import { ID } from "appwrite";
import { account } from "./appwrite";

export const getCurrentUser = async () => {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const createUser = async (email: string, password: string) => {
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