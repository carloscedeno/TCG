import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder }) => (
  <form className="relative w-full max-w-md" role="search" onSubmit={e => e.preventDefault()}>
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
      onChange={e => onChange(e.target.value)}
      autoComplete="off"
    />
  </form>
);