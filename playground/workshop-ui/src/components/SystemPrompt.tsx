'use client';

import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import styles from './SystemPrompt.module.css';

interface SystemPromptProps {
  exerciseId: string;
}

export default function SystemPrompt({ exerciseId }: SystemPromptProps) {
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchSystemPrompt = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const response = await fetch(`/api/exercises/${exerciseId}/system-prompt`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch system prompt');
        }
        
        const promptText = await response.text();
        setSystemPrompt(promptText);
      } catch (err) {
        console.error('Error fetching system prompt:', err);
        setError('Failed to load system prompt');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSystemPrompt();
  }, [exerciseId]);

  if (isLoading) {
    return <div>Loading system prompt...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Render the system prompt as markdown
  const htmlContent = DOMPurify.sanitize(marked.parse(systemPrompt) as string);

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      className={styles.content}
    />
  );
} 