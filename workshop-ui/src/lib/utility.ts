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