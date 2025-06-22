import * as React from "react";
import SearchInput from "./SearchInput";
import SearchResults from "./SearchResults";
import { Command } from "@services/index";

/**
 * Props for the AppContainer component
 */
interface AppContainerProps {
  /** Current search query text */
  searchQuery: string;
  
  /** Whether search is currently active */
  isSearchActive: boolean;
  
  /** Current search results based on query */
  searchResults: Command[];
  
  /** Handler for search input changes */
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
  /** Handler for search form submission */
  onSearchSubmit: (e: React.FormEvent) => void;
}

/**
 * AppContainer component - Main UI container for the application
 * Provides the visual structure and layout for the search interface
 * 
 * @param {AppContainerProps} props - Component props
 * @returns {React.ReactElement} Rendered AppContainer component
 */
const AppContainer = ({
  searchQuery,
  isSearchActive,
  searchResults,
  onSearchChange,
  onSearchSubmit
}: AppContainerProps): React.ReactElement => {
  // Container with border and styling
  return (
    <div className="border border-gray-700 rounded-xl shadow-2xl overflow-hidden bg-gray-900">
      <SearchInput
        searchQuery={searchQuery}
        isSearchActive={isSearchActive}
        onSearchChange={onSearchChange}
        onSearchSubmit={onSearchSubmit}
      />
      
      <SearchResults
        searchResults={searchResults}
        searchQuery={searchQuery}
        isSearchActive={isSearchActive}
      />
    </div>
  );
};

export default AppContainer;
