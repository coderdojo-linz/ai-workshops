import type React from "react";
import { Send } from "lucide-react";

import styles from "./ChatInputArea.module.css";

interface ChatInputAreaProps {
    inputRef: React.RefObject<HTMLTextAreaElement | null>;
    inputValue: string;
    setInputValue: React.Dispatch<React.SetStateAction<string>>;
    onSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
    messageCount: number;
}

export default function ChatInputArea({
    inputRef,
    inputValue,
    setInputValue,
    onSubmit,
    isLoading,
    messageCount
}: Readonly<ChatInputAreaProps>) {

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= 1000) {
            setInputValue(value);
        }
    };
    return (
        <div className={styles.wrapper}>
            <form onSubmit={onSubmit} className={styles.inputForm}>
                <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            onSubmit(e as any);
                        }
                    }}
                    placeholder="Schreibe deine Nachricht hier..."
                    disabled={isLoading}
                    className={styles.textInput}
                />
                <button type="submit" disabled={!inputValue.trim() || isLoading || messageCount >= 100} className={styles.sendButton}>
                    <Send />
                    {isLoading ? 'Wird gesendet...' : 'Senden'}
                </button>
            </form>

            <div className={styles.messageCounter}>
                {messageCount}/100 Nachrichten | {inputValue.length}/1000 Zeichen
            </div>
        </div>
    );
}
