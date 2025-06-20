import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Textarea,
  Button,
  Paper,
  Text,
  ScrollArea,
  Group,
  ActionIcon,
  LoadingOverlay,
  Alert,
  Select,
  Stack,
  Tooltip,
  Badge,
} from '@mantine/core';
import { RiSendPlaneFill, RiRobotFill, RiDownloadLine, RiCloseLine } from 'react-icons/ri';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface Model {
  value: string;
  label: string;
  size?: number;
  modified_at?: string;
}

interface TopicAIAssistantProps {
  currentExercise: {
    title: string;
    task: string;
    content: string;
    codeExample: string;
    difficulty: string;
  };
  completedExercises: number;
  totalExercises: number;
  onClose?: () => void;
}

export const TopicAIAssistant: React.FC<TopicAIAssistantProps> = ({
  currentExercise,
  completedExercises,
  totalExercises,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('qwen2.5-coder:14b');
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const testConnection = async () => {
    setIsLoadingModels(true);
    try {
      const result = await window.electronAPI.testOllamaConnection();
      setIsConnected(result.success);
      if (result.success && result.models) {
        setAvailableModels(result.models);
        if (result.models.length > 0 && !result.models.find((m) => m.value === selectedModel)) {
          setSelectedModel(result.models[0].value);
        }
      } else if (!result.success) {
        setError(`Ollama connection failed: ${result.error}`);
      }
    } catch (err) {
      setIsConnected(false);
      setError('Failed to test Ollama connection');
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    window.electronAPI.onOllamaStream((data) => {
      if (data.done) {
        if (currentStreamingMessage) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              content: currentStreamingMessage,
              isUser: false,
              timestamp: new Date(),
            },
          ]);
          setCurrentStreamingMessage('');
        }
        setIsLoading(false);
      } else {
        setCurrentStreamingMessage((prev) => prev + data.chunk);
      }
    });

    return () => {
      window.electronAPI.removeOllamaStreamListener();
    };
  }, [currentStreamingMessage]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, currentStreamingMessage]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);
    setCurrentStreamingMessage('');

    try {
      await window.electronAPI.streamOllamaResponse(inputValue, selectedModel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response from AI');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentStreamingMessage('');
    setError(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatModelSize = (size?: number) => {
    if (!size) return '';
    const gb = size / (1024 * 1024 * 1024);
    return `(${gb.toFixed(1)}GB)`;
  };

  const getContextualPrompt = () => {
    return `I'm working on a coding exercise: "${currentExercise.title}". 
    
Exercise details:
- Task: ${currentExercise.task}
- Difficulty: ${currentExercise.difficulty}
- Theory: ${currentExercise.content}

Please help me with this exercise. You can:
- Explain concepts I don't understand
- Provide hints and guidance
- Review my code and suggest improvements
- Answer questions about HTML, CSS, or JavaScript

What would you like to ask me about this exercise?`;
  };

  return (
    <Stack gap="md" h="100%">
      {/* AI Header */}
      <Group justify="space-between">
        <Group gap="xs">
          <RiRobotFill size={20} />
          <Text fw={600} size="sm">
            AI Assistant
          </Text>
          {isConnected !== null && (
            <Badge size="xs" color={isConnected ? 'green' : 'red'}>
              {isConnected ? '●' : '●'}
            </Badge>
          )}
        </Group>
        <Group gap="xs">
          <Select
            size="xs"
            value={selectedModel}
            onChange={(value) => setSelectedModel(value || 'qwen2.5-coder:14b')}
            data={availableModels.map((model) => ({
              value: model.value,
              label: `${model.label} ${formatModelSize(model.size)}`,
            }))}
            w={120}
            disabled={!isConnected || isLoadingModels}
            placeholder={isLoadingModels ? 'Loading...' : 'Model'}
          />
          <Tooltip label="Refresh models">
            <ActionIcon
              variant="subtle"
              size="xs"
              onClick={testConnection}
              loading={isLoadingModels}
            >
              <RiDownloadLine size={12} />
            </ActionIcon>
          </Tooltip>
          {onClose && (
            <Tooltip label="Hide AI Panel">
              <ActionIcon variant="subtle" size="xs" onClick={onClose}>
                <RiCloseLine size={12} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      {error && (
        <Alert color="red" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      )}

      {!isConnected && isConnected !== null && (
        <Alert color="orange">
          Ollama not connected. Run <code>ollama serve</code>
        </Alert>
      )}

      {/* Context Information */}
      <Paper p="xs" bg="blue.0" withBorder>
        <Text size="xs" fw={500} mb="xs">
          💡 Current Exercise
        </Text>
        <Text size="xs" mb="xs">
          {currentExercise.title}
        </Text>
        <Text size="xs" c="dimmed">
          {currentExercise.task}
        </Text>
      </Paper>

      {/* Chat Messages */}
      <ScrollArea flex={1} ref={scrollAreaRef}>
        <Stack gap="xs">
          {messages.length === 0 && (
            <Paper p="xs" bg="gray.0" withBorder>
              <Text size="xs" c="dimmed" ta="center">
                Ask me about this exercise or coding concepts!
              </Text>
            </Paper>
          )}

          {messages.map((message) => (
            <Box
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                p="xs"
                style={{
                  maxWidth: '85%',
                  backgroundColor: message.isUser
                    ? 'var(--mantine-color-blue-6)'
                    : 'var(--mantine-color-gray-1)',
                  color: message.isUser ? 'white' : 'inherit',
                }}
              >
                <Text size="xs" style={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Text>
                <Text size="xs" c="dimmed" mt={2}>
                  {formatTime(message.timestamp)}
                </Text>
              </Paper>
            </Box>
          ))}

          {currentStreamingMessage && (
            <Box style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Paper
                p="xs"
                style={{ maxWidth: '85%', backgroundColor: 'var(--mantine-color-gray-1)' }}
              >
                <Text size="xs" style={{ whiteSpace: 'pre-wrap' }}>
                  {currentStreamingMessage}
                  <span
                    style={{
                      animation: 'blink 1s infinite',
                      opacity: 1,
                    }}
                  >
                    ▋
                  </span>
                </Text>
              </Paper>
            </Box>
          )}
        </Stack>
      </ScrollArea>

      {/* Input Area */}
      <Box style={{ position: 'relative' }}>
        <LoadingOverlay visible={isLoading} />
        <Group gap="xs">
          <Textarea
            placeholder={isConnected ? 'Ask about this exercise...' : 'Ollama not connected...'}
            value={inputValue}
            onChange={(event) => setInputValue(event.currentTarget.value)}
            onKeyPress={handleKeyPress}
            autosize
            minRows={1}
            maxRows={3}
            flex={1}
            disabled={isLoading || !isConnected}
            size="xs"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || !isConnected}
            leftSection={<RiSendPlaneFill size={12} />}
            size="xs"
          >
            Send
          </Button>
        </Group>
      </Box>
    </Stack>
  );
};
