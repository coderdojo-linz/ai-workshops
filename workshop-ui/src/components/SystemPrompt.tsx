'use client';

import { useState, useEffect, useMemo } from 'react';
import styles from './SystemPrompt.module.css';
import Markdown from 'react-markdown';
import remarkGfm from "remark-gfm";
import { getTextFromChildren, hashString } from '@/lib/utility';
import { Clipboard, ClipboardCheck } from 'lucide-react';
import Callout from './Callout';
import CodeHighlight from './CodeHighlight';

interface SystemPromptProps {
  exerciseId: string;
  type?: 'system-prompt' | 'task-sheet';
}

export default function SystemPrompt({ exerciseId, type = 'system-prompt' }: Readonly<SystemPromptProps>) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  function handleCopy(copyText: string) {
    navigator.clipboard.writeText(copyText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  const markdownComponents = useMemo(() => ({
    // eslint-disable-next-line react/no-unstable-nested-components
    code(props: any) {
      const { children } = props;
      const text = getTextFromChildren(children);
      const key = `code-${hashString(text || '')}`;
      return (
        <Callout
          key={key}
          title='Code'
          icon='FileCode2'
          foldable
          content={
            <>
              <button onClick={() => (text ? handleCopy(text) : true)} className={styles.copyButton}>
                {isCopied ? <ClipboardCheck size={18} /> : <Clipboard size={18} />}
              </button>
              <CodeHighlight className='hljs'>{text}</CodeHighlight>
            </>
          }
        />
      );
    }
  }), [isCopied]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        setError('');

        const response = await fetch(`/api/exercises/${exerciseId}/${type}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch ${type.replace('-', ' ')}`);
        }

        const contentText = await response.text();
        setContent(contentText);
      } catch (err) {
        console.error(`Error fetching ${type}:`, err);
        setError(`Failed to load ${type.replace('-', ' ')}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [exerciseId, type]);

  if (isLoading) {
    return <div>Loading {type.replace('-', ' ')}...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }


  return (
    <div className={styles.content}>
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</Markdown>
    </div>
  );
}
