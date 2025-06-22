import * as React from "react";
import { useEffect, useRef } from "react";

/**
 * Props for the SearchInput component
 */
interface SearchInputProps {
  /** Current search query text */
  searchQuery: string;

  /** Whether search is currently active */
  isSearchActive: boolean;

  /** Handler for search input changes */
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  /** Handler for search form submission */
  onSearchSubmit: (e: React.FormEvent) => void;
}

/**
 * SearchInput component - Handles user input for command search
 *
 * @param {SearchInputProps} props - Component props
 * @returns {React.ReactElement} Rendered SearchInput component
 */
function SearchInput({
  searchQuery,
  isSearchActive,
  onSearchChange,
  onSearchSubmit,
}: SearchInputProps): React.ReactElement {
  // Reference to the search input element for auto-focus
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Effect for ESC key handling to hide the window
   */
  useEffect(() => {
    /**
     * Handle keydown events globally, focusing on ESC key for window hiding
     * @param {KeyboardEvent} e - Keyboard event
     */
    const handleKeyDown = (e: KeyboardEvent): void => {
      // ESC key handling temporarily disabled for development
      // To re-enable, uncomment these lines
      // if (e.key === "Escape") {
      //   e.preventDefault();
      //   e.stopPropagation();
      //   window.electronAPI?.hideWindow();
      // }

      // For debugging - capture all keyboard events
      console.log(`Key pressed: ${e.key}`);
    };

    // Add listener to window for global capture
    window.addEventListener("keydown", handleKeyDown, true); // true = capture phase

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  /**
   * Effect to auto-focus the search input when component mounts
   */
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="py-4 px-4">
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
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
                // ESC key handling at input level temporarily disabled for development
                // To re-enable, uncomment these lines
                // if (e.key === "Escape") {
                //   e.preventDefault();
                //   window.electronAPI?.hideWindow();
                // }
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
