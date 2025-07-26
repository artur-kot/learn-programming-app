import React from 'react';
import { Box, Text } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';

export const AIMarkdownComponents = {
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
  code: ({ children, className }: any) => {
    // Check if it's a code block with language
    if (className && className.startsWith('language-')) {
      const language = className.replace('language-', '');
      return (
        <Box mb="xs">
          <CodeHighlight code={String(children)} language={language} />
        </Box>
      );
    }
    // Inline code
    return (
      <Text
        size="xs"
        component="code"
        style={{
          backgroundColor: 'rgba(0,0,0,0.1)',
          padding: '2px 4px',
          borderRadius: '4px',
          fontFamily: 'monospace',
        }}
      >
        {children}
      </Text>
    );
  },
  pre: ({ children }: any) => {
    // Handle pre blocks that might contain code
    const codeElement = React.Children.toArray(children).find(
      (child: any) => React.isValidElement(child) && child.type === 'code'
    ) as React.ReactElement<any> | undefined;

    if (codeElement && codeElement.props.className) {
      console.log('codeElement', codeElement);
      const language = codeElement.props.className.replace('', '');
      return <CodeHighlight code={String(codeElement.props.children)} language={language} />;
    }

    // Fallback for pre blocks without code elements
    return (
      <Text
        size="xs"
        component="pre"
        style={{
          backgroundColor: 'rgba(0,0,0,0.1)',
          padding: '8px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          overflow: 'auto',
        }}
      >
        {children}
      </Text>
    );
  },
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
};
