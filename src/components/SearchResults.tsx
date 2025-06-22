import * as React from "react";
import { useEffect } from "react";
import { Command } from "../commandData";
import CommandCard from "./CommandCard";

/**
 * Props for the SearchResults component
 */
interface SearchResultsProps {
  /** Array of command results matching the search query */
  searchResults: Command[];
  
  /** Current search query text */
  searchQuery: string;
  
  /** Whether search is currently active */
  isSearchActive: boolean;
}

/**
 * SearchResults component - Displays search results and handles dynamic window resizing
 * 
 * @param {SearchResultsProps} props - Component props
 * @returns {React.ReactElement | null} Rendered SearchResults component or null if search is not active
 */
function SearchResults({
  searchResults,
  searchQuery,
  isSearchActive,
}: SearchResultsProps): React.ReactElement | null {
  /**
   * Effect for dynamically resizing window based on search results
   * Adjusts window height based on number of visible results and width for long command names
   */
  useEffect(() => {
    /**
     * Calculates and sets appropriate window dimensions based on search results
     */
    const resizeWindow = (): void => {
      const baseHeight = 80; // Height with just the search bar (no separate header)
      const cardHeight = 140; // Height of each result card
      const maxCards = 4; // Maximum number of cards to display

      const visibleCards = Math.min(searchResults.length, maxCards);
      const totalHeight = baseHeight + visibleCards * cardHeight + 40; // 40px for padding

      // 30% wider minimum width: 600px * 1.3 = 780px
      const baseWidth = 780;
      const hasLongCommands = searchResults.some((cmd) => cmd.name.length > 10);
      const totalWidth = hasLongCommands ? baseWidth + 100 : baseWidth;

      window.electronAPI?.resizeWindow({
        width: totalWidth,
        height: Math.min(totalHeight, 600), // Cap at 600px height
      });
    };

    if (isSearchActive && searchResults.length > 0) {
      setTimeout(resizeWindow, 100);
    } else if (!isSearchActive) {
      // Reset to minimal size (also 30% wider)
      window.electronAPI?.resizeWindow({ width: 780, height: 80 }); // Much smaller when no results
    }
  }, [searchResults, isSearchActive]);

  if (!isSearchActive) {
    return null;
  }

  return (
    <div className="px-6 pb-6">
      {searchResults.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs text-gray-500 mb-3 text-center">
            {searchResults.length} found
          </div>

          {searchResults.slice(0, 4).map((command) => (
            <CommandCard key={command.name} command={command} />
          ))}

          {searchResults.length > 4 && (
            <div className="text-xs text-gray-500 text-center py-2">
              +{searchResults.length - 4} more results...
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-center text-sm">No commands found</p>
        </div>
      )}
    </div>
  );
}

export default SearchResults;
