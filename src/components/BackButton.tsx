import { Button, Group, Text } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { RiArrowLeftLine } from 'react-icons/ri';

interface BackButtonProps {
  label?: string;
  to?: string;
}

export const BackButton = ({ label, to }: BackButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getPreviousScreenName = () => {
    if (label) return label;

    const path = location.pathname;
    if (path.startsWith('/course/')) return 'Courses';
    return 'Back';
  };

  return (
    <Button
      variant="subtle"
      leftSection={<RiArrowLeftLine size="1rem" />}
      // @ts-ignore
      onClick={() => navigate(to ? to : -1)}
      mb="md"
    >
      {getPreviousScreenName()}
    </Button>
  );
};
