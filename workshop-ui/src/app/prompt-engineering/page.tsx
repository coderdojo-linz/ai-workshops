'use client';

import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileCheck2, Send } from 'lucide-react';

export default function Home() {
  const router = useRouter();

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
        <h1 className={styles.exerciseTitle}>Dein eigener KI-Assistent</h1>
        <div className={styles.headerSpacer}></div>
      </div>

      {/* Content Area (Split into 3 Sub-Areas ) */}
      <div className={styles.content}>
        {/* System Prompt input */}
        <div>
          <textarea className={styles.systemPrompt} />
          <div>
            <button className={`${styles.sendButton} ${styles.applyButton}`}>
              <FileCheck2 />
              <span>Apply</span>
            </button>
            <div className={`${styles.messageCounter} ${styles.messageCounterSystemPrompt}`}>
              0/100 System prompts applied
            </div>
          </div>
        </div>
        {/* AI Bot */}
        <div>
          {/* Conversation History */}
          <div className={styles.messagesContainer}>Testing chat...</div>
          <div>
            <form className={styles.inputForm}>
              <textarea
                placeholder="Type your message..."
                className={styles.textInput}
                rows={1}
                style={{ resize: 'none' }}
              />
              <button type="submit" className={styles.sendButton}>
                <Send />
                <span>Send</span>
              </button>
            </form>
            {/* Message Counter */}
            <div className={styles.messageCounter}>
              0/100 messages | 0/1000 characters
            </div>
          </div>
        </div>

        <div className={`${styles.messagesContainer} ${styles.feedbackChat}`}>Feedback Chat...</div>
      </div>
    </div>
  );
} 