'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  html: string;
};

// const renderer = {
//   image(image: any) {
//     console.log('rendering', JSON.stringify(image));
//     return `<pre>${JSON.stringify(image)}</pre>`;
//   },
// };
// marked.use({ renderer });

export default function Home() {
  const params = useParams();
  const router = useRouter();
  const exercise = params.exercise as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentBotMessage, setCurrentBotMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentBotMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading || messages.length >= 100) {
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to conversation
    const newMessages = [
      ...messages,
      {
        role: 'user' as const,
        content: userMessage,
        html: DOMPurify.sanitize(marked.parse(userMessage) as string),
      },
    ];
    setMessages(newMessages);
    setCurrentBotMessage('');

    try {
      const response = await fetch(`/api/chat?exercise=${exercise}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Finalize the assistant message
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: assistantMessage,
                  html: DOMPurify.sanitize(marked.parse(assistantMessage) as string),
                },
              ]);
              setCurrentBotMessage('');
            } else {
              try {
                const parsed = JSON.parse(data);
                if (parsed.delta) {
                  assistantMessage += parsed.delta;
                  setCurrentBotMessage(assistantMessage);
                }
              } catch (error) {
                // Ignore parsing errors for SSE data
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, there was an error processing your message.',
          html: DOMPurify.sanitize(marked.parse('Sorry, there was an error processing your message.') as string),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 1000) {
      setInput(value);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className={styles.container}>
      {/* Header Bar */}
      <div className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.exerciseTitle}>{exercise}</h1>
        <div className={styles.headerSpacer}></div>
      </div>

      {/* Conversation History */}
      <div className={styles.messagesContainer}>
        {messages.map((message, index) => (
          <div key={index} className={styles.message}>
            <strong>{message.role === 'user' ? 'You' : 'Bot'}:</strong>{' '}
            <span className={message.role === 'user' ? styles.userMessage : styles.botMessage} dangerouslySetInnerHTML={{ __html: message.html }} />
          </div>
        ))}
        {currentBotMessage && (
          <div className={styles.message}>
            <strong>Bot:</strong>{' '}
            <span
              className={styles.botMessage}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(marked.parse(currentBotMessage) as string),
              }}
            />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <input type="text" value={input} onChange={handleInputChange} placeholder="Type your message..." disabled={isLoading} className={styles.textInput} />
        <button type="submit" disabled={!input.trim() || isLoading || messages.length >= 100} className={styles.sendButton}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>

      {/* Message Counter */}
      <div className={styles.messageCounter}>
        {messages.length}/100 messages | {input.length}/1000 characters
      </div>
    </div>
  );
} 