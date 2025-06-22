import * as React from "react";
import { useState } from "react";
import { Command } from "../services";

/**
 * Props for the CommandCard component
 */
interface CommandCardProps {
  /** Command object to display */
  command: Command;
  
  /** Optional click handler */
  onClick?: () => void;
}

/**
 * CommandCard Component - Alfred-style dark card with minimal design
 * Displays command information in an expandable card format
 * 
 * @param {CommandCardProps} props - Component props
 * @returns {React.ReactElement} Rendered CommandCard component
 */
function CommandCard({ command, onClick }: CommandCardProps): React.ReactElement {
  /** State to track if the card is expanded to show all examples */
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  /**
   * Handles click event on the card
   * Toggles expanded state and calls optional onClick handler
   */
  const handleCardClick = (): void => {
    setIsExpanded(!isExpanded);
    if (onClick) {
      onClick();
    }
  };

  const examplesToShow = isExpanded
    ? command.examples
    : command.examples.slice(0, 2); // Show fewer examples for minimal design

  return (
    <div
      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 hover:bg-gray-750 transition-all cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Command Header - Minimal design */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-blue-400 text-xl font-mono font-bold">
          {command.name}
        </span>
        <span className="text-gray-500 text-sm italic flex-1">
          {command.standsFor}
        </span>
        {/* Expand indicator */}
        <span className="text-gray-600 text-xs">{isExpanded ? "↑" : "↓"}</span>
      </div>

      {/* Command Description */}
      <p className="text-gray-300 text-sm mb-3 leading-relaxed">
        {command.description}
      </p>

      {/* Examples */}
      <div className="space-y-1">
        {examplesToShow.map((example, index) => (
          <div
            key={index}
            className="bg-gray-900 rounded p-2 font-mono text-xs text-green-400 border border-gray-700"
          >
            $ {example}
          </div>
        ))}

        {!isExpanded && command.examples.length > 2 && (
          <div className="text-xs text-gray-500 text-center py-1">
            +{command.examples.length - 2} more
          </div>
        )}
      </div>
    </div>
  );
}

export default CommandCard;
