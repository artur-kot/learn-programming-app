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
import { RiArrowLeftLine, RiArrowRightLine, RiCheckLine, RiSparklingFill } from 'react-icons/ri';
import { CodeFiles } from '~/components/CodeFiles';
import { TopicAIAssistant } from '~/components/TopicAIAssistant';

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

  // Resizable sidebar states
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(360);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(350);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const currentExercise = EXERCISES[currentExerciseIndex];
  const progress = (completedExercises.length / EXERCISES.length) * 100;

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate available width for middle area
  const availableWidth = windowWidth - leftSidebarWidth - (showAiPanel ? rightSidebarWidth : 0);
  const minMiddleWidth = 600;

  // Adjust sidebar widths if middle area is too small
  useEffect(() => {
    if (availableWidth < minMiddleWidth) {
      const deficit = minMiddleWidth - availableWidth;
      if (showAiPanel) {
        // Reduce both sidebars proportionally
        const leftRatio = leftSidebarWidth / (leftSidebarWidth + rightSidebarWidth);
        const rightRatio = rightSidebarWidth / (leftSidebarWidth + rightSidebarWidth);
        setLeftSidebarWidth(Math.max(200, leftSidebarWidth - deficit * leftRatio));
        setRightSidebarWidth(Math.max(250, rightSidebarWidth - deficit * rightRatio));
      } else {
        // Only reduce left sidebar
        setLeftSidebarWidth(Math.max(200, leftSidebarWidth - deficit));
      }
    }
  }, [windowWidth, showAiPanel, leftSidebarWidth, rightSidebarWidth, availableWidth]);

  // Mouse event handlers for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = Math.max(200, Math.min(500, e.clientX));
        setLeftSidebarWidth(newWidth);
      }
      if (isResizingRight) {
        // Calculate width from right edge of window
        const rightEdge = windowWidth - e.clientX;
        const newWidth = Math.max(250, Math.min(500, rightEdge));
        setRightSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingLeft, isResizingRight, windowWidth]);

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
    <Box style={{ height: '100vh', display: 'flex' }}>
      {/* Left Sidebar - Exercise Description */}
      <Box
        style={{
          width: leftSidebarWidth,
          minWidth: 200,
          maxWidth: 500,
          borderRight: '1px solid var(--mantine-color-gray-3)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Stack gap="md" h="100%" p="md">
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

        {/* Left sidebar resize handle */}
        <Box
          pos="absolute"
          right={-4}
          top={0}
          bottom={0}
          w={8}
          style={{
            cursor: 'col-resize',
            background: 'transparent',
            zIndex: 10,
          }}
          onMouseDown={() => setIsResizingLeft(true)}
        />
      </Box>

      {/* Main Content - Code Editor */}
      <Box
        style={{
          flex: 1,
          minWidth: minMiddleWidth,
          position: 'relative',
        }}
      >
        <CodeFiles initialFiles={currentExercise.initialFiles} />

        {/* Floating AI Panel Toggle */}
        {!showAiPanel && (
          <Tooltip label="Show AI Assistant" openDelay={350}>
            <ActionIcon
              variant="gradient"
              color="blue"
              size="xl"
              radius="xl"
              pos="fixed"
              onClick={() => setShowAiPanel(true)}
              style={{ zIndex: 1000, bottom: 100, right: 50 }}
            >
              <RiSparklingFill size={20} />
            </ActionIcon>
          </Tooltip>
        )}
      </Box>

      {/* Right Sidebar - AI Agent */}
      {showAiPanel && (
        <Box
          style={{
            width: rightSidebarWidth,
            minWidth: 250,
            maxWidth: 500,
            borderLeft: '1px solid var(--mantine-color-gray-3)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box p="md" style={{ flex: 1 }}>
            <TopicAIAssistant
              currentExercise={currentExercise}
              completedExercises={completedExercises.length}
              totalExercises={EXERCISES.length}
              onClose={() => setShowAiPanel(false)}
            />
          </Box>

          {/* Right sidebar resize handle */}
          <Box
            pos="absolute"
            left={-4}
            top={0}
            bottom={0}
            w={8}
            style={{
              cursor: 'col-resize',
              background: 'transparent',
              zIndex: 10,
            }}
            onMouseDown={() => setIsResizingRight(true)}
          />
        </Box>
      )}
    </Box>
  );
};
