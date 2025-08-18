'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Send } from 'lucide-react';
import Modal from '@/components/Modal';
import SystemPrompt from '@/components/SystemPrompt';
import { extractFirstHtmlIsland } from './htmlDataReplacer';

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isFirstCall, setIsFirstCall] = useState(true);

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

  const renderer = new marked.Renderer();

  // Override code block rendering
  renderer.code = ({ text, lang, escaped }) => {
    let code;
    // We'll store an encoded JSON string for a data attribute if parsing succeeds.
    let parsedScriptEncoded: string | null = null;
    let parsedObj: any = null;

    try {
      // test if text has a json with the script tag
      // (then use the content of the script tag as code)

      // Try to parse the full text as JSON first
      try {
        parsedObj = JSON.parse(text);
      } catch (e) {
        console.warn('Failed to parse JSON from code block:', e, { text });
      }

      if (parsedObj && typeof parsedObj.script === 'string') {
        code = parsedObj.script;
        parsedScriptEncoded = encodeURIComponent(JSON.stringify(parsedObj));
        // console.log('Extracted code from parsed JSON:', code);
      } else {
        code = text;
        // console.log('No script tag found, using original text');
      }
    } catch (error) {
      console.error('Error parsing code block:', text, error);
    }

    const codeBlockId = `code-block-${Math.random().toString(36).substr(2, 9)}`;
    const dataAttr = parsedScriptEncoded ? ' data-script="' + parsedScriptEncoded + '"' : '';

    // Add a copy button and classes we can hook into from React (scripts injected via innerHTML don't execute)
    return (`
    <div class="callout foldable" style="--callout-color: 8, 109, 221;" id="${codeBlockId}"${dataAttr}>
      <div class="title">
        <div class="title-left">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="code" class="lucide lucide-code"><path d="m16 18 6-6-6-6"></path><path d="m8 6-6 6 6 6"></path></svg> 
        Code
        </div>
        <div class="title-right" style="display:flex;align-items:center;gap:8px;">
          <button class="copy-button" data-target="${codeBlockId}" title="Copy code" style="padding:6px 8px;border-radius:6px;border:1px solid rgba(0,0,0,0.08);background:transparent;cursor:pointer">Copy</button>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="chevron-down" class="lucide lucide-chevron-down fold-arrow" style="transition: transform 0.2s ease;"><path d="m6 9 6 6 6-6"></path></svg>
        </div>
      </div>
      <div class="content">
        <pre><code>${code}</code></pre>
      </div>
    </div>
    `);
  };

  marked.use({ renderer });

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

  // Attach copy-to-clipboard and fold handlers for generated code blocks INSIDE the messages container
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const parseScriptAttr = (callout: HTMLElement) => {
      const encoded = callout.getAttribute('data-script');
      if (!encoded) return;
      try {
        const decoded = decodeURIComponent(encoded);
        const parsed = JSON.parse(decoded);
        (callout as any)._scriptData = parsed;
      } catch (err) {
        console.warn('Failed to parse script JSON on callout', err);
      }
    };

    const attachToCallout = (co: HTMLElement) => {
      parseScriptAttr(co);

      const copyBtn = co.querySelector('.copy-button') as HTMLElement | null;
      if (copyBtn && !(copyBtn as any)._copiedHandler) {
        const handler = async (e: Event) => {
          e.preventDefault();
          const codeEl = co.querySelector('pre code');
          const text = codeEl ? (codeEl.textContent || '') : '';
          try {
            await navigator.clipboard.writeText(text);
            const prev = copyBtn.innerHTML;
            copyBtn.innerHTML = 'Copied!';
            setTimeout(() => { copyBtn.innerHTML = prev; }, 1500);
          } catch (err) {
            console.error('Failed to copy code to clipboard', err);
          }
        };
        (copyBtn as any)._copiedHandler = handler;
        copyBtn.addEventListener('click', handler);
      }

      const titleElm = co.querySelector('.title') as HTMLElement | null;
      if (titleElm && !(titleElm as any)._foldHandler) {
        const content = co.querySelector('.content') as HTMLElement | null;
        const arrow = titleElm.querySelector('.fold-arrow') as HTMLElement | null;
        const handler = () => {
          if (!content) return;
          const isHidden = content.style.display === 'none';
          content.style.display = isHidden ? 'block' : 'none';
          if (arrow) arrow.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
        };
        (titleElm as any)._foldHandler = handler;
        titleElm.addEventListener('click', handler);
      }
    };

    // Attach to existing callouts
    container.querySelectorAll<HTMLElement>('.callout').forEach((node) => attachToCallout(node));

    // Observe for new callouts added later (useful for streaming or dynamic inserts)
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n instanceof HTMLElement) {
            if (n.classList.contains('callout')) {
              attachToCallout(n);
            } else {
              // maybe a wrapper; find callouts inside
              n.querySelectorAll?.('.callout')?.forEach((c) => attachToCallout(c as HTMLElement));
            }
          }
        });
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      // cleanup handlers
      container.querySelectorAll<HTMLElement>('.callout').forEach((co) => {
        const copyBtn = co.querySelector<HTMLElement>('.copy-button');
        if (copyBtn && (copyBtn as any)._copiedHandler) {
          copyBtn.removeEventListener('click', (copyBtn as any)._copiedHandler);
          delete (copyBtn as any)._copiedHandler;
        }
        const titleElm = co.querySelector<HTMLElement>('.title');
        if (titleElm && (titleElm as any)._foldHandler) {
          titleElm.removeEventListener('click', (titleElm as any)._foldHandler);
          delete (titleElm as any)._foldHandler;
        }
      });
    };
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
          resetConversation: isFirstCall,
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
              const firstHtmlIsland = await extractFirstHtmlIsland(assistantMessage, loadDataFileContent);
              const messagesToAdd = [assistantMsg];

              if (firstHtmlIsland) {
                messagesToAdd.push({
                  role: 'assistant',
                  content: firstHtmlIsland,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="System Prompt">
        <SystemPrompt exerciseId={exercise} />
      </Modal>

      {/* Conversation History */}
      <div className={styles.messagesContainer} ref={messagesContainerRef}>
        {messages.map((message, index) => (
          <div key={index} className={[styles.message, message.role === 'user' ? styles.userMessageContainer : styles.botMessageContainer].join(' ')}>
            <strong>{message.role === 'user' ? 'You' : 'Bot'}:</strong>{' '}
            {message.type === 'html' ? (
              <iframe
                srcDoc={message.html}
                className={styles.htmlFrame}
                sandbox="allow-scripts allow-same-origin"
                style={{ width: '100%', minHeight: '200px', border: '1px solid #ccc', borderRadius: '4px' }}
                title="HTML Content"
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
            <div className={styles.loader}></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as any);
            }
          }}
          placeholder="Type your message..."
          disabled={isLoading}
          className={styles.textInput}
          rows={2}
          style={{ resize: 'vertical' }}
        />
        <button type="submit" disabled={!input.trim() || isLoading || messages.length >= 100} className={styles.sendButton}>
          <Send />
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
