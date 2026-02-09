import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Clipboard, ClipboardCheck } from "lucide-react";
import { useMemo, useState, memo } from "react";
import { Quantum } from 'ldrs/react'
import 'ldrs/react/Quantum.css'

import styles from "./Message.module.css"

import { getOutputFromChildren, getScriptContentFromChildren, hashString } from "@/lib/utility";
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
    userDisplay: string;
    assistantDisplay: string;
}

export default memo(function Message({
    message,
    userDisplay,
    assistantDisplay
}: Readonly<MessageProps>) {
    const [isCopied, setIsCopied] = useState(false);

    function handleCopy(copyText: string) {
        navigator.clipboard.writeText(copyText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }

    const markdownComponents = useMemo(() => ({
        code(props: any) {
            const { children, className } = props;
            const language = className?.includes('language-') ? className : '';
            const fallbackId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            const key = `code-${hashString(children || fallbackId)}`;
            if (children?.startsWith('<|TOOL_CODE_INTERPRETER|>')) {
                const text = children;
                const content = getScriptContentFromChildren(text.replace('<|TOOL_CODE_INTERPRETER|>', '').split('<|OUTPUT|>')[0].trim());
                const output = getOutputFromChildren(text.split('<|OUTPUT|>')[1]?.trim() || null);
                return (
                    <Callout
                        key={key}
                        title='Code Interpreter'
                        icon='SquareCode'
                        foldable
                        content={
                            <>
                                <button onClick={() => (content ? handleCopy(content) : true)} className={styles.copyButton}>
                                    {isCopied ? <ClipboardCheck size={18} /> : <Clipboard size={18} />}
                                </button>
                                <CodeHighlight className={`${language} hljs`}>{content}</CodeHighlight>
                                {(output.stdout || output.stderr || output.resultFiles.length > 0) ? (
                                    <Callout
                                        title='Code Interpreter Output'
                                        icon='List'
                                        foldable
                                        folded
                                        content={
                                            <div className={styles.outputContainer}>
                                                {output.stdout && <CodeHighlight className='hljs language-plaintext'>{output.stdout}</CodeHighlight>}
                                                {output.stderr && <CodeHighlight className={`hljs language-plaintext ${styles.stderr}`}>{output.stderr}</CodeHighlight>}
                                                {output.resultFiles.length > 0 && (
                                                    <div className={styles.resultFilesContainer}>
                                                        {output?.resultFiles.map((file) => (
                                                            <a key={file.targetFileName} className={styles.resultFile} href={file.url} target='_blank' rel='noopener noreferrer'>{file.originalFileName}</a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        }
                                    />
                                ) : (text.includes('<|OUTPUT|>') ? (
                                    // Loading indicator
                                    <div className={styles.loadingContainer}>
                                        <Quantum
                                            size="45"
                                            speed="1.75"
                                            color="black"
                                        />
                                    </div>
                                ) : null)}
                            </>
                        }
                    />
                );
            } else {
                const text = getScriptContentFromChildren(children);
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
        }
    }), [isCopied]);

    return (
        <div
            key={hashString(
                (message.type === 'html' ? message.html : message.content) + '|' + message.role + '|' + message.type
            )}
            className={[styles.message, message.role === 'user' ? styles.userMessageContainer : styles.botMessageContainer].join(' ')}
        >
            <strong>{message.role === 'user' ? userDisplay : assistantDisplay}:</strong>{' '}
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
