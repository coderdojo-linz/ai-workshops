import { Message as MessageType } from '@/components/chat/Message'

export function getTextFromChildren(children: React.ReactNode): string {
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
                console.debug('Returning parsed children:', json.script);
                return json.script;
            }
        } catch {
            try {
                // Not a JSON string, try to parse first part
                const json = JSON.parse(text + '"}');
                if (json && typeof json.script === 'string') {
                    console.debug('Returning parsed children:', json.script);
                    return json.script;
                }
            } catch {
                console.debug('Failed to parse children as JSON:', children + '"}');
                console.debug('Returning original children:', children);
            }
        }
        return children;
    }
    if (Array.isArray(children)) {
        return children.map((c) => (typeof c === 'string' ? c : '')).join('');
    }
    return '';
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