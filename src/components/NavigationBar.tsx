import { AppShell, Stack, NavLink, Text } from '@mantine/core';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { setSelectedTopic } from '~/store/features/globalSlice';
import { Course } from '~/types/shared.types';
import { useState } from 'react';

interface Topic {
  name: string;
  subtopics?: string[];
}

interface NavigationBarProps {
  topics: Record<Course, Topic[]>;
}

export const NavigationBar = ({ topics }: NavigationBarProps) => {
  const dispatch = useAppDispatch();
  const { course, selectedTopic } = useAppSelector((state) => state.global);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  const toggleTopic = (topicName: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicName]: !prev[topicName],
    }));
  };

  return (
    <AppShell.Navbar p="xs" style={{ width: 300 }}>
      <Stack gap={0}>
        {topics[course].map((topic, index) => (
          <div key={topic.name}>
            <NavLink
              label={
                <Text size="sm" fw={500}>
                  {index + 1}. {topic.name}
                </Text>
              }
              active={selectedTopic === topic.name}
              onClick={() => {
                if (topic.subtopics?.length) {
                  toggleTopic(topic.name);
                }
                dispatch(setSelectedTopic(topic.name));
              }}
              opened={expandedTopics[topic.name]}
            >
              {topic.subtopics?.map((subtopic, subIndex) => (
                <NavLink
                  key={subtopic}
                  label={
                    <Text size="sm">
                      {index + 1}.{subIndex + 1} {subtopic}
                    </Text>
                  }
                  active={selectedTopic === subtopic}
                  onClick={() => dispatch(setSelectedTopic(subtopic))}
                />
              ))}
            </NavLink>
          </div>
        ))}
      </Stack>
    </AppShell.Navbar>
  );
};
