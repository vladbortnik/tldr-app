import React, { useEffect } from "react";
import { Command } from "../commandData";
import CommandCard from "./CommandCard";

interface SearchResultsProps {
  searchResults: Command[];
  searchQuery: string;
  isSearchActive: boolean;
}

function SearchResults({
  searchResults,
  searchQuery,
  isSearchActive,
}: SearchResultsProps) {
  // Dynamic resizing with 30% wider minimum width
  useEffect(() => {
    const resizeWindow = () => {
      const baseHeight = 80; // Reduced since no separate header
      const cardHeight = 140;
      const maxCards = 4;

      const visibleCards = Math.min(searchResults.length, maxCards);
      const totalHeight = baseHeight + visibleCards * cardHeight + 40;

      // 30% wider minimum width: 600px * 1.3 = 780px
      const baseWidth = 780; // Increased from 600px
      const hasLongCommands = searchResults.some((cmd) => cmd.name.length > 10);
      const totalWidth = hasLongCommands ? baseWidth + 100 : baseWidth;

      window.electronAPI?.resizeWindow({
        width: totalWidth,
        height: Math.min(totalHeight, 600),
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
