import React, { useEffect, useRef } from "react";

interface SearchInputProps {
  searchQuery: string;
  isSearchActive: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
}

function SearchInput({
  searchQuery,
  isSearchActive,
  onSearchChange,
  onSearchSubmit,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Fix ESC key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log("Key pressed:", e.key); // Debug log
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        console.log("ESC pressed, hiding window"); // Debug log
        window.electronAPI?.hideWindow();
      }
    };

    // Add listener to window for global capture
    window.addEventListener("keydown", handleKeyDown, true); // true = capture phase

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  // Auto-focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="px-6 pb-2">
      <form onSubmit={onSearchSubmit}>
        <div className="flex items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-none">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Search commands..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              onKeyDown={(e) => {
                // Also handle ESC at input level
                if (e.key === "Escape") {
                  e.preventDefault();
                  window.electronAPI?.hideWindow();
                }
              }}
            />
          </div>

          {/* App Icon + Name - Right side, same height */}
          <div className="flex items-center gap-2 px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg">
            {/* Better terminal/command icon */}
            <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded flex items-center justify-center shadow-lg">
              <span className="text-white text-sm font-bold">$</span>
            </div>
            <span className="text-gray-300 text-sm font-medium whitespace-nowrap">
              TL;DR
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}

export default SearchInput;
