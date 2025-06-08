import { Button } from '@mantine/core';
import { useCurrentUser } from '~/services/auth';

export const HomePage = () => {
  const user = useCurrentUser();
  
  return (
    <div>
      <h1>homepage</h1>
      <p>{user?.email}</p>
    </div>
  );
};
