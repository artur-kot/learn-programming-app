import { Card, Group, Text, Button } from '@mantine/core';
import { RiPlayFill } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';

interface TopicItemProps {
  topicName: string;
  chapterIndex: number;
  topicIndex?: number;
  courseId: string;
}

export const TopicItem = ({ topicName, chapterIndex, topicIndex, courseId }: TopicItemProps) => {
  const navigate = useNavigate();

  const handlePlayClick = () => {
    const topicPath =
      topicIndex !== undefined ? `${chapterIndex + 1}.${topicIndex + 1}` : `${chapterIndex + 1}`;

    navigate(`/course/${courseId}/topic/${topicPath}`);
  };

  const displayName =
    topicIndex !== undefined ? `${chapterIndex + 1}.${topicIndex + 1} ${topicName}` : topicName;

  return (
    <Card withBorder p="md">
      <Group justify="space-between" align="center">
        <Text>{displayName}</Text>
        <Button color="green" onClick={handlePlayClick}>
          <RiPlayFill size="1.25rem" />
        </Button>
      </Group>
    </Card>
  );
};
