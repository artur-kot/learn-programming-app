import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Progress,
  Code,
  Box,
  Divider,
  Badge,
  AppShell,
  ScrollArea,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { nprogress } from '@mantine/nprogress';
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
  RiRobotLine,
  RiCloseLine,
} from 'react-icons/ri';
import { CodeFiles } from '~/components/CodeFiles';

// Hardcoded exercises for now
const EXERCISES = [
  {
    id: 1,
    title: 'Introduction to HTML',
    description: 'Learn the basics of HTML structure and elements',
    content: `HTML (HyperText Markup Language) is the standard markup language for creating web pages.

Key concepts:
• HTML documents are made up of elements
• Elements are represented by tags
• Tags usually come in pairs: opening and closing tags
• The basic structure includes <html>, <head>, and <body> tags`,
    task: 'Create a simple HTML page with a title and a paragraph',
    codeExample: `<html>
  <head>
    <title>My First Page</title>
  </head>
  <body>
    <h1>Hello World!</h1>
    <p>This is my first HTML page.</p>
  </body>
</html>`,
    difficulty: 'Beginner',
    initialFiles: [
      {
        id: 'index.html',
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First Page</title>
</head>
<body>
    <h1>Hello World!</h1>
    <p>This is my first HTML page.</p>
</body>
</html>`,
        isStatic: true,
      },
    ],
  },
  {
    id: 2,
    title: 'CSS Styling Basics',
    description: 'Learn how to style HTML elements with CSS',
    content: `CSS (Cascading Style Sheets) is used to style and layout web pages.

Key concepts:
• CSS can be added inline, internally, or externally
• Selectors target specific HTML elements
• Properties define the visual appearance
• Values specify how properties should be applied`,
    task: 'Style the HTML page with CSS to make it look attractive',
    codeExample: `body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
  margin: 0;
  padding: 20px;
}

h1 {
  color: #333;
  text-align: center;
}

p {
  color: #666;
  line-height: 1.6;
}`,
    difficulty: 'Beginner',
    initialFiles: [
      {
        id: 'index.html',
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Styled Page</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Hello World!</h1>
    <p>This is my styled HTML page.</p>
</body>
</html>`,
        isStatic: true,
      },
      {
        id: 'styles.css',
        name: 'styles.css',
        language: 'css',
        content: `body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
  margin: 0;
  padding: 20px;
}

h1 {
  color: #333;
  text-align: center;
}

p {
  color: #666;
  line-height: 1.6;
}`,
        isStatic: true,
      },
    ],
  },
  {
    id: 3,
    title: 'JavaScript Fundamentals',
    description: 'Learn the basics of JavaScript programming',
    content: `JavaScript is a programming language that adds interactivity to web pages.

Key concepts:
• Variables store data
• Functions are reusable blocks of code
• Events respond to user actions
• DOM manipulation changes page content dynamically`,
    task: 'Add JavaScript to make the page interactive',
    codeExample: `// Add a button to the HTML
<button onclick="changeColor()">Change Color</button>

// Add JavaScript function
function changeColor() {
  document.body.style.backgroundColor = 
    '#' + Math.floor(Math.random()*16777215).toString(16);
}`,
    difficulty: 'Intermediate',
    initialFiles: [
      {
        id: 'index.html',
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Page</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Interactive Page</h1>
    <p>Click the button to change the background color!</p>
    <button onclick="changeColor()">Change Color</button>
    <script src="script.js"></script>
</body>
</html>`,
        isStatic: true,
      },
      {
        id: 'styles.css',
        name: 'styles.css',
        language: 'css',
        content: `body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
  margin: 0;
  padding: 20px;
  text-align: center;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}`,
        isStatic: true,
      },
      {
        id: 'script.js',
        name: 'script.js',
        language: 'javascript',
        content: `function changeColor() {
  document.body.style.backgroundColor = 
    '#' + Math.floor(Math.random()*16777215).toString(16);
}`,
        isStatic: true,
      },
    ],
  },
];

export const TopicPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(true);

  const currentExercise = EXERCISES[currentExerciseIndex];
  const progress = (completedExercises.length / EXERCISES.length) * 100;

  const handleNextExercise = () => {
    if (currentExerciseIndex < EXERCISES.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const handleCompleteExercise = () => {
    if (!completedExercises.includes(currentExercise.id)) {
      setCompletedExercises([...completedExercises, currentExercise.id]);
    }
  };

  const handleBackToCourse = () => {
    navigate(`/course/${courseId}`);
  };

  return (
    <AppShell
      header={{ height: 0 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: true },
      }}
      aside={{
        width: showAiPanel ? 350 : 0,
        breakpoint: 'md',
        collapsed: { mobile: true },
      }}
      style={{ height: '100vh' }}
    >
      {/* Left Sidebar - Exercise Description */}
      <AppShell.Navbar p="md">
        <Stack gap="md" h="100%">
          {/* Header */}
          <Box>
            <Button
              variant="subtle"
              leftSection={<RiArrowLeftLine />}
              onClick={handleBackToCourse}
              mb="md"
              fullWidth
            >
              Back to Course
            </Button>

            <Group gap="xs" mb="xs">
              <Badge color={currentExercise.difficulty === 'Beginner' ? 'green' : 'orange'}>
                {currentExercise.difficulty}
              </Badge>
              <Badge variant="light">
                {currentExerciseIndex + 1} of {EXERCISES.length}
              </Badge>
            </Group>

            <Title order={2} mb="xs">
              {currentExercise.title}
            </Title>
            <Text c="dimmed" size="sm">
              {currentExercise.description}
            </Text>
          </Box>

          <Divider />

          {/* Progress */}
          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>
                Progress
              </Text>
              <Text size="sm" c="dimmed">
                {Math.round(progress)}%
              </Text>
            </Group>
            <Progress value={progress} size="md" radius="xl" color="blue" />
          </Box>

          <Divider />

          {/* Theory Content */}
          <ScrollArea flex={1}>
            <Stack gap="md">
              <Box>
                <Title order={4} mb="sm">
                  Theory
                </Title>
                <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
                  {currentExercise.content}
                </Text>
              </Box>

              <Box>
                <Title order={4} mb="sm">
                  Example
                </Title>
                <Code block>{currentExercise.codeExample}</Code>
              </Box>

              <Box>
                <Title order={4} mb="sm">
                  Your Task
                </Title>
                <Paper p="sm" bg="gray.0" withBorder>
                  <Text size="sm">{currentExercise.task}</Text>
                </Paper>
              </Box>
            </Stack>
          </ScrollArea>

          {/* Navigation */}
          <Box>
            <Group gap="xs">
              <Button
                variant="outline"
                size="sm"
                leftSection={<RiArrowLeftLine />}
                onClick={handlePreviousExercise}
                disabled={currentExerciseIndex === 0}
                flex={1}
              >
                Previous
              </Button>

              <Button
                variant="light"
                color="green"
                size="sm"
                leftSection={<RiCheckLine />}
                onClick={handleCompleteExercise}
                disabled={completedExercises.includes(currentExercise.id)}
                flex={1}
              >
                {completedExercises.includes(currentExercise.id) ? 'Done' : 'Complete'}
              </Button>

              <Button
                size="sm"
                rightSection={<RiArrowRightLine />}
                onClick={handleNextExercise}
                disabled={currentExerciseIndex === EXERCISES.length - 1}
                flex={1}
              >
                Next
              </Button>
            </Group>
          </Box>
        </Stack>
      </AppShell.Navbar>

      {/* Main Content - Code Editor */}
      <AppShell.Main p="0">
        <Box h="100%" pos="relative">
          <CodeFiles initialFiles={currentExercise.initialFiles} />

          {/* Floating AI Panel Toggle */}
          {!showAiPanel && (
            <Tooltip label="Show AI Assistant">
              <ActionIcon
                variant="filled"
                color="blue"
                size="lg"
                radius="xl"
                pos="absolute"
                top="md"
                right="md"
                onClick={() => setShowAiPanel(true)}
                style={{ zIndex: 1000 }}
              >
                <RiRobotLine size={20} />
              </ActionIcon>
            </Tooltip>
          )}
        </Box>
      </AppShell.Main>

      {/* Right Sidebar - AI Agent */}
      {showAiPanel && (
        <AppShell.Aside p="md">
          <Stack gap="md" h="100%">
            {/* AI Header */}
            <Group justify="space-between">
              <Group gap="xs">
                <RiRobotLine size={20} />
                <Title order={4}>AI Assistant</Title>
              </Group>
              <Tooltip label="Hide AI Panel">
                <ActionIcon variant="subtle" onClick={() => setShowAiPanel(false)}>
                  <RiCloseLine size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>

            <Divider />

            {/* AI Content */}
            <ScrollArea flex={1}>
              <Stack gap="md">
                <Paper p="md" bg="blue.0" withBorder>
                  <Text size="sm" fw={500} mb="xs">
                    💡 Tip
                  </Text>
                  <Text size="sm">
                    I can help you with this exercise! Ask me questions about HTML, CSS, or
                    JavaScript, and I'll provide guidance and explanations.
                  </Text>
                </Paper>

                <Paper p="md" bg="gray.0" withBorder>
                  <Text size="sm" fw={500} mb="xs">
                    🎯 Current Exercise
                  </Text>
                  <Text size="sm" mb="xs">
                    {currentExercise.title}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {currentExercise.task}
                  </Text>
                </Paper>

                <Paper p="md" bg="green.0" withBorder>
                  <Text size="sm" fw={500} mb="xs">
                    ✅ Progress
                  </Text>
                  <Text size="sm">
                    You've completed {completedExercises.length} out of {EXERCISES.length}{' '}
                    exercises.
                    {completedExercises.length === EXERCISES.length && ' Great job!'}
                  </Text>
                </Paper>

                {/* Placeholder for AI chat */}
                <Box>
                  <Text size="sm" fw={500} mb="sm">
                    Chat with AI
                  </Text>
                  <Paper p="md" bg="gray.1" withBorder>
                    <Text size="sm" c="dimmed" ta="center">
                      AI chat functionality will be implemented here
                    </Text>
                  </Paper>
                </Box>
              </Stack>
            </ScrollArea>
          </Stack>
        </AppShell.Aside>
      )}
    </AppShell>
  );
};
