import React, { useState, useEffect } from 'react';
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
  Progress,
  ActionIcon,
  Tooltip,
  List,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  RiRefreshLine,
  RiCheckLine,
  RiCloseLine,
  RiDownloadLine,
  RiStopLine,
  RiDeleteBinLine,
  RiInformationLine,
  RiThumbUpLine,
} from 'react-icons/ri';
import { OllamaGuard } from './OllamaGuard';

interface Model {
  value: string;
  label: string;
  size?: number;
  modified_at?: string;
}

interface DownloadProgress {
  [modelName: string]: {
    status: string;
    completed?: number;
    total?: number;
    done: boolean;
    error?: boolean;
  };
}

interface SystemInfo {
  platform: string;
  arch: string;
  cpuCount: number;
  cpuModel: string;
  totalMemoryGB: number;
  freeMemoryGB: number;
  isAppleSilicon: boolean;
  hasDedicatedGPU: boolean;
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
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({});
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set());
  const [deletingModels, setDeletingModels] = useState<Set<string>>(new Set());
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [recommendedModels, setRecommendedModels] = useState<Set<string>>(new Set());

  // Get system information and calculate recommendations
  useEffect(() => {
    const getSystemInfo = async () => {
      try {
        const result = await window.electronAPI.getSystemInfo();
        if (result.success && result.systemInfo) {
          setSystemInfo(result.systemInfo);
          calculateRecommendations(result.systemInfo);
        }
      } catch (error) {
        console.error('Failed to get system info:', error);
      }
    };

    if (opened) {
      getSystemInfo();
    }
  }, [opened]);

  const calculateRecommendations = (info: SystemInfo) => {
    const recommendations = new Set<string>();

    // Base recommendations on system capabilities
    if (info.isAppleSilicon) {
      // Apple Silicon can handle larger models well
      if (info.totalMemoryGB >= 16) {
        recommendations.add('qwen2.5-coder:14b');
        recommendations.add('qwen2.5-coder:32b');
      } else if (info.totalMemoryGB >= 8) {
        recommendations.add('qwen2.5-coder:7b');
        recommendations.add('qwen2.5-coder:14b');
      } else {
        recommendations.add('qwen2.5-coder:3b');
        recommendations.add('qwen2.5-coder:7b');
      }
    } else if (info.hasDedicatedGPU) {
      // Dedicated GPU can handle larger models
      if (info.totalMemoryGB >= 16) {
        recommendations.add('qwen2.5-coder:14b');
        recommendations.add('qwen2.5-coder:32b');
      } else if (info.totalMemoryGB >= 8) {
        recommendations.add('qwen2.5-coder:7b');
        recommendations.add('qwen2.5-coder:14b');
      } else {
        recommendations.add('qwen2.5-coder:3b');
        recommendations.add('qwen2.5-coder:7b');
      }
    } else {
      // CPU-only systems
      if (info.cpuCount >= 8 && info.totalMemoryGB >= 16) {
        recommendations.add('qwen2.5-coder:7b');
        recommendations.add('qwen2.5-coder:14b');
      } else if (info.cpuCount >= 4 && info.totalMemoryGB >= 8) {
        recommendations.add('qwen2.5-coder:3b');
        recommendations.add('qwen2.5-coder:7b');
      } else {
        recommendations.add('qwen2.5-coder:0.5b');
        recommendations.add('qwen2.5-coder:1.5b');
        recommendations.add('qwen2.5-coder:3b');
      }
    }

    setRecommendedModels(recommendations);
  };

  const showInfoDialog = () => {
    modals.open({
      title: 'Model Selection Guide',
      size: 'lg',
      children: (
        <Stack gap="md">
          <Text size="sm">Choose the right model based on your system capabilities and needs:</Text>

          <Paper p="md" withBorder>
            <Title order={6} mb="sm">
              System Requirements
            </Title>
            <List size="sm" spacing="xs">
              <List.Item>
                <Text fw={500}>0.5B - 1.5B models:</Text> Basic systems, 4GB+ RAM, any CPU
              </List.Item>
              <List.Item>
                <Text fw={500}>3B models:</Text> 8GB+ RAM, 4+ CPU cores, good for most tasks
              </List.Item>
              <List.Item>
                <Text fw={500}>7B models:</Text> 16GB+ RAM, 8+ CPU cores or dedicated GPU
              </List.Item>
              <List.Item>
                <Text fw={500}>14B models:</Text> 32GB+ RAM, high-end CPU or dedicated GPU
              </List.Item>
              <List.Item>
                <Text fw={500}>32B models:</Text> 64GB+ RAM, high-end system with dedicated GPU
              </List.Item>
            </List>
          </Paper>

          <Paper p="md" withBorder>
            <Title order={6} mb="sm">
              Performance Benefits
            </Title>
            <List size="sm" spacing="xs">
              <List.Item>
                <Text fw={500}>Larger models (7B+):</Text> Better code understanding, more accurate
                suggestions, better reasoning capabilities
              </List.Item>
              <List.Item>
                <Text fw={500}>Smaller models (0.5B-3B):</Text> Faster responses, lower resource
                usage, suitable for basic coding tasks
              </List.Item>
              <List.Item>
                <Text fw={500}>GPU acceleration:</Text> Significantly faster inference, especially
                for larger models
              </List.Item>
              <List.Item>
                <Text fw={500}>Apple Silicon:</Text> Excellent performance with larger models due to
                unified memory
              </List.Item>
            </List>
          </Paper>

          <Paper p="md" withBorder>
            <Title order={6} mb="sm">
              Recommendations
            </Title>
            <List size="sm" spacing="xs">
              <List.Item>
                <Text fw={500}>Development:</Text> Start with 3B or 7B models for good balance of
                speed and quality
              </List.Item>
              <List.Item>
                <Text fw={500}>Learning:</Text> 1.5B or 3B models are sufficient for most coding
                tutorials
              </List.Item>
              <List.Item>
                <Text fw={500}>Professional:</Text> 7B or 14B models for complex code analysis and
                generation
              </List.Item>
              <List.Item>
                <Text fw={500}>Research:</Text> 14B or 32B models for advanced AI research and
                development
              </List.Item>
            </List>
          </Paper>

          {systemInfo && (
            <Paper p="md" withBorder>
              <Title order={6} mb="sm">
                Your System
              </Title>
              <Text size="sm">
                <strong>Platform:</strong> {systemInfo.platform} ({systemInfo.arch})<br />
                <strong>CPU:</strong> {systemInfo.cpuCount} cores - {systemInfo.cpuModel}
                <br />
                <strong>Memory:</strong> {systemInfo.totalMemoryGB}GB total,{' '}
                {systemInfo.freeMemoryGB}GB available
                <br />
                <strong>GPU:</strong>{' '}
                {systemInfo.hasDedicatedGPU ? 'Dedicated GPU detected' : 'Integrated graphics'}
                <br />
                {systemInfo.isAppleSilicon && (
                  <>
                    <strong>Apple Silicon:</strong> Optimized for AI workloads
                  </>
                )}
              </Text>
            </Paper>
          )}
        </Stack>
      ),
    });
  };

  // Set up download progress listener
  useEffect(() => {
    if (opened) {
      window.electronAPI.onOllamaDownloadProgress((data) => {
        setDownloadProgress((prev) => ({
          ...prev,
          [data.modelName]: {
            status: data.status,
            completed: data.completed,
            total: data.total,
            done: data.done,
            error: data.error,
          },
        }));

        if (data.done) {
          setDownloadingModels((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.modelName);
            return newSet;
          });

          // Refresh models list when download completes
          if (!data.error) {
            setTimeout(() => {
              onRefreshModels();
            }, 1000);
          }
        }
      });

      return () => {
        window.electronAPI.removeOllamaDownloadListener();
      };
    }
  }, [opened, onRefreshModels]);

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

  const handleDownloadModel = async (modelName: string) => {
    if (!isConnected || downloadingModels.has(modelName)) return;

    setDownloadingModels((prev) => new Set(prev).add(modelName));
    setDownloadProgress((prev) => ({
      ...prev,
      [modelName]: {
        status: 'Starting download...',
        done: false,
      },
    }));

    try {
      await window.electronAPI.downloadOllamaModel(modelName);
    } catch (error) {
      setDownloadProgress((prev) => ({
        ...prev,
        [modelName]: {
          status: `Error: ${error instanceof Error ? error.message : 'Download failed'}`,
          done: true,
          error: true,
        },
      }));
      setDownloadingModels((prev) => {
        const newSet = new Set(prev);
        newSet.delete(modelName);
        return newSet;
      });
    }
  };

  const handleCancelDownload = async (modelName: string) => {
    try {
      await window.electronAPI.cancelOllamaDownload(modelName);
      setDownloadProgress((prev) => ({
        ...prev,
        [modelName]: {
          status: 'Download cancelled',
          done: true,
          error: true,
        },
      }));
      setDownloadingModels((prev) => {
        const newSet = new Set(prev);
        newSet.delete(modelName);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to cancel download:', error);
    }
  };

  const handleDeleteModel = async (modelName: string) => {
    setDeletingModels((prev) => new Set(prev).add(modelName));

    try {
      const result = await window.electronAPI.deleteOllamaModel(modelName);
      if (result.success) {
        // Show success notification
        notifications.show({
          title: 'Model Deleted',
          message: `Successfully deleted "${modelName}"`,
          color: 'green',
        });

        // Check if the deleted model was the currently selected one
        if (modelName === selectedModel) {
          // Find the first available model to switch to
          const remainingModels = availableModels.filter((model) => model.value !== modelName);
          if (remainingModels.length > 0) {
            onModelChange(remainingModels[0].value);
            notifications.show({
              title: 'Model Switched',
              message: `Switched to "${remainingModels[0].value}"`,
              color: 'blue',
            });
          }
        }

        // Refresh models list after deletion
        setTimeout(() => {
          onRefreshModels();
        }, 1000);
      } else {
        notifications.show({
          title: 'Delete Failed',
          message: `Failed to delete "${modelName}": ${result.error}`,
          color: 'red',
        });
        console.error('Failed to delete model:', result.error);
      }
    } catch (error) {
      notifications.show({
        title: 'Delete Failed',
        message: `Failed to delete "${modelName}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        color: 'red',
      });
      console.error('Failed to delete model:', error);
    } finally {
      setDeletingModels((prev) => {
        const newSet = new Set(prev);
        newSet.delete(modelName);
        return newSet;
      });
    }
  };

  const confirmCancelDownload = (modelName: string) => {
    modals.openConfirmModal({
      title: 'Cancel Download',
      children: (
        <Text>
          Are you sure you want to cancel the download of "{modelName}"? This action cannot be
          undone.
        </Text>
      ),
      labels: { confirm: 'Cancel Download', cancel: 'Keep Downloading' },
      confirmProps: { color: 'red' },
      onConfirm: () => handleCancelDownload(modelName),
    });
  };

  const confirmDeleteModel = (modelName: string) => {
    modals.openConfirmModal({
      title: 'Delete Model',
      children: (
        <Text>
          Are you sure you want to delete "{modelName}"? This will permanently remove the model from
          your system and cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete Model', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => handleDeleteModel(modelName),
    });
  };

  const getProgressPercentage = (modelName: string) => {
    const progress = downloadProgress[modelName];
    if (!progress || !progress.completed || !progress.total) return 0;
    return Math.round((progress.completed / progress.total) * 100);
  };

  const isDownloading = (modelName: string) => {
    return downloadingModels.has(modelName);
  };

  const isDeleting = (modelName: string) => {
    return deletingModels.has(modelName);
  };

  const getDownloadProgress = (modelName: string) => {
    return downloadProgress[modelName];
  };

  const hasActiveDownload = downloadingModels.size > 0;

  const rows = QWEN_MODELS.map((model) => {
    const installed = isModelInstalled(model.name);
    const size = getModelSize(model.name);
    const downloading = isDownloading(model.name);
    const deleting = isDeleting(model.name);
    const progress = getDownloadProgress(model.name);
    const progressPercentage = getProgressPercentage(model.name);
    const isRecommended = recommendedModels.has(model.name);

    return (
      <Table.Tr key={model.name}>
        <Table.Td>
          <Group gap="xs" align="center">
            <Text size="sm" fw={500}>
              {model.name}
            </Text>
            {isRecommended && (
              <Tooltip label="Recommended for your system">
                <RiThumbUpLine size={14} color="green" />
              </Tooltip>
            )}
          </Group>
          <Text size="xs" c="dimmed">
            {model.description}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{size}</Text>
        </Table.Td>
        <Table.Td>
          {installed ? (
            deleting ? (
              <Stack gap="xs">
                <Badge color="orange" variant="light" size="sm">
                  Deleting...
                </Badge>
              </Stack>
            ) : (
              <Badge color="green" variant="light" size="sm">
                <Group gap={4}>
                  <RiCheckLine size={12} />
                  Installed
                </Group>
              </Badge>
            )
          ) : downloading ? (
            <Stack gap="xs">
              <Badge color="blue" variant="light" size="sm">
                Downloading...
              </Badge>
              {progress && (
                <Stack gap={4}>
                  <Progress
                    value={progressPercentage}
                    size="xs"
                    color={progress.error ? 'red' : 'blue'}
                  />
                  <Text size="xs" c="dimmed">
                    {progress.status}
                  </Text>
                </Stack>
              )}
            </Stack>
          ) : (
            <Badge color="gray" variant="light" size="sm">
              <Group gap={4}>
                <RiCloseLine size={12} />
                Not Installed
              </Group>
            </Badge>
          )}
        </Table.Td>
        <Table.Td>
          {!installed && !downloading && !hasActiveDownload && (
            <Tooltip label="Download model">
              <ActionIcon
                variant="light"
                color="blue"
                onClick={() => handleDownloadModel(model.name)}
                disabled={!isConnected}
              >
                <RiDownloadLine size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {downloading && (
            <Tooltip label="Cancel download">
              <ActionIcon
                variant="light"
                color="red"
                onClick={() => confirmCancelDownload(model.name)}
              >
                <RiStopLine size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {installed && !downloading && !deleting && (
            <Tooltip label="Delete model">
              <ActionIcon
                variant="light"
                color="red"
                onClick={() => confirmDeleteModel(model.name)}
                disabled={!isConnected}
              >
                <RiDeleteBinLine size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <>
      <Modal opened={opened} onClose={onClose} title="Ollama Settings" size="lg" centered>
        <Stack gap="md">
          <OllamaGuard isConnected={isConnected} showInstallInstructions>
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
                <Title order={6}>Available Models</Title>
                <Tooltip label="Show model selection guide">
                  <ActionIcon variant="light" color="blue" onClick={showInfoDialog}>
                    <RiInformationLine size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <LoadingOverlay visible={isLoadingModels} />

              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Model</Table.Th>
                    <Table.Th>Size</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Paper>
          </OllamaGuard>

          {/* Actions */}
          <Group justify="flex-end">
            <Button onClick={onClose} variant="light">
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};
