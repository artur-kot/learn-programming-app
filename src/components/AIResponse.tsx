import React from 'react';
import { Box, Card, Text } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import { AIMarkdownComponents } from './AIMarkdownComponents';

interface AIResponseProps {
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export const AIResponse: React.FC<AIResponseProps> = ({
  content,
  timestamp,
  isStreaming = false,
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card>
      <ReactMarkdown components={AIMarkdownComponents}>{content}</ReactMarkdown>
      {isStreaming && (
        <span
          style={{
            animation: 'blink 1s infinite',
            opacity: 1,
          }}
        >
          ▋
        </span>
      )}
      <Text size="xs" c="dimmed" mt={2}>
        {formatTime(timestamp)}
      </Text>
    </Card>
  );
};
