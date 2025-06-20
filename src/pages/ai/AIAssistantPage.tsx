import React from 'react';
import { Container, Title, Text, Alert } from '@mantine/core';
import { AIAssistant } from '../../components/AIAssistant';
import { RiInformationLine } from 'react-icons/ri';

export const AIAssistantPage: React.FC = () => {
  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="md">
        AI Coding Assistant
      </Title>

      <Alert icon={<RiInformationLine size={16} />} title="Local AI Assistant" color="blue" mb="lg">
        This assistant uses Ollama with the Qwen2.5 Code model running locally on your machine. Make
        sure Ollama is running and the model is available.
      </Alert>

      <AIAssistant />
    </Container>
  );
};
