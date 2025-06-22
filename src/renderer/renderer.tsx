import * as React from "react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Command, commandService } from "@services/index";
import AppContainer from "./components/AppContainer";
import "./index.css";

/**
 * TL;DR App - Alfred-style dark theme with dynamic resizing
 * Main application component that coordinates search functionality and UI
 * 
 * @returns {React.ReactElement} Rendered App component
 */
const App = (): React.ReactElement => {
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  /** Current search query text input */
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  /** Whether search is currently active (has input) */
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  
  /** Current search results based on query */
  const [searchResults, setSearchResults] = useState<Command[]>([]);

  // ===============================
  // EVENT HANDLERS
  // ===============================
  /**
   * Handles changes to the search input
   * Updates search query state and performs search
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Change event from search input
   */
  /**
   * Handles changes to the search input
   * Updates search query state and performs search
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Change event from search input
   */
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearchActive(query.length > 0);

    if (query.trim()) {
      // Using async/await with try/catch for better error handling
      try {
        const results = await commandService.searchCommands(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching commands:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  /**
   * Handles search form submission
   * Prevents default form submission behavior and logs search query
   * 
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSearchSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // In future versions, this could trigger more advanced search or command execution
    }
  };

  // ===============================
  // RENDER
  // ===============================
  return (
    // Simple container with fixed height and no scrolling - full window width
    <div className="bg-gray-900 text-gray-100">
      <div className="w-full">
        <AppContainer
          searchQuery={searchQuery}
          isSearchActive={isSearchActive}
          searchResults={searchResults}
          onSearchChange={handleSearchChange}
          onSearchSubmit={handleSearchSubmit}
        />
      </div>
    </div>
  );
};

// ===============================
// APP INITIALIZATION
// ===============================
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
