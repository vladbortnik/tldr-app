/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Modern TL;DR App component with search functionality
const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearchActive(query.length > 0);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery);
      // TODO: Add search logic here
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-start justify-center pt-8 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⚡</span>
            <h1 className="text-2xl font-bold text-gray-800">TL;DR Command Helper</h1>
          </div>
          <p className="text-gray-600 text-sm">
            Type a shell command to get quick examples and explanations
          </p>
        </div>

        {/* Search Form */}
        <div className="p-6">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Enter a shell command (e.g., ls, grep, find)..."
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                autoFocus
              />
              {isSearchActive && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-gray-400 text-sm">Press Enter</span>
                </div>
              )}
            </div>
            
            {/* Search Stats */}
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>
                {searchQuery.length > 0 ? `Searching for "${searchQuery}"` : "Ready to search commands"}
              </span>
              <span>Global hotkey: Cmd+Alt+Space</span>
            </div>
          </form>
        </div>

        {/* Results Area (Placeholder) */}
        {isSearchActive && (
          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-600 text-center">
                🔍 Search functionality coming next...
                <br />
                <span className="text-sm">Query: "{searchQuery}"</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Mount React app to DOM
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
