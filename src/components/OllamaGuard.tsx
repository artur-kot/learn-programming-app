import React from 'react';
import { Alert, Stack, Button } from '@mantine/core';
import { RiDownloadLine } from 'react-icons/ri';

interface OllamaGuardProps {
  isConnected: boolean | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showInstallInstructions?: boolean;
}

export const OllamaGuard: React.FC<OllamaGuardProps> = ({
  isConnected,
  children,
  fallback,
  showInstallInstructions = false,
}) => {
  if (isConnected === null) {
    return (
      <Alert color="yellow" title="Checking Ollama Connection">
        Verifying connection to Ollama server...
      </Alert>
    );
  }

  if (!isConnected) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert color="orange" title="Ollama Not Available">
        <Stack gap="sm">
          <div>
            Ollama server is not running or not installed. Please install and start Ollama to use AI features.
          </div>
          {showInstallInstructions && (
            <div>
              <strong>To install Ollama:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Visit <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer">ollama.ai</a></li>
                <li>Download and install Ollama for your platform</li>
                <li>Start the Ollama service</li>
                <li>Refresh this page</li>
              </ul>
            </div>
          )}
        </Stack>
      </Alert>
    );
  }

  return <>{children}</>;
}; 