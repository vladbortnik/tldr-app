/**
 * StorageService - Provides persistent storage capabilities for the application
 * Manages data storage and retrieval operations for commands
 */

import { Command, CommandSource } from './types';
import { sqliteCommandStorage } from './db/CommandStorage';

/**
 * Interface for database operations
 * Defines the contract that any database implementation must follow
 */
export interface ICommandStorage {
  /**
   * Initialize the storage system
   * @returns {Promise<boolean>} Promise that resolves when initialization is complete
   */
  initialize(): Promise<boolean>;
  
  /**
   * Search commands by query
   * @param {string} query - The search query
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Command[]>} Promise that resolves with matching commands
   */
  searchCommands(query: string, limit?: number): Promise<Command[]>;
  
  /**
   * Get recent commands
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Command[]>} Recent commands
   */
  getRecentCommands(limit?: number): Promise<Command[]>;
  
  /**
   * Get a command by its name
   * @param {string} name - The command name
   * @returns {Promise<Command | null>} Promise that resolves with the command or null
   */
  getCommandByName(name: string): Promise<Command | null>;
  
  /**
   * Save a command to storage
   * @param {Command} command - The command to save
   * @returns {Promise<boolean>} Promise that resolves with success status
   */
  saveCommand(command: Command): Promise<boolean>;
  
  /**
   * Get command content
   * @param {number} commandId - Command ID
   * @param {string} contentType - Content type
   * @returns {Promise<string|null>} Command content
   */
  getCommandContent(commandId: number, contentType?: string): Promise<string|null>;
  
  /**
   * Save command content
   * @param {number} commandId - Command ID
   * @param {string} content - Content to save
   * @param {string} contentType - Content type
   * @param {string} format - Content format
   * @returns {Promise<boolean>} Success status
   */
  saveCommandContent(
    commandId: number,
    content: string,
    contentType?: string,
    format?: string
  ): Promise<boolean>;
  
  /**
   * Log command usage
   * @param {number} commandId - Command ID
   * @param {string} rawInput - User input
   * @returns {Promise<boolean>} Success status
   */
  logCommandUsage(commandId: number, rawInput: string): Promise<boolean>;
  
  /**
   * Import commands in bulk
   * @param {Command[]} commands - Commands to import
   * @returns {Promise<number>} Number of commands imported
   */
  importCommands(commands: Command[]): Promise<number>;
  
  /**
   * Get command count
   * @returns {Promise<number>} Number of commands
   */
  getCommandCount(): Promise<number>;
}

/**
 * In-memory storage implementation for development and testing
 * Used as a fallback when SQLite is not desired
 */
export class MemoryCommandStorage implements ICommandStorage {
  private commands: Command[] = [];
  private contentStore: Map<string, string> = new Map();
  private history: {commandId: number, rawInput: string}[] = [];
  
  /**
   * Initialize memory storage
   * @returns {Promise<boolean>} Promise that resolves when initialized
   */
  public async initialize(): Promise<boolean> {
    console.log('In-memory command storage initialized');
    return true;
  }
  
  /**
   * Search commands in memory
   * @param {string} query - The search query
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Command[]>} Matching commands
   */
  public async searchCommands(query: string, limit: number = 10): Promise<Command[]> {
    if (!query.trim()) {
      return this.getRecentCommands(limit);
    }
    
    const lowerQuery = query.toLowerCase();
    const results = this.commands.filter(cmd => {
      return (
        cmd.name.toLowerCase().includes(lowerQuery) ||
        (cmd.summary && cmd.summary.toLowerCase().includes(lowerQuery)) ||
        (cmd.standsFor && cmd.standsFor.toLowerCase().includes(lowerQuery)) ||
        (cmd.examples && cmd.examples.some(ex => ex.toLowerCase().includes(lowerQuery)))
      );
    });
    
    return results.slice(0, limit);
  }
  
  /**
   * Get recent commands
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Command[]>} Recent commands
   */
  public async getRecentCommands(limit: number = 10): Promise<Command[]> {
    // Return first N commands as "recent"
    return this.commands.slice(0, limit);
  }
  
  /**
   * Get a command by name from memory
   * @param {string} name - The command name
   * @returns {Promise<Command | null>} The command or null
   */
  public async getCommandByName(name: string): Promise<Command | null> {
    const command = this.commands.find(c => c.name === name);
    return command || null;
  }
  
  /**
   * Save a command to memory
   * @param {Command} command - The command to save
   * @returns {Promise<boolean>} Success indicator
   */
  public async saveCommand(command: Command): Promise<boolean> {
    const index = this.commands.findIndex(c => c.name === command.name);
    
    if (index >= 0) {
      this.commands[index] = { ...command, id: this.commands[index].id };
    } else {
      const id = this.commands.length > 0 
        ? Math.max(...this.commands.map(c => c.id || 0)) + 1
        : 1;
      
      this.commands.push({ ...command, id, source: CommandSource.Memory });
    }
    
    return true;
  }
  
  /**
   * Get command content
   * @param {number} commandId - Command ID
   * @param {string} contentType - Content type
   * @returns {Promise<string|null>} Command content
   */
  public async getCommandContent(commandId: number, contentType: string = 'tldr'): Promise<string|null> {
    const key = `${commandId}:${contentType}`;
    return this.contentStore.get(key) || null;
  }
  
  /**
   * Save command content
   * @param {number} commandId - Command ID
   * @param {string} content - Content to save
   * @param {string} contentType - Content type
   * @param {string} format - Content format
   * @returns {Promise<boolean>} Success status
   */
  public async saveCommandContent(
    commandId: number,
    content: string,
    contentType: string = 'tldr',
    format: string = 'markdown'
  ): Promise<boolean> {
    const key = `${commandId}:${contentType}`;
    this.contentStore.set(key, content);
    return true;
  }
  
  /**
   * Log command usage
   * @param {number} commandId - Command ID
   * @param {string} rawInput - User input
   * @returns {Promise<boolean>} Success status
   */
  public async logCommandUsage(commandId: number, rawInput: string): Promise<boolean> {
    this.history.push({ commandId, rawInput });
    return true;
  }
  
  /**
   * Import commands in bulk
   * @param {Command[]} commands - Commands to import
   * @returns {Promise<number>} Number of commands imported
   */
  public async importCommands(commands: Command[]): Promise<number> {
    for (const command of commands) {
      await this.saveCommand(command);
    }
    return commands.length;
  }
  
  /**
   * Get command count
   * @returns {Promise<number>} Number of commands
   */
  public async getCommandCount(): Promise<number> {
    return this.commands.length;
  }
}

/**
 * Storage service factory and singleton
 * Provides access to the command storage implementation
 */
export class StorageService {
  private static instance: StorageService;
  private storage: ICommandStorage;
  private isDev = process.env.NODE_ENV === 'development';
  
  /**
   * Private constructor to enforce singleton
   * @param {ICommandStorage} storage - The storage implementation to use
   */
  private constructor(storage: ICommandStorage) {
    this.storage = storage;
  }
  
  /**
   * Get the singleton instance
   * @param {boolean} useMemoryStorage - Force using memory storage (for testing)
   * @returns {StorageService} The singleton instance
   */
  public static getInstance(useMemoryStorage = false): StorageService {
    if (!StorageService.instance) {
      // Choose storage implementation based on environment
      const isDevEnv = process.env.NODE_ENV === 'development';
      const useMemory = useMemoryStorage || (isDevEnv && process.env.USE_MEMORY_DB === 'true');
      
      if (useMemory) {
        console.log('Using in-memory storage for commands');
        StorageService.instance = new StorageService(new MemoryCommandStorage());
      } else {
        console.log('Using SQLite storage for commands');
        StorageService.instance = new StorageService(sqliteCommandStorage);
      }
    }
    return StorageService.instance;
  }
  
  /**
   * Initialize storage
   * @returns {Promise<boolean>} Promise that resolves when initialization is complete
   */
  public async initialize(): Promise<boolean> {
    return this.storage.initialize();
  }
  
  /**
   * Search commands
   * @param {string} query - The search query
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Command[]>} Promise that resolves with matching commands
   */
  public async searchCommands(query: string, limit = 10): Promise<Command[]> {
    return this.storage.searchCommands(query, limit);
  }
  
  /**
   * Get a command by name
   * @param {string} name - The command name
   * @returns {Promise<Command | null>} Promise that resolves with the command or null
   */
  public async getCommandByName(name: string): Promise<Command | null> {
    return this.storage.getCommandByName(name);
  }
  
  /**
   * Save a command
   * @param {Command} command - The command to save
   * @returns {Promise<boolean>} Promise that resolves with success status
   */
  public async saveCommand(command: Command): Promise<boolean> {
    return this.storage.saveCommand(command);
  }
  
  /**
   * Get recent commands
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Command[]>} Promise that resolves with recent commands
   */
  public async getRecentCommands(limit = 10): Promise<Command[]> {
    return this.storage.getRecentCommands(limit);
  }
  
  /**
   * Get command content
   * @param {number} commandId - Command ID
   * @param {string} contentType - Content type
   * @returns {Promise<string|null>} Command content
   */
  public async getCommandContent(commandId: number, contentType = 'tldr'): Promise<string|null> {
    return this.storage.getCommandContent(commandId, contentType);
  }
  
  /**
   * Save command content
   * @param {number} commandId - Command ID
   * @param {string} content - Content to save
   * @param {string} contentType - Content type
   * @param {string} format - Content format
   * @returns {Promise<boolean>} Success status
   */
  public async saveCommandContent(
    commandId: number,
    content: string,
    contentType = 'tldr',
    format = 'markdown'
  ): Promise<boolean> {
    return this.storage.saveCommandContent(commandId, content, contentType, format);
  }
  
  /**
   * Log command usage
   * @param {number} commandId - Command ID
   * @param {string} rawInput - User input
   * @returns {Promise<boolean>} Success status
   */
  public async logCommandUsage(commandId: number, rawInput: string): Promise<boolean> {
    return this.storage.logCommandUsage(commandId, rawInput);
  }
  
  /**
   * Import commands in bulk
   * @param {Command[]} commands - Commands to import
   * @returns {Promise<number>} Number of commands imported
   */
  public async importCommands(commands: Command[]): Promise<number> {
    return this.storage.importCommands(commands);
  }
  
  /**
   * Get command count
   * @returns {Promise<number>} Number of commands
   */
  public async getCommandCount(): Promise<number> {
    return this.storage.getCommandCount();
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();

// Default export for easier importing
export default storageService;
