import React from 'react';
import {
  Modal,
  Select,
  Button,
  Group,
  Text,
  Table,
  Badge,
  Stack,
  Alert,
  LoadingOverlay,
  Paper,
  Title,
} from '@mantine/core';
import { RiRefreshLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';

interface Model {
  value: string;
  label: string;
  size?: number;
  modified_at?: string;
}

interface OllamaSettingsModalProps {
  opened: boolean;
  onClose: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: Model[];
  isLoadingModels: boolean;
  onRefreshModels: () => void;
  isConnected: boolean | null;
}

// Predefined Qwen models for reference
const QWEN_MODELS = [
  { name: 'qwen2.5-coder:0.5b', size: '0.5B', description: 'Smallest coding model' },
  { name: 'qwen2.5-coder:1.5b', size: '1.5B', description: 'Small coding model' },
  { name: 'qwen2.5-coder:3b', size: '3B', description: 'Medium coding model' },
  { name: 'qwen2.5-coder:7b', size: '7B', description: 'Large coding model' },
  { name: 'qwen2.5-coder:14b', size: '14B', description: 'Extra large coding model' },
  { name: 'qwen2.5-coder:32b', size: '32B', description: 'Largest coding model' },
];

export const OllamaSettingsModal: React.FC<OllamaSettingsModalProps> = ({
  opened,
  onClose,
  selectedModel,
  onModelChange,
  availableModels,
  isLoadingModels,
  onRefreshModels,
  isConnected,
}) => {
  const formatModelSize = (size?: number) => {
    if (!size) return '';
    const gb = size / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)}GB`;
  };

  const isModelInstalled = (modelName: string) => {
    return availableModels.some((model) => model.value === modelName);
  };

  const getModelSize = (modelName: string) => {
    const model = availableModels.find((m) => m.value === modelName);
    return model?.size ? formatModelSize(model.size) : '';
  };

  const rows = QWEN_MODELS.map((model) => {
    const installed = isModelInstalled(model.name);
    const size = getModelSize(model.name);

    return (
      <Table.Tr key={model.name}>
        <Table.Td>
          <Text size="sm" fw={500}>
            {model.name}
          </Text>
          <Text size="xs" c="dimmed">
            {model.description}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{size}</Text>
        </Table.Td>
        <Table.Td>
          {installed ? (
            <Badge color="green" variant="light" size="sm">
              <Group gap={4}>
                <RiCheckLine size={12} />
                Installed
              </Group>
            </Badge>
          ) : (
            <Badge color="gray" variant="light" size="sm">
              <Group gap={4}>
                <RiCloseLine size={12} />
                Not Installed
              </Group>
            </Badge>
          )}
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Ollama Settings" size="lg" centered>
      <Stack gap="md">
        {/* Connection Status */}
        <Alert
          color={isConnected ? 'green' : 'orange'}
          title={isConnected ? 'Connected to Ollama' : 'Not Connected'}
        >
          {isConnected
            ? 'Ollama server is running and ready to use.'
            : 'Ollama server is not running. Please start the server to use AI features.'}
        </Alert>

        {/* Model Selector */}
        <Paper p="md" withBorder>
          <Title order={6} mb="md">
            Select Model
          </Title>
          <Group gap="sm" align="flex-end">
            <Select
              label="Active Model"
              placeholder="Choose a model"
              value={selectedModel}
              onChange={(value) => onModelChange(value || 'qwen2.5-coder:14b')}
              data={availableModels.map((model) => ({
                value: model.value,
                label: `${model.label} ${formatModelSize(model.size)}`,
              }))}
              style={{ flex: 1 }}
              disabled={!isConnected || isLoadingModels}
            />
            <Button
              onClick={onRefreshModels}
              loading={isLoadingModels}
              disabled={!isConnected}
              leftSection={<RiRefreshLine size={16} />}
              variant="light"
            >
              Refresh
            </Button>
          </Group>
        </Paper>

        {/* Models Table */}
        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={6}>Available LLM Models</Title>
          </Group>

          <LoadingOverlay visible={isLoadingModels} />

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Model</Table.Th>
                <Table.Th>Size</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Paper>

        {/* Actions */}
        <Group justify="flex-end">
          <Button onClick={onClose} variant="light">
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
