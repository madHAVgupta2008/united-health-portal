import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';

interface MessageFormatterProps {
    content: string;
    sender: 'user' | 'bot';
}

export const MessageFormatter: React.FC<MessageFormatterProps> = ({ content, sender }) => {
    const [copied, setCopied] = React.useState(false);

    // Simple Markdown parser
    // Handles: **bold**, *italic*, - lists, and line breaks
    const formatText = (text: string) => {
        // Split by newlines first to handle list items and paragraphs
        const lines = text.split('\n');

        return lines.map((line, lineIndex) => {
            // Handle list items
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                const listContent = line.trim().substring(2);
                return (
                    <div key={lineIndex} className="flex gap-2 mb-1 ml-2">
                        <span className="text-current opacity-70">•</span>
                        <span>{parseInline(listContent)}</span>
                    </div>
                );
            }

            // Handle empty lines (paragraph breaks)
            if (!line.trim()) {
                return <div key={lineIndex} className="h-2" />;
            }

            // Standard paragraph
            return (
                <p key={lineIndex} className="mb-1 last:mb-0 leading-relaxed">
                    {parseInline(line)}
                </p>
            );
        });
    };

    // Helper to parse inline styles (bold, italic)
    const parseInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={index} className="italic">{part.slice(1, -1)}</em>;
            }
            return part;
        });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn(
            "relative group",
            sender === 'bot' ? "text-sm" : "text-sm font-medium"
        )}>
            {formatText(content)}

            {sender === 'bot' && (
                <button
                    onClick={handleCopy}
                    className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground"
                    title="Copy response"
                >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
            )}
        </div>
    );
};
