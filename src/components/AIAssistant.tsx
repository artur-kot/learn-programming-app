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
import { OllamaGuard } from './OllamaGuard';

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
  const [isOllamaInstalled, setIsOllamaInstalled] = useState<boolean | null>(null);
  const [isInstallingOllama, setIsInstallingOllama] = useState(false);
  const [isStartingServer, setIsStartingServer] = useState(false);
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

        // Handle cancellation
        if (data.cancelled) {
          console.log('Stream was cancelled');
        }
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

  const handleStopStreaming = async () => {
    try {
      // Call the API to stop the stream
      const result = await window.electronAPI.stopOllamaStream();

      if (result.success) {
        console.log(result.message);
      } else {
        console.error('Failed to stop stream:', result.error);
      }
    } catch (error) {
      console.error('Error stopping stream:', error);
    }

    // Update UI state
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
          {isOllamaInstalled === false && (
            <Text size="xs" c="red">
              ● Ollama Not Installed
            </Text>
          )}
          {isOllamaInstalled === true && isConnected === false && (
            <Text size="xs" c="orange">
              ● Server Not Running
            </Text>
          )}
          {isConnected === true && (
            <Text size="xs" c="green">
              ● Connected
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
            disabled={!isConnected || isLoadingModels || isOllamaInstalled === false}
            placeholder={isLoadingModels ? 'Loading models...' : 'Select model'}
          />
          <Tooltip label="Refresh models">
            <ActionIcon
              variant="subtle"
              onClick={testConnection}
              loading={isLoadingModels}
              disabled={isOllamaInstalled === false}
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

      <OllamaGuard
        isConnected={isConnected}
        fallback={
          <>
            {isOllamaInstalled === false && (
              <Alert color="orange" mb="md">
                <Text mb="sm">Ollama is not installed on your system.</Text>
                <Button onClick={installOllama} loading={isInstallingOllama} size="sm" color="blue">
                  {isInstallingOllama ? 'Installing...' : 'Install Ollama'}
                </Button>
              </Alert>
            )}

            {isOllamaInstalled === true && !isConnected && isConnected !== null && (
              <Alert color="orange" mb="md">
                <Text mb="sm">Ollama is installed but the server is not running.</Text>
                <Button
                  onClick={startOllamaServer}
                  loading={isStartingServer}
                  size="sm"
                  color="green"
                >
                  {isStartingServer ? 'Starting...' : 'Start Ollama Server'}
                </Button>
              </Alert>
            )}

            {isConnected && availableModels.length === 0 && (
              <Alert color="yellow" mb="md">
                No models found. Pull a model using: <code>ollama pull qwen2.5-coder:14b</code>
              </Alert>
            )}
          </>
        }
      >
        <ScrollArea flex={1} ref={scrollAreaRef} mb="md">
          <Stack gap="md">
            {messages.map((message) => (
              <Box
                key={message.id}
                style={{
                  alignSelf: message.isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}
              >
                <Paper
                  p="sm"
                  bg={message.isUser ? 'blue.6' : 'gray.1'}
                  c={message.isUser ? 'white' : 'inherit'}
                  style={{ borderRadius: '12px' }}
                >
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                  <Text size="xs" c={message.isUser ? 'blue.2' : 'dimmed'} mt="xs">
                    {formatTime(message.timestamp)}
                  </Text>
                </Paper>
              </Box>
            ))}
            {currentStreamingMessage && (
              <Box style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
                <Paper p="sm" bg="gray.1" style={{ borderRadius: '12px' }}>
                  <ReactMarkdown>{currentStreamingMessage}</ReactMarkdown>
                  <Text size="xs" c="dimmed" mt="xs">
                    {formatTime(new Date())} (typing...)
                  </Text>
                </Paper>
              </Box>
            )}
          </Stack>
        </ScrollArea>

        <Box style={{ position: 'relative' }}>
          <LoadingOverlay visible={isLoading} />
          <Group gap="xs">
            <Textarea
              placeholder="Ask me anything about coding, debugging, or development..."
              value={inputValue}
              onChange={(event) => setInputValue(event.currentTarget.value)}
              onKeyPress={handleKeyPress}
              autosize
              minRows={1}
              maxRows={4}
              flex={1}
              disabled={isLoading}
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
                disabled={!inputValue.trim() || isLoading}
                leftSection={<RiSendPlaneFill size={16} />}
                size="sm"
              >
                Send
              </Button>
            )}
          </Group>
        </Box>
      </OllamaGuard>
    </Paper>
  );
};
