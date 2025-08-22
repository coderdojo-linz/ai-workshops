import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Clipboard, ClipboardCheck } from "lucide-react";
import { useMemo, useState, memo } from "react";

import styles from "./Message.module.css"

import { getTextFromChildren, hashString } from "@/lib/utility";
import Callout from "@/components/Callout";
import CodeHighlight from "@/components/CodeHighlight";

export type Message = TextMessage | HtmlMessage;

type TextMessage = {
    role: 'user' | 'assistant';
    content: string;
    type: 'text';
};

type HtmlMessage = {
    role: 'user' | 'assistant';
    html: string;
    type: 'html';
};

interface MessageProps {
    message: Message;
}

export default memo(function CurrentBotMessage({
    message
}: Readonly<MessageProps>) {
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

    return (
        <div
            key={hashString(
                (message.type === 'html' ? message.html : message.content) + '|' + message.role + '|' + message.type
            )}
            className={[styles.message, message.role === 'user' ? styles.userMessageContainer : styles.botMessageContainer].join(' ')}
        >
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
                <span className={message.role === 'user' ? styles.userMessage : styles.botMessage}>
                    <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{message.content}</Markdown>
                </span>
            )}
        </div>
    );
});
