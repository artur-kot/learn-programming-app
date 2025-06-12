import { AppShell, Stack, Collapse, UnstyledButton, Group, Text, rem, Button } from '@mantine/core';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { setSelectedTopic } from '~/store/features/globalSlice';
import { Course } from '~/types/shared.types';
import { useState } from 'react';
import { RiArrowDownSLine } from 'react-icons/ri';

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

  const isSelected = (name: string) => selectedTopic === name;

  const NavItem = ({
    name,
    index,
    hasSubtopics = false,
  }: {
    name: string;
    index: number;
    isSubtopic?: boolean;
    hasSubtopics?: boolean;
  }) => {
    const isExpanded = expandedTopics[name];
    const showChevron = hasSubtopics;

    const handleChevronClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleTopic(name);
    };

    return (
      <Group gap={0}>
        <Button
          variant="subtle"
          color={isSelected(name) ? 'blue' : 'gray'}
          justify="flex-start"
          flex={1}
          size="compact-lg"
          styles={{
            label: {
              width: '100%',
            },
          }}
          leftSection={
            <Text size="sm" fw={500}>
              {index}.
            </Text>
          }
          onClick={() => {
            if (hasSubtopics && !isExpanded) {
              toggleTopic(name);
            }
            dispatch(setSelectedTopic(name));
          }}
        >
          <Group justify="space-between" wrap="nowrap" w="100%" flex={1}>
            <Group gap="xs" wrap="nowrap">
              <Text size="sm" fw={500}>
                {name}
              </Text>
            </Group>
          </Group>
        </Button>
        {showChevron && (
          <Button
            variant="subtle"
            size="xs"
            color="gray"
            onClick={handleChevronClick}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RiArrowDownSLine
              size={20}
              style={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 200ms ease',
              }}
            />
          </Button>
        )}
      </Group>
    );
  };

  return (
    <AppShell.Navbar p="xs" style={{ width: 300 }}>
      <Stack gap={0}>
        {topics[course].map((topic, index) => (
          <div key={topic.name}>
            <NavItem name={topic.name} index={index + 1} hasSubtopics={!!topic.subtopics?.length} />
            {topic.subtopics && (
              <Collapse in={expandedTopics[topic.name]}>
                <Stack gap={0} pl="md" my="xs">
                  {topic.subtopics.map((subtopic, subIndex) => (
                    <NavItem key={subtopic} name={subtopic} index={subIndex + 1} isSubtopic />
                  ))}
                </Stack>
              </Collapse>
            )}
          </div>
        ))}
      </Stack>
    </AppShell.Navbar>
  );
};
