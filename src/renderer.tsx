import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { searchCommands, Command } from "./commandData";
// import Header from "./components/Header";
import SearchInput from "./components/SearchInput";
import SearchResults from "./components/SearchResults";
import "./index.css";

/**
 * TL;DR App - Alfred-style dark theme with dynamic resizing
 */
const App: React.FC = () => {
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<Command[]>([]);

  // ===============================
  // EVENT HANDLERS
  // ===============================
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearchActive(query.length > 0);

    if (query.trim()) {
      const results = searchCommands(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery);
    }
  };

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
        {/* <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden"> */}
        {/* Minimal padding around search - no separate header */}
        <div className="pt-2">
          <SearchInput
            searchQuery={searchQuery}
            isSearchActive={isSearchActive}
            onSearchChange={handleSearchChange}
            onSearchSubmit={handleSearchSubmit}
          />
        </div>

        <SearchResults
          searchResults={searchResults}
          searchQuery={searchQuery}
          isSearchActive={isSearchActive}
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
