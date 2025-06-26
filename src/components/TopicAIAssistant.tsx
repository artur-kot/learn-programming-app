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
  Stack,
  Tooltip,
  Badge,
  Code,
} from '@mantine/core';
import {
  RiSendPlaneFill,
  RiRobotFill,
  RiCloseLine,
  RiStopLine,
  RiSettings3Line,
} from 'react-icons/ri';
import ReactMarkdown from 'react-markdown';
import { OllamaSettingsModal } from './OllamaSettingsModal';

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
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOllamaInstalled, setIsOllamaInstalled] = useState<boolean | null>(null);
  const [isInstallingOllama, setIsInstallingOllama] = useState(false);
  const [isStartingServer, setIsStartingServer] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const checkOllamaInstallation = async () => {
    try {
      const result = await window.electronAPI.checkOllamaInstalled();
      setIsOllamaInstalled(result.installed);
    } catch (err) {
      setIsOllamaInstalled(false);
      setError('Failed to check Ollama installation');
    }
  };

  const installOllama = async () => {
    setIsInstallingOllama(true);
    setError(null);
    try {
      const result = await window.electronAPI.installOllama();
      if (result.success) {
        setIsOllamaInstalled(true);
        // Try to start the server after installation
        await startOllamaServer();
      } else {
        setError(`Failed to install Ollama: ${result.error}`);
      }
    } catch (err) {
      setError('Failed to install Ollama');
    } finally {
      setIsInstallingOllama(false);
    }
  };

  const startOllamaServer = async () => {
    setIsStartingServer(true);
    setError(null);
    try {
      const result = await window.electronAPI.startOllamaServer();
      if (result.success) {
        // Test connection after starting server
        await testConnection();
      } else {
        setError(`Failed to start Ollama server: ${result.error}`);
      }
    } catch (err) {
      setError('Failed to start Ollama server');
    } finally {
      setIsStartingServer(false);
    }
  };

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
    checkOllamaInstallation();
  }, []);

  useEffect(() => {
    if (isOllamaInstalled) {
      testConnection();
    }
  }, [isOllamaInstalled]);

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
        setIsStreaming(false);
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

  const getContextualPrompt = () => {
    const recentMessages = messages.slice(-10); // Get last 10 messages
    const contextMessages = recentMessages
      .map((msg) => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    return `I'm working on a coding exercise: "${currentExercise.title}". 

Exercise details:
- Task: ${currentExercise.task}
- Difficulty: ${currentExercise.difficulty}
- Theory: ${currentExercise.content}

${contextMessages ? `Recent conversation context:\n${contextMessages}\n` : ''}

Please help me with this exercise. You can:
- Explain concepts I don't understand
- Provide hints and guidance
- Review my code and suggest improvements
- Answer questions about HTML, CSS, or JavaScript

What would you like to ask me about this exercise?`;
  };

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
    setIsStreaming(true);
    setError(null);
    setCurrentStreamingMessage('');

    try {
      // Create a contextual prompt with recent conversation history
      const contextualPrompt = `${getContextualPrompt()}\n\nUser: ${inputValue}\n\nAssistant:`;
      await window.electronAPI.streamOllamaResponse(contextualPrompt, selectedModel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response from AI');
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleStopStreaming = () => {
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
    setIsStreaming(false);
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

  return (
    <Stack gap="md" h="100%">
      {/* AI Header */}
      <Group justify="space-between">
        <Group gap="xs">
          <RiRobotFill size={20} />
          <Text fw={600} size="sm">
            AI Assistant
          </Text>
          {isOllamaInstalled === false && (
            <Badge size="xs" color="red">
              ● Not Installed
            </Badge>
          )}
          {isOllamaInstalled === true && isConnected === false && (
            <Badge size="xs" color="orange">
              ● Server Off
            </Badge>
          )}
          {isConnected === true && (
            <Badge size="xs" color="green">
              ● Connected
            </Badge>
          )}
        </Group>
        <Group gap="xs">
          <Tooltip label="Ollama Settings">
            <ActionIcon
              variant="subtle"
              size="xs"
              onClick={() => setIsSettingsModalOpen(true)}
              disabled={isOllamaInstalled === false}
            >
              <RiSettings3Line size={12} />
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

      {isOllamaInstalled === false && (
        <Alert color="orange">
          <Text size="xs" mb="xs">
            Ollama is not installed on your system.
          </Text>
          <Button onClick={installOllama} loading={isInstallingOllama} size="xs" color="blue">
            {isInstallingOllama ? 'Installing...' : 'Install Ollama'}
          </Button>
        </Alert>
      )}

      {isOllamaInstalled === true && !isConnected && isConnected !== null && (
        <Alert color="orange">
          <Text size="xs" mb="xs">
            Ollama is installed but the server is not running.
          </Text>
          <Button onClick={startOllamaServer} loading={isStartingServer} size="xs" color="green">
            {isStartingServer ? 'Starting...' : 'Start Ollama Server'}
          </Button>
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
                {message.isUser ? (
                  <Text size="xs" style={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Text>
                ) : (
                  <Box style={{ color: 'inherit' }}>
                    <ReactMarkdown
                      components={{
                        p: ({ children }: any) => (
                          <Text size="xs" mb="xs">
                            {children}
                          </Text>
                        ),
                        h1: ({ children }: any) => (
                          <Text size="xs" fw={700} mb="xs">
                            {children}
                          </Text>
                        ),
                        h2: ({ children }: any) => (
                          <Text size="xs" fw={600} mb="xs">
                            {children}
                          </Text>
                        ),
                        h3: ({ children }: any) => (
                          <Text size="xs" fw={600} mb="xs">
                            {children}
                          </Text>
                        ),
                        code: ({ children, className }: any) => (
                          <Code style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>{children}</Code>
                        ),
                        pre: ({ children }: any) => (
                          <Box mb="xs">
                            <Code block style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                              {children}
                            </Code>
                          </Box>
                        ),
                        ul: ({ children }: any) => (
                          <Box component="ul" mb="xs" style={{ paddingLeft: '1rem' }}>
                            {children}
                          </Box>
                        ),
                        ol: ({ children }: any) => (
                          <Box component="ol" mb="xs" style={{ paddingLeft: '1rem' }}>
                            {children}
                          </Box>
                        ),
                        li: ({ children }: any) => (
                          <Text size="xs" component="li" mb="xs">
                            {children}
                          </Text>
                        ),
                        strong: ({ children }: any) => (
                          <Text size="xs" fw={600} component="span">
                            {children}
                          </Text>
                        ),
                        em: ({ children }: any) => (
                          <Text size="xs" fs="italic" component="span">
                            {children}
                          </Text>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </Box>
                )}
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
                <Box>
                  <ReactMarkdown
                    components={{
                      p: ({ children }: any) => (
                        <Text size="xs" mb="xs">
                          {children}
                        </Text>
                      ),
                      h1: ({ children }: any) => (
                        <Text size="xs" fw={700} mb="xs">
                          {children}
                        </Text>
                      ),
                      h2: ({ children }: any) => (
                        <Text size="xs" fw={600} mb="xs">
                          {children}
                        </Text>
                      ),
                      h3: ({ children }: any) => (
                        <Text size="xs" fw={600} mb="xs">
                          {children}
                        </Text>
                      ),
                      code: ({ children, className }: any) => (
                        <Code style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>{children}</Code>
                      ),
                      pre: ({ children }: any) => (
                        <Box mb="xs">
                          <Code block style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                            {children}
                          </Code>
                        </Box>
                      ),
                      ul: ({ children }: any) => (
                        <Box component="ul" mb="xs" style={{ paddingLeft: '1rem' }}>
                          {children}
                        </Box>
                      ),
                      ol: ({ children }: any) => (
                        <Box component="ol" mb="xs" style={{ paddingLeft: '1rem' }}>
                          {children}
                        </Box>
                      ),
                      li: ({ children }: any) => (
                        <Text size="xs" component="li" mb="xs">
                          {children}
                        </Text>
                      ),
                      strong: ({ children }: any) => (
                        <Text size="xs" fw={600} component="span">
                          {children}
                        </Text>
                      ),
                      em: ({ children }: any) => (
                        <Text size="xs" fs="italic" component="span">
                          {children}
                        </Text>
                      ),
                    }}
                  >
                    {currentStreamingMessage}
                  </ReactMarkdown>
                  <span
                    style={{
                      animation: 'blink 1s infinite',
                      opacity: 1,
                    }}
                  >
                    ▋
                  </span>
                </Box>
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
            placeholder={
              isOllamaInstalled === false
                ? 'Install Ollama to use AI Assistant...'
                : isConnected
                  ? 'Ask about this exercise...'
                  : 'Start Ollama server to use AI Assistant...'
            }
            value={inputValue}
            onChange={(event) => setInputValue(event.currentTarget.value)}
            onKeyPress={handleKeyPress}
            autosize
            minRows={1}
            maxRows={3}
            flex={1}
            disabled={isLoading || !isConnected || isOllamaInstalled === false}
            size="xs"
          />
          {isStreaming ? (
            <Button
              onClick={handleStopStreaming}
              leftSection={<RiStopLine size={12} />}
              size="xs"
              color="red"
            >
              Stop
            </Button>
          ) : (
            <Button
              onClick={handleSendMessage}
              disabled={
                !inputValue.trim() || isLoading || !isConnected || isOllamaInstalled === false
              }
              leftSection={<RiSendPlaneFill size={12} />}
              size="xs"
            >
              Send
            </Button>
          )}
        </Group>
      </Box>

      {/* Ollama Settings Modal */}
      <OllamaSettingsModal
        opened={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        availableModels={availableModels}
        isLoadingModels={isLoadingModels}
        onRefreshModels={testConnection}
        isConnected={isConnected}
      />
    </Stack>
  );
};
