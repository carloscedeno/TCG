import React from 'react';

interface ManaTextProps {
    text: string;
    className?: string; // For container styling
    symbolClassName?: string; // For additional symbol styling
}

const specialSymbols: Record<string, string> = {
    'T': 'tap',
    'Q': 'untap',
    'S': 's',
    'E': 'e',
    'PW': 'planeswalker',
    'CHAOS': 'chaos',
    'A': 'acorn',
    'X': 'x',
    'Y': 'y',
    'Z': 'z',
    'infinity': 'infinity',
    '1/2': '1-2',
    '∞': 'infinity',
    'TK': 'tk',
    'H': 'h',
    'W/P': 'wp', // Explicitly map if regex fails, but regex should cover.
    'U/P': 'up',
    'B/P': 'bp',
    'R/P': 'rp',
    'G/P': 'gp',
    'C': 'c'
};

export const ManaText: React.FC<ManaTextProps> = ({ text, className = '', symbolClassName = '' }) => {
    if (!text) return null;

    // Split by finding patterns like {W}, {1}, {2/W}, {T}, etc.
    const parts = text.split(/(\{.*?\})/g).filter(Boolean);

    return (
        <span className={className}>
            {parts.map((part, index) => {
                if (part.startsWith('{') && part.endsWith('}')) {
                    const content = part.slice(1, -1);
                    let symbolClass = content.toLowerCase().replace(/\//g, '');

                    // Handle special cases
                    if (specialSymbols[content]) {
                        symbolClass = specialSymbols[content];
                    }

                    // Determine if we should add ms-cost. 
                    // Usually valid for colors/numbers/X/Y/Z. 
                    // Tap/Untap usually don't need ms-cost as strictly but valid to add or they have their own style.
                    // Mana font 'ms-cost' adds the circle/shadow.
                    // Always add ms-cost for consistency unless we specifically find it breaks something else.
                    // Tap/Untap symbols DO need the cost circle in modern frames.
                    const costClass = 'ms-cost';

                    return (
                        <i
                            key={index}
                            className={`ms ms-${symbolClass} ${costClass} ${symbolClassName} mx-[1px] align-middle`}
                            title={part}
                            style={{ fontSize: '0.85em' }} // Slightly smaller to align with text usually
                        />
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
};
