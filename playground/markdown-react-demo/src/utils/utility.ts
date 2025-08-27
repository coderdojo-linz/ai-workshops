export function getTextFromChildren(children: React.ReactNode): string {
    if (typeof children === 'string') return children;
    if (Array.isArray(children)) {
        return children.map((c) => (typeof c === 'string' ? c : '')).join('');
    }
    return '';
}