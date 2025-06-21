import React from "react";

/**
 * Header Component - Alfred-style minimal header
 * Features: Cool icon, minimal text, dark theme
 */
function Header() {
  return (
    <div className="flex items-center justify-center py-4 px-6">
      {/* Cool terminal icon with gradient */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
          <span className="text-white text-lg font-bold">⚡</span>
        </div>
        <span className="text-gray-300 text-sm font-medium">TL;DR</span>
      </div>
    </div>
  );
}

export default Header;
