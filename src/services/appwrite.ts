import { Account, Client } from 'appwrite';

export const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("67f8215f002cd6e32c3b");

export const account = new Account(client)
