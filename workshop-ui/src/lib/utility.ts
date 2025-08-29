import { ResultFile } from '@/app/api/chat/codeExecutionTool';
import { Message as MessageType } from '@/components/chat/Message'

export function getScriptContentFromChildren(children: React.ReactNode): string {
    if (typeof children === 'string') {
        let text: string = children;
        // 2 gimmicks
        // 1. Remove newlines
        text = text.replaceAll('\n', '');
        // 2. Remove single backslash at end of string
        text = text.replace(/\\$/, '');

        // if children is a JSON object {"script":"<string>"}, only use the inner string.
        try {
            const json = JSON.parse(text);
            if (json && typeof json.script === 'string') {
                return json.script;
            }
        } catch {
            try {
                // Not a JSON string, try to parse first part
                const json = JSON.parse(text + '"}');
                if (json && typeof json.script === 'string') {
                    return json.script;
                }
            } catch {
                return children;
            }
        }
    }
    if (Array.isArray(children)) {
        return children.map((c) => (typeof c === 'string' ? c : '')).join('');
    }
    return '';
}

type OutputType = {
    stdout: string;
    stderr: string;
    resultFiles: ResultFile[];
};


export function getOutputFromChildren(children: any): OutputType {
    if (typeof children === 'string') {
        let text: string = children;
        // 2 gimmicks
        // 1. Remove newlines
        text = text.replaceAll('\n', '');
        // 2. Remove single backslash at end of string
        text = text.replace(/\\$/, '');

        // if children is a JSON object {"stdout":"<string>", "stderr":"<string>", result_files:[...]}, only use the inner string.
        try {
            const json = JSON.parse(text);
            if (json && (typeof json.stdout === 'string' || typeof json.stderr === 'string')) {
                return { stdout: json.stdout || '', stderr: json.stderr || '', resultFiles: json.resultFiles || [] };
            }
        } catch {}
    }
    return { stdout: '', stderr: '', resultFiles: [] };
}

// Stable code renderer for Markdown so Callout instances keep identity across unrelated re-renders
export function hashString(str: string) {
    // Simple djb2 hash for stable keys
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    // Convert to positive 32-bit and base36 for compactness
    return (hash >>> 0).toString(36);
};

export function hashMessage(message: MessageType): string {
    return hashString((message.type === 'html' ? message.html : message.content) + '|' + message.role + '|' + message.type);
}