/**
 * Application type definitions
 * Contains interfaces and types used across the application
 */

/**
 * Command interface representing a command and its details
 */
export interface Command {
  /** Unique identifier for the command */
  id?: number;
  
  /** The command name/identifier */
  name: string;
  
  /** What the abbreviation means or origin of command name */
  standsFor: string;
  
  /** Short summary of the command */
  summary: string;
  
  /** Description of what the command does */
  description: string;
  
  /** Usage examples for the command */
  examples: string[];
  
  /** Category the command belongs to */
  category: string;
  
  /** TLDR-formatted content for the command */
  content?: string;
  
  /** Source of the command data */
  source?: CommandSource;
}

/**
 * CommandSource enum for tracking where command data originated
 */
export enum CommandSource {
  /** Command data from local static database */
  LOCAL_DB = 'local_db',
  
  /** Command data from SQLite FTS5 database */
  SQLITE = 'sqlite',
  
  /** Command data from cht.sh API */
  CHT_SH = 'cht_sh',
  
  /** Command data from in-memory storage (development) */
  Memory = 'memory',
  
  /** Command data from SQL database */
  Database = 'database'
}
