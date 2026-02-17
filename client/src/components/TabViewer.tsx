import { useMemo } from 'react';

interface TabViewerProps {
    content: string;
}

export function TabViewer({ content }: TabViewerProps) {
    // We use useTranspose hook to get the transformed content string
    // But wait, the hook manages state. 
    // Actually, I designed the hook to take content and return transposed.
    // Let's adjust the usage.

    // My hook usage in previous thought was:
    // const { semitones, setSemitones, transposedContent } = useTranspose(content);
    // But here transpose is passed as prop. 
    // I should probably just expose the transpose logic as a helper or modify the hook to accept override.
    // OR, I just duplicate the hook logic here or use a modified hook.

    // Let's use the helper functions from useTranspose if I exported them? 
    // I didn't export them.

    // Let's re-implement the parsing here properly for rendering.
    // Instead of just returning a string, we want to return JSX elements to style [ch] differently.

    const lines = useMemo(() => {
        if (!content) return [];
        // Strip [tab] tags as they are sometimes malformed and pre tag handles monospace anyway
        return content.replace(/\[\/?tab\]/g, '').split('\n');
    }, [content]);

    return (
        <pre className="font-mono text-sm md:text-base leading-relaxed whitespace-pre-wrap text-gray-300">
            {lines.map((line, i) => (
                <Line key={i} text={line} />
            ))}
        </pre>
    );
}

function Line({ text }: { text: string }) {
    // Regex to split by [ch] tags
    const parts = text.split(/(\[ch\].*?\[\/ch\])/);

    return (
        <div className="min-h-[1.5em]">
            {parts.map((part, index) => {
                if (part.startsWith('[ch]')) {
                    const chord = part.replace(/\[\/?ch\]/g, '');
                    return (
                        <span key={index} className="text-purple-400 font-bold cursor-pointer hover:underline">
                            {chord}
                        </span>
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </div>
    );
}
