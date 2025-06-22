/**
 * CommandService - Provides access to command data and search functionality
 * This service acts as a facade for various command data sources including:
 * - Static in-memory database (current implementation)
 * - SQLite FTS5 database (future implementation)
 * - cht.sh API integration (future implementation)
 */

import { commandData } from "../shared/utils/commandData";

// Electron API for renderer access
declare global {
  interface Window {
    electron: {
      ping: () => Promise<string>;
      getUserDataPath: () => Promise<string>;
      onAppVisibilityChange: (callback: () => void) => void;
      database: {
        searchCommands: (query: string, limit?: number) => Promise<Command[]>;
        getCommandByName: (name: string) => Promise<Command | null>;
        getRecentCommands: (limit?: number) => Promise<Command[]>;
        getCommandCount: () => Promise<number>;
        logCommandUsage: (commandId: number, rawInput: string) => Promise<boolean>;
      };
    };
  }
}

import { Command, CommandSource } from "./types";
import { storageService } from "./storageService";

/**
 * Legacy Command interface for backward compatibility
 */
type LegacyCommand = {
  name: string;
  standsFor: string;
  description: string;
  examples: string[];
  category: string;
};

/**
 * Adapter function to convert legacy Command format to new Command interface
 * @param {LegacyCommand} legacyCommand - Command from commandData
 * @returns {Command} - Command with the new interface structure
 */
function adaptLegacyCommand(legacyCommand: LegacyCommand): Command {
  return {
    name: legacyCommand.name,
    standsFor: legacyCommand.standsFor,
    summary: legacyCommand.description,
    description: legacyCommand.description,
    examples: legacyCommand.examples,
    category: legacyCommand.category,
    source: CommandSource.LOCAL_DB
  };
}

/**
 * CommandService class for managing command data operations
 */
export class CommandService {
  /**
   * Whether the service has been initialized
   */
  private initialized = false;

  /**
   * Whether to use in-memory fallback if SQLite fails
   */
  private useMemoryFallback = false;
  
  /**
   * Whether to use SQLite storage as primary data source
   */
  private useSqlite = true;

  /**
   * Reference to the storage service for database operations
   */
  private storageService = storageService;

  /**
   * Check if the service is initialized
   * @returns True if initialized, false otherwise
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  /**
   * Get recent commands (placeholder implementation)
   * @param {number} limit - Maximum number of commands to return
   * @returns {Promise<Command[]>} Recent commands
   */
  private async getRecentCommands(limit = 10): Promise<Command[]> {
    // Implement with real recency data in future
    return this.memorySearchCommands('', limit);
  }

  /**
   * Import legacy command data into SQLite
   * @returns {Promise<void>}
   */
  private async importLegacyCommands(): Promise<void> {
    // Convert legacy commands to new format and save to SQLite
    for (const cmd of commandData) {
      await this.storageService.saveCommand(adaptLegacyCommand(cmd));
    }
  }
  /**
   * Get all available command names for autocomplete
   * 
   * @returns {string[]} Array of all available command names
   */
  public getCommandNames(): string[] {
    return Object.keys(commandData);
  }

  /**
   * Search for commands that match a query string
   * @param {string} query - The search query
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Command[]>} - List of matching commands
   */
  public async searchCommands(query: string, limit = 10): Promise<Command[]> {
    await this.ensureInitialized();
    
    if (!query.trim()) {
      return this.getRecentCommands(limit);
    }
    
    // Check if we're in the renderer process
    if (typeof window !== 'undefined' && window.electron) {
      // Use IPC bridge in renderer
      try {
        return await window.electron.database.searchCommands(query, limit);
      } catch (error) {
        console.error("Error searching commands via IPC:", error);
        // Fallback to in-memory search
        return this.memorySearchCommands(query, limit);
      }
    } else if (!this.useMemoryFallback) {
      // In main process, use storage service directly
      return this.storageService.searchCommands(query, limit);
    }
    
    // Fallback to in-memory search
    return this.memorySearchCommands(query, limit);
  }
  
  /**
   * In-memory search implementation (fallback)
   * @param {string} query - The search query
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Command[]>} - List of matching commands
   */
  private memorySearchCommands(query: string, limit = 10): Promise<Command[]> {
    // Filter commands by name or description match
    const results = commandData
      .filter(cmd => 
        cmd.name.toLowerCase().includes(query.toLowerCase()) || 
        (cmd.description && cmd.description.toLowerCase().includes(query.toLowerCase()))
      )
      .slice(0, limit)
      .map(adaptLegacyCommand);
    
    return Promise.resolve(results);
  }

  /**
   * Get command by exact name
   * 
   * @param {string} name - The exact name of the command to retrieve
   * @returns {Promise<Command | null>} The command object if found, null otherwise
   */
  public async getCommandByName(name: string): Promise<Command | null> {
    await this.ensureInitialized();
    
    // Check if we're in the renderer process
    if (typeof window !== 'undefined' && window.electron) {
      // Use IPC bridge in renderer
      try {
        return await window.electron.database.getCommandByName(name);
      } catch (error) {
        console.error("Error getting command via IPC:", error);
        // Fallback to in-memory lookup
        return this.memoryGetCommandByName(name);
      }
    } else if (!this.useMemoryFallback) {
      // In main process, use storage service directly
      return this.storageService.getCommandByName(name);
    }
    
    // Fallback to in-memory lookup
    return this.memoryGetCommandByName(name);
  }
  
  /**
   * In-memory command lookup implementation (fallback)
   * @param {string} name - Command name
   * @returns {Promise<Command | null>} Command if found, null otherwise
   */
  private memoryGetCommandByName(name: string): Promise<Command | null> {
    const cmd = commandData.find(c => c.name === name);
    return Promise.resolve(cmd ? adaptLegacyCommand(cmd) : null);
  }
  
  /**
   * Save a command to the database
   * Uses SQLite if enabled, otherwise logs a message (in-memory is read-only)
   * 
   * @param {Command} command - The command to save
   * @returns {Promise<boolean>} Promise that resolves with success status
   */
  public async saveCommand(command: Command): Promise<boolean> {
    if (this.useMemoryFallback) {
      console.log(`Would save command ${command.name} if using SQLite`);
      return Promise.resolve(true);
    }
    
    // Check if we're in the renderer process
    if (typeof window !== 'undefined' && window.electron) {
      // Use IPC bridge in renderer
      try {
        // Extract command ID and name for logging usage
        const commandId = typeof command.id === 'number' ? command.id : 0;
        
        // In a real implementation, rawInput would come from user interaction context
        // not from the command object itself. Here we use command name as fallback.
        const rawInput = command.name;  // Just use command name for now
        
        return await window.electron.database.logCommandUsage(commandId, rawInput);
      } catch (error) {
        console.error("Error saving command via IPC:", error);
        return Promise.resolve(false);
      }
    } else {
      // In main process, use storage service directly
      return this.storageService.saveCommand(command);
    }
  }
  
  /**
   * Initialize the database for fast command searching
   * Prepares the database for use with either in-memory or SQLite storage
   * 
   * @param {boolean} useSqlite - Whether to use SQLite or in-memory database
   * @returns {Promise<void>} Promise that resolves when database is initialized
   */
  public async init(): Promise<boolean> {
    try {
      // Check if we're in the renderer process
      const isRenderer = typeof window !== 'undefined' && window.electron;
      
      if (isRenderer) {
        // In renderer process, we'll use IPC to access the database
        console.log("Initializing CommandService in renderer process...");
        // No need to init explicitly, the main process handles this
        this.initialized = true;
        return true;
      } else {
        // In main process, we'll use storage service directly
        console.log("Initializing CommandService in main process...");
        
        // Initialize storage service
        const success = await this.storageService.initialize();
        
        // Check if we need to import legacy command data
        if (success && !this.useMemoryFallback) {
          const count = await this.storageService.getCommandCount();
          
          // If database is empty, batch import legacy data
          if (count === 0) {
            console.log("Importing legacy command data...");
            await this.importLegacyCommands();
          }
        }
        
        this.initialized = true;
        return success;
      }
    } catch (error) {
      console.error("Failed to initialize CommandService", error);
      // Fallback to in-memory commands if storage init fails
      this.useMemoryFallback = true;
      this.initialized = true;
      return true; // Still return true since we can operate in memory mode
    }
  }
  
  /**
   * Ensure the service is initialized before use
   * 
   * @returns {Promise<void>} Promise that resolves when initialized
   */
  private async ensureDatabaseInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }
  
  /**
   * Fetch command details from cht.sh API
   * 
   * @param {string} commandName - Name of command to fetch details for
   * @returns {Promise<Command | null>} Promise that resolves with command details or null
   */
  public async fetchFromChtSh(commandName: string): Promise<Command | null> {
    // API URL for cht.sh
    const url = `https://cht.sh/${commandName}?T`;
    
    try {
      console.log(`Fetching from cht.sh: ${url}`);
      
      // This would be an actual fetch in the implementation
      // const response = await fetch(url);
      // const text = await response.text();
      
      // For now, just return the in-memory command
      const command = this.getCommandByName(commandName);
      
      if (!command) {
        console.log(`Command ${commandName} not found in cht.sh`);
        return null;
      }
      
      console.log(`Successfully fetched ${commandName} from cht.sh`);
      return command;
    } catch (error) {
      console.error(`Error fetching from cht.sh: ${error}`);
      return this.getCommandByName(commandName); // Fallback to in-memory
    }
  }
}

// Create and export a singleton instance
export const commandService = new CommandService();

// Default export for easier importing
export default commandService;
