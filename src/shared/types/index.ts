/**
 * Shared type definitions
 */

/**
 * Enum representing the source of command data
 */
export enum CommandSource {
  Memory = 'memory',      // In-memory static data
  Database = 'database',  // SQLite database
  API = 'api',            // External API (cht.sh)
  UserDefined = 'user'    // User-defined command
}

/**
 * Command interface representing a CLI command
 */
export interface Command {
  id?: number;            // Database ID (if from database)
  name: string;           // Command name (e.g., 'git')
  summary: string;        // Short summary description
  description?: string;   // Legacy field for backward compatibility
  category?: string;      // Command category (e.g., 'version control')
  standsFor?: string;     // What the command acronym stands for (e.g., 'GNU Interactive Tools')
  examples?: string[];    // Usage examples
  content?: string;       // Full markdown content (TLDR page)
  source?: CommandSource; // Source of the command data
}
