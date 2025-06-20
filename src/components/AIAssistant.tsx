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
  Code,
} from '@mantine/core';
import {
  RiSendPlaneFill,
  RiRobotFill,
  RiRefreshLine,
  RiDownloadLine,
  RiStopLine,
} from 'react-icons/ri';
import ReactMarkdown from 'react-markdown';

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

export const AIAssistant: React.FC = () => {
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

    return `You are a helpful AI coding assistant. You can help with:
- Programming questions and explanations
- Code review and debugging
- Best practices and design patterns
- Learning resources and tutorials

${contextMessages ? `Recent conversation context:\n${contextMessages}\n` : ''}

Please provide helpful, accurate, and well-formatted responses.`;
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

  const formatModelSize = (size?: number) => {
    if (!size) return '';
    const gb = size / (1024 * 1024 * 1024);
    return `(${gb.toFixed(1)}GB)`;
  };

  return (
    <Paper shadow="sm" p="md" h="600px" style={{ display: 'flex', flexDirection: 'column' }}>
      <Group justify="space-between" mb="md">
        <Group>
          <RiRobotFill size={20} />
          <Text fw={600}>AI Assistant</Text>
          {isConnected !== null && (
            <Text size="xs" c={isConnected ? 'green' : 'red'}>
              {isConnected ? '● Connected' : '● Disconnected'}
            </Text>
          )}
        </Group>
        <Group>
          <Select
            size="xs"
            value={selectedModel}
            onChange={(value) => setSelectedModel(value || 'qwen2.5-coder:14b')}
            data={availableModels.map((model) => ({
              value: model.value,
              label: `${model.label} ${formatModelSize(model.size)}`,
            }))}
            w={200}
            disabled={!isConnected || isLoadingModels}
            placeholder={isLoadingModels ? 'Loading models...' : 'Select model'}
          />
          <Tooltip label="Refresh models">
            <ActionIcon
              variant="subtle"
              onClick={testConnection}
              loading={isLoadingModels}
              title="Refresh models"
            >
              <RiDownloadLine size={16} />
            </ActionIcon>
          </Tooltip>
          <ActionIcon variant="subtle" onClick={clearChat} title="Clear chat">
            <RiRefreshLine size={16} />
          </ActionIcon>
        </Group>
      </Group>

      {error && (
        <Alert color="red" mb="md" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      )}

      {!isConnected && isConnected !== null && (
        <Alert color="orange" mb="md">
          Please make sure Ollama is running and the model is available. You can start Ollama by
          running <code>ollama serve</code> in your terminal.
        </Alert>
      )}

      {isConnected && availableModels.length === 0 && (
        <Alert color="yellow" mb="md">
          No models found. Pull a model using: <code>ollama pull qwen2.5-coder:14b</code>
        </Alert>
      )}

      <ScrollArea flex={1} ref={scrollAreaRef} mb="md">
        <Stack gap="md">
          {messages.map((message) => (
            <Box
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                p="sm"
                style={{
                  maxWidth: '80%',
                  backgroundColor: message.isUser
                    ? 'var(--mantine-color-blue-6)'
                    : 'var(--mantine-color-gray-1)',
                  color: message.isUser ? 'white' : 'inherit',
                }}
              >
                {message.isUser ? (
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Text>
                ) : (
                  <Box style={{ color: 'inherit' }}>
                    <ReactMarkdown
                      components={{
                        p: ({ children }: any) => (
                          <Text size="sm" mb="sm">
                            {children}
                          </Text>
                        ),
                        h1: ({ children }: any) => (
                          <Text size="sm" fw={700} mb="sm">
                            {children}
                          </Text>
                        ),
                        h2: ({ children }: any) => (
                          <Text size="sm" fw={600} mb="sm">
                            {children}
                          </Text>
                        ),
                        h3: ({ children }: any) => (
                          <Text size="sm" fw={600} mb="sm">
                            {children}
                          </Text>
                        ),
                        code: ({ children, className }: any) => (
                          <Code style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>{children}</Code>
                        ),
                        pre: ({ children }: any) => (
                          <Box mb="sm">
                            <Code block style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                              {children}
                            </Code>
                          </Box>
                        ),
                        ul: ({ children }: any) => (
                          <Box component="ul" mb="sm" style={{ paddingLeft: '1rem' }}>
                            {children}
                          </Box>
                        ),
                        ol: ({ children }: any) => (
                          <Box component="ol" mb="sm" style={{ paddingLeft: '1rem' }}>
                            {children}
                          </Box>
                        ),
                        li: ({ children }: any) => (
                          <Text size="sm" component="li" mb="xs">
                            {children}
                          </Text>
                        ),
                        strong: ({ children }: any) => (
                          <Text size="sm" fw={600} component="span">
                            {children}
                          </Text>
                        ),
                        em: ({ children }: any) => (
                          <Text size="sm" fs="italic" component="span">
                            {children}
                          </Text>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </Box>
                )}
                <Text size="xs" c="dimmed" mt={4}>
                  {formatTime(message.timestamp)}
                </Text>
              </Paper>
            </Box>
          ))}

          {currentStreamingMessage && (
            <Box style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Paper
                p="sm"
                style={{ maxWidth: '80%', backgroundColor: 'var(--mantine-color-gray-1)' }}
              >
                <Box>
                  <ReactMarkdown
                    components={{
                      p: ({ children }: any) => (
                        <Text size="sm" mb="sm">
                          {children}
                        </Text>
                      ),
                      h1: ({ children }: any) => (
                        <Text size="sm" fw={700} mb="sm">
                          {children}
                        </Text>
                      ),
                      h2: ({ children }: any) => (
                        <Text size="sm" fw={600} mb="sm">
                          {children}
                        </Text>
                      ),
                      h3: ({ children }: any) => (
                        <Text size="sm" fw={600} mb="sm">
                          {children}
                        </Text>
                      ),
                      code: ({ children, className }: any) => (
                        <Code style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>{children}</Code>
                      ),
                      pre: ({ children }: any) => (
                        <Box mb="sm">
                          <Code block style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                            {children}
                          </Code>
                        </Box>
                      ),
                      ul: ({ children }: any) => (
                        <Box component="ul" mb="sm" style={{ paddingLeft: '1rem' }}>
                          {children}
                        </Box>
                      ),
                      ol: ({ children }: any) => (
                        <Box component="ol" mb="sm" style={{ paddingLeft: '1rem' }}>
                          {children}
                        </Box>
                      ),
                      li: ({ children }: any) => (
                        <Text size="sm" component="li" mb="xs">
                          {children}
                        </Text>
                      ),
                      strong: ({ children }: any) => (
                        <Text size="sm" fw={600} component="span">
                          {children}
                        </Text>
                      ),
                      em: ({ children }: any) => (
                        <Text size="sm" fs="italic" component="span">
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

      <Box style={{ position: 'relative' }}>
        <LoadingOverlay visible={isLoading} />
        <Group gap="xs">
          <Textarea
            placeholder={
              isConnected
                ? 'Ask me anything about coding, debugging, or development...'
                : 'Ollama not connected...'
            }
            value={inputValue}
            onChange={(event) => setInputValue(event.currentTarget.value)}
            onKeyPress={handleKeyPress}
            autosize
            minRows={1}
            maxRows={4}
            flex={1}
            disabled={isLoading || !isConnected}
          />
          {isStreaming ? (
            <Button
              onClick={handleStopStreaming}
              leftSection={<RiStopLine size={16} />}
              size="sm"
              color="red"
            >
              Stop
            </Button>
          ) : (
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || !isConnected}
              leftSection={<RiSendPlaneFill size={16} />}
              size="sm"
            >
              Send
            </Button>
          )}
        </Group>
      </Box>
    </Paper>
  );
};
