'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import Modal from '@/components/Modal';
import SystemPrompt from '@/components/SystemPrompt';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  html: string;
  type?: 'text' | 'html';
};

export default function Home() {
  const params = useParams();
  const router = useRouter();
  const exercise = params.exercise as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentBotMessage, setCurrentBotMessage] = useState('');
  const [exerciseTitle, setExerciseTitle] = useState(exercise); // Start with exercise ID
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFirstCall, setIsFirstCall] = useState(true);
  
  // Cache for data file content - only fetch once per component session
  const dataFileContentCache = useRef<string | null>(null);
  const dataFileContentFetched = useRef<boolean>(false);

  // Function to extract the first HTML code island from markdown content and process <|DATA|> placeholders
  const extractFirstHtmlIsland = async (content: string): Promise<string | null> => {
    const lines = content.split('\n');
    let inHtmlBlock = false;
    let currentHtmlBlock = '';
    
    for (const line of lines) {
      if (line.trim() === '```html' && !inHtmlBlock) {
        inHtmlBlock = true;
        currentHtmlBlock = '';
      } else if (line.trim() === '```' && inHtmlBlock) {
        if (currentHtmlBlock.trim()) {
          let htmlContent = currentHtmlBlock.trim();
          
          // Check if HTML island contains <|DATA|> placeholder
          if (htmlContent.includes('<|DATA|>')) {
            // Check cache first
            if (!dataFileContentFetched.current) {
              try {
                // Fetch exercise data with data file content only once
                const exerciseResponse = await fetch(`/api/exercises/${exercise}?includeDataFileContent=true`);
                if (exerciseResponse.ok) {
                  const exerciseData = await exerciseResponse.json();
                  dataFileContentCache.current = exerciseData.data_file_content || null;
                }
              } catch (error) {
                console.error('Error fetching exercise data:', error);
                dataFileContentCache.current = null;
              } finally {
                dataFileContentFetched.current = true;
              }
            }
            
            // Replace <|DATA|> with the cached data file content
            if (dataFileContentCache.current) {
              htmlContent = htmlContent.replace(/<\|DATA\|>/g, dataFileContentCache.current);
            }
          }
          
          return htmlContent;
        }
        return null;
      } else if (inHtmlBlock) {
        currentHtmlBlock += line + '\n';
      }
    }
    
       return null;
 };
 
 const scrollToBottom = () => {
   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 };

 // const renderer = {
 //   image(image: any) {
 //     console.log('rendering', JSON.stringify(image));
 //     return `<pre>${JSON.stringify(image)}</pre>`;
 //   },
 // };
 // marked.use({ renderer });

 useEffect(() => {
    scrollToBottom();
  }, [messages, currentBotMessage]);

  // Focus input field on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Focus input field after AI message is received
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      inputRef.current?.focus();
    }
  }, [messages]);

  // Fetch exercise metadata on component mount
  useEffect(() => {
    const fetchExerciseMetadata = async () => {
      try {
        const response = await fetch(`/api/exercises/${exercise}`);
        if (response.ok) {
          const metadata = await response.json();
          setExerciseTitle(metadata.title);
        }
      } catch (error) {
        console.error('Error fetching exercise metadata:', error);
        // Keep using exercise ID as fallback
      }
    };

    fetchExerciseMetadata();
  }, [exercise]);

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
        type: 'text' as const,
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
        body: JSON.stringify({ 
          message: userMessage,
          resetConversation: isFirstCall 
        }),
      });

      // After the first successful call, set isFirstCall to false
      if (isFirstCall) {
        setIsFirstCall(false);
      }

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
              const assistantMsg: Message = {
                role: 'assistant',
                content: assistantMessage,
                html: DOMPurify.sanitize(marked.parse(assistantMessage) as string),
                type: 'text',
              };
              
              // Extract first HTML island and create additional HTML message if found
              const firstHtmlIsland = await extractFirstHtmlIsland(assistantMessage);
              const messagesToAdd = [assistantMsg];
              
              if (firstHtmlIsland) {
                messagesToAdd.push({
                  role: 'assistant',
                  content: firstHtmlIsland,
                  html: firstHtmlIsland, // Store processed HTML for iframe srcdoc
                  type: 'html',
                });
              }
              
              setMessages((prev) => [
                ...prev,
                ...messagesToAdd,
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
          type: 'text',
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

  const handleShowSystemPrompt = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Header Bar */}
      <div className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.exerciseTitle}>{exerciseTitle}</h1>
        <button onClick={handleShowSystemPrompt} className={styles.backButton} title="Show System Prompt">
          <FileText size={20} />
        </button>
      </div>

      {/* System Prompt Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title="System Prompt"
      >
        <SystemPrompt exerciseId={exercise} />
      </Modal>

      {/* Conversation History */}
      <div className={styles.messagesContainer}>
        {messages.map((message, index) => (
          <div key={index} className={styles.message}>
            <strong>{message.role === 'user' ? 'You' : 'Bot'}:</strong>{' '}
            {message.type === 'html' ? (
              <iframe
                srcDoc={message.html}
                className={styles.htmlFrame}
                sandbox="allow-scripts allow-same-origin"
                style={{ width: '100%', minHeight: '200px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            ) : (
              <span className={message.role === 'user' ? styles.userMessage : styles.botMessage} dangerouslySetInnerHTML={{ __html: message.html }} />
            )}
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
        <input 
          ref={inputRef}
          type="text" 
          value={input} 
          onChange={handleInputChange} 
          placeholder="Type your message..." 
          disabled={isLoading} 
          className={styles.textInput} 
        />
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