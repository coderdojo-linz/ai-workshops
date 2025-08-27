'use client';

import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Book, ChevronDown, FileCheck2, FileText, FileX2 } from 'lucide-react';
import ChatInputArea from '@/components/chat/ChatInputArea';
import { useEffect, useRef, useState } from 'react';
import Message, { Message as MessageType } from '@/components/chat/Message';
import Modal from '@/components/Modal';
import SystemPrompt from '@/components/SystemPrompt';
import { hashMessage } from '@/lib/utility';

export default function Home() {
  const router = useRouter();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('Du bist ein hilfreicher Assistent.');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [numberOfSystemPromptsApplied, setNumberOfSystemPromptsApplied] = useState(0);
  const [currentBotMessage, setCurrentBotMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [metaMessages, setMetaMessages] = useState<MessageType[]>([]);
  const [currentMetaBotMessage, setCurrentMetaBotMessage] = useState<string | null>(null);
  const metaMessagesEndRef = useRef<HTMLDivElement>(null);
  const [metaResponseId, setMetaResponseId] = useState<string | null>(null);
  const [isMetaLoading, setIsMetaLoading] = useState(false);

  const [isSystemPromptModalOpen, setIsSystemPromptModalOpen] = useState(false);
  const [isTaskSheetModalOpen, setIsTaskSheetModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [exerciseTitle, setExerciseTitle] = useState<string | null>(null);

  const [responseId, setResponseId] = useState<string | null>(null);

  const exercise = 'prompt-engineering';

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

  const handleBack = () => {
    router.push('/');
  };

  function clearChat() {
    setMessages([]);
    setResponseId(null);
    setCurrentBotMessage(null);
  }

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
    metaMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentBotMessage, metaMessages, currentMetaBotMessage]);

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
        type: 'text' as const,
      },
    ];
    setMessages(newMessages);
    setCurrentBotMessage('');

    try {
      const response = await fetch(`/api/chat/prompt-engineering?exercise=${exercise}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          encryptedPreviousResponseId: responseId,
          userSystemPrompt: systemPrompt,
        }),
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
              const assistantMsg: MessageType = {
                role: 'assistant',
                content: assistantMessage,
                type: 'text',
              };

              setMessages((prev) => [...prev, assistantMsg]);
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
                  console.log('Received encryptedResponseId:', parsed.encryptedResponseId);
                }
              } catch {
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
          type: 'text',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSystemPromptApply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!systemPrompt.trim() || isLoading || numberOfSystemPromptsApplied >= 100) {
      return;
    }
    setNumberOfSystemPromptsApplied(numberOfSystemPromptsApplied + 1);

    const userMessage = systemPrompt.trim();
    setIsMetaLoading(true);

    try {
      const response = await fetch(`/api/chat?exercise=${exercise}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          encryptedPreviousResponseId: metaResponseId,
        }),
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
              const assistantMsg: MessageType = {
                role: 'assistant',
                content: assistantMessage,
                type: 'text',
              };

              setMetaMessages((prev) => [...prev, assistantMsg]);
              setCurrentMetaBotMessage('');
              setIsMetaLoading(false);
            } else {
              try {
                const parsed = JSON.parse(data);
                if (parsed.delta) {
                  assistantMessage += parsed.delta;
                  setCurrentMetaBotMessage(assistantMessage);
                }
                if (parsed.encryptedResponseId) {
                  setMetaResponseId(parsed.encryptedResponseId);
                  console.log('Received encryptedResponseId:', parsed.encryptedResponseId);
                }
              } catch {
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
          type: 'text',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Bar */}
      <div className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.exerciseTitle}>{exerciseTitle || 'Dein eigener KI-Assistent'}</h1>
        <div className={styles.dropdown} ref={dropdownRef} onMouseEnter={handleToggleDropdown} onMouseLeave={handleToggleDropdown}>
          <button className={styles.dropdownButton} title="Options">
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

      {/* Content Area (Split into 3 Sub-Areas ) */}
      <div className={styles.content}>
        {/* System Prompt input */}
        <div>
          <textarea
            className={styles.systemPrompt}
            placeholder="Hier kannst du den System Prompt anpassen..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
          <div>
            <div className={styles.buttonRow}>
              <button className={`${styles.sendButton} ${styles.applyButton}`} onClick={handleSystemPromptApply} disabled={numberOfSystemPromptsApplied >= 100 || !systemPrompt.trim() || isMetaLoading}>
                <FileCheck2 />
                <span>Get Feedback</span>
              </button>
              <button className={`${styles.sendButton} ${styles.deleteButton}`} onClick={clearChat} disabled={isLoading || messages.length === 0}>
                <FileX2 />
                <span>Clear Chat</span>
              </button>
            </div>
            <div className={`${styles.messageCounter} ${styles.messageCounterSystemPrompt} ${numberOfSystemPromptsApplied >= 100 ? styles.full : ''}`}>
              {numberOfSystemPromptsApplied}/100 feedback requests used
            </div>
          </div>
        </div>
        {/* AI Bot */}
        <div>
          {/* Conversation History */}
          <div className={styles.messagesContainer}>
            {messages.map((message) => (
              <Message message={message} key={hashMessage(message)} />
            ))}

            {currentBotMessage &&
              <Message message={{
                role: 'assistant',
                content: currentBotMessage,
                type: 'text'
              }} />
            }

            <div ref={messagesEndRef} />
          </div>
          <ChatInputArea inputRef={inputRef} inputValue={input} setInputValue={setInput} onSubmit={handleSubmit} isLoading={isLoading} messageCount={messages.length} />
        </div>

        <div className={`${styles.messagesContainer} ${styles.feedbackChat}`}>
          {metaMessages.map((message) => (
            <Message message={message} key={hashMessage(message)} />
          ))}

          {currentMetaBotMessage &&
            <Message message={{
              role: 'assistant',
              content: currentMetaBotMessage,
              type: 'text'
            }} />
          }

          <div ref={metaMessagesEndRef} />
        </div>
      </div>
    </div>
  );
}
