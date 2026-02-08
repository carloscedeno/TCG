import { useState, useEffect, useRef } from 'react';
import { searchCardNames } from '../../utils/api';

interface SearchBarProps {
  onSelect?: (card: any) => void;
  placeholder?: string;
  mobile?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export function SearchBar({ onSelect, placeholder, mobile = false, value = "", onChange }: SearchBarProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLFormElement>(null);

  // Mobile prop ignored for now to satisfy lint if not used in JSX
  if (mobile) { /* placeholder for mobile styles */ }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value || value.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const results = await searchCardNames(value);
        setSuggestions(results);

        // Hide if exact match and it is the only result (UX preference to avoid re-popup after select)
        const isExactMatch = results.some(r => r.toLowerCase() === value.toLowerCase());
        if (isExactMatch && results.length === 1) {
          setShowSuggestions(false);
        } else {
          setShowSuggestions(true);
        }
      } catch (e) {
        console.error("Autocomplete fetch error", e);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleSelect = (suggestion: string) => {
    if (onChange) onChange(suggestion);
    if (onSelect) onSelect({ name: suggestion });
    setShowSuggestions(false);
  };

  return (
    <form ref={containerRef} className="relative w-full max-w-md" role="search" onSubmit={e => e.preventDefault()}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-neutral-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
        </svg>
      </div>
      <input
        id="search-input"
        type="text"
        className="block w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-full text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-neutral-500"
        placeholder={placeholder || 'Search cards, sets...'}
        value={value}
        onChange={e => onChange && onChange(e.target.value)}
        onFocus={() => {
          if (value && value.length >= 2) setShowSuggestions(true);
        }}
        autoComplete="off"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-neutral-900/90 backdrop-blur-md border border-neutral-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </form>
  );
};