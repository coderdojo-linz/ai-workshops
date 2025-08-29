'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, ChevronDown, Book } from 'lucide-react';

import Modal from '@/components/Modal';
import SystemPrompt from '@/components/SystemPrompt';
import ChatInputArea from '@/components/chat/ChatInputArea';

import { extractFirstHtmlIsland } from './htmlDataReplacer';

import styles from './page.module.css';

import 'highlight.js/styles/github.css';
import Message, { Message as MessageType } from '@/components/chat/Message';
import { hashMessage } from '@/lib/utility';

export default function Home() {
  const params = useParams();
  const router = useRouter();
  const exercise = params.exercise as string;

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentBotMessage, setCurrentBotMessage] = useState('');
  const [exerciseTitle, setExerciseTitle] = useState(exercise); // Start with exercise ID
  const [welcomeMessageLoaded, setWelcomeMessageLoaded] = useState(false);
  const [isSystemPromptModalOpen, setIsSystemPromptModalOpen] = useState(false);
  const [isTaskSheetModalOpen, setIsTaskSheetModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isFirstCall, setIsFirstCall] = useState(true);
  const [responseId, setResponseId] = useState<string | undefined>(undefined);

  // Cache for data file content - only fetch once per component session
  const dataFileContentCache = useRef<string | null>(null);
  const dataFileContentFetched = useRef<boolean>(false);

  async function loadDataFileContent(): Promise<string | undefined> {
    // Check cache first
    if (!dataFileContentFetched.current) {
      try {
        // Fetch exercise data with data file content only once
        const exerciseResponse = await fetch(`/api/exercises/${exercise}?includeDataFileContent=true`);
        if (exerciseResponse.ok) {
          const exerciseData = await exerciseResponse.json();

          // Only process <|DATA|> if there's exactly one data file
          if (exerciseData.data_files && exerciseData.data_files.length === 1) {
            const singleFileName = exerciseData.data_files[0];
            dataFileContentCache.current = exerciseData.data_files_content?.[singleFileName] || null;
          } else {
            // Multiple files - don't process <|DATA|> placeholders
            dataFileContentCache.current = null;
          }
        }
      } catch (error) {
        console.error('Error fetching exercise data:', error);
        dataFileContentCache.current = null;
      } finally {
        dataFileContentFetched.current = true;
      }
    }

    // Replace <|DATA|> with the cached data file content (only for single file exercises)
    if (dataFileContentCache.current) {
      return dataFileContentCache.current;
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


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

  // Fetch exercise metadata and welcome message on component mount
  useEffect(() => {
    const fetchExerciseMetadata = async () => {
      try {
        const response = await fetch(`/api/exercises/${exercise}`);
        if (response.status === 401) {
          // Wenn 401 Unauthorized, weiterleiten zur Login-Seite
          router.push('/login?from=/');
          throw new Error('Nicht autorisiert');
        }
        if (response.ok) {
          const metadata = await response.json();
          setExerciseTitle(metadata.title);

          // Add welcome message as first assistant message if it exists
          if (metadata.welcome_message && !welcomeMessageLoaded) {
            const welcomeMessage: MessageType = {
              role: 'assistant',
              content: metadata.welcome_message,
              type: 'text',
            };
            setMessages([welcomeMessage]);
            setWelcomeMessageLoaded(true);
          }
        }
      } catch (error) {
        console.error('Error fetching exercise metadata:', error);
        // Keep using exercise ID as fallback
      }
    };

    fetchExerciseMetadata();
  }, [exercise, welcomeMessageLoaded]);

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
          encryptedPreviousResponseId: responseId,
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
            const data = line.slice(6); // Remove 'data: ' prefix
            if (data === '[DONE]') {
              // Finalize the assistant message
              const assistantMsg: MessageType = {
                role: 'assistant',
                content: assistantMessage,
                type: 'text',
              };

              // Extract first HTML island and create additional HTML message if found
              const firstHtmlIsland = await extractFirstHtmlIsland(assistantMessage, loadDataFileContent);
              const messagesToAdd: MessageType[] = [assistantMsg];

              if (firstHtmlIsland) {
                messagesToAdd.push({
                  role: 'assistant',
                  html: firstHtmlIsland, // Store processed HTML for iframe srcdoc
                  type: 'html',
                });
              }

              setMessages((prev) => [...prev, ...messagesToAdd]);
              setCurrentBotMessage('');
            } else {
              try {
                const parsed = JSON.parse(data);
                if (parsed.delta) {
                  assistantMessage += parsed.delta;
                  setCurrentBotMessage(assistantMessage);
                }
                if (parsed.encryptedResponseId) {
                  setResponseId(parsed.encryptedResponseId);
                }
              } catch {
                // Ignore parsing errors for SSE data
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, there was an error processing your message.',
          type: 'text',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  const handleToggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleDropdownOption = (option: string) => {
    setIsDropdownOpen(false);
    switch (option) {
      case 'system-prompt':
        setIsSystemPromptModalOpen(true);
        break;
      case 'task-sheet':
        setIsTaskSheetModalOpen(true);
        break;
      default:
        break;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Bar */}
      <div className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.exerciseTitle}>{exerciseTitle}</h1>
        <div className={styles.dropdown} ref={dropdownRef} onMouseEnter={handleToggleDropdown} onMouseLeave={handleToggleDropdown}>
          <button className={styles.dropdownButton}>
            <ChevronDown size={20} />
          </button>
          {isDropdownOpen && (
            <>
              <div className={styles.filler} />
              <div className={styles.dropdownMenu}>
                <button onClick={() => handleDropdownOption('system-prompt')} className={styles.dropdownItem}>
                  <FileText size={16} />
                  <span>System Prompt</span>
                </button>
                <button onClick={() => handleDropdownOption('task-sheet')} className={styles.dropdownItem}>
                  <Book size={16} />
                  <span>Task Sheet</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* System Prompt Modal */}
      <Modal isOpen={isSystemPromptModalOpen} onClose={() => setIsSystemPromptModalOpen(false)} title="System Prompt">
        <SystemPrompt exerciseId={exercise} type="system-prompt" />
      </Modal>

      {/* Task Sheet Modal */}
      <Modal isOpen={isTaskSheetModalOpen} onClose={() => setIsTaskSheetModalOpen(false)} title="Task Sheet">
        <SystemPrompt exerciseId={exercise} type="task-sheet" />
      </Modal>

      {/* Conversation History */}
      <div className={styles.messagesContainer} ref={messagesContainerRef}>
        {messages.map((message) => (
          <Message message={message} key={hashMessage(message)} />
        ))}

        {currentBotMessage &&
          <>
            <Message message={{
              role: 'assistant',
              content: currentBotMessage,
              type: 'text'
            }} />
            {isLoading && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.loader}>
                  <div className={styles.dot} />
                  <div className={styles.dot} />
                  <div className={styles.dot} />
                </div>
              </div>
            )}
          </>
        }

        <div ref={messagesEndRef} />
      </div>

      <ChatInputArea inputRef={inputRef} inputValue={input} setInputValue={setInput} onSubmit={handleSubmit} isLoading={isLoading} messageCount={messages.length} />
    </div>
  );
}
