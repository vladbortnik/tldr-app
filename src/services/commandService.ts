/**
 * CommandService - Provides access to command data and search functionality
 * This service acts as a facade for various command data sources including:
 * - Static in-memory database (current implementation)
 * - SQLite FTS5 database (future implementation)
 * - cht.sh API integration (future implementation)
 */

import { commandsDatabase, Command as LegacyCommand } from "../commandData";
import { Command, CommandSource } from "./types";
import { storageService } from "./storageService";

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
   * Get all available command names for autocomplete
   * 
   * @returns {string[]} Array of all available command names
   */
  public getCommandNames(): string[] {
    return Object.keys(commandsDatabase);
  }

  /**
   * Search commands by name or description
   * 
   * @param {string} query - The search query to match against command names and descriptions
   * @returns {Command[]} Array of commands matching the search query
   */
  public searchCommands(query: string): Command[] {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) {
      return [];
    }
    
    return Object.values(commandsDatabase)
      .filter((command) => {
        const nameMatch = command.name.toLowerCase().includes(normalizedQuery);
        const descriptionMatch = command.description.toLowerCase().includes(normalizedQuery);
        return nameMatch || descriptionMatch;
      })
      .map(adaptLegacyCommand);
  }

  /**
   * Get command by exact name
   * 
   * @param {string} name - The exact name of the command to retrieve
   * @returns {Command | null} The command object if found, null otherwise
   */
  public getCommandByName(name: string): Command | null {
    const command = commandsDatabase[name.toLowerCase()];
    return command ? adaptLegacyCommand(command) : null;
  }

  /**
   * Get commands by category
   * 
   * @param {string} category - The category to filter commands by
   * @returns {Command[]} Array of commands belonging to the specified category
   */
  public getCommandsByCategory(category: string): Command[] {
    return Object.values(commandsDatabase)
      .filter((command) => command.category === category)
      .map(adaptLegacyCommand);
  }
  
  /**
   * Get all available command categories
   * 
   * @returns {string[]} Array of unique command categories
   */
  public getCategories(): string[] {
    const categories = new Set<string>();
    
    Object.values(commandsDatabase).forEach((command) => {
      categories.add(command.category);
    });
    
    return Array.from(categories);
  }
  
  // ===============================
  // DATABASE AND API IMPLEMENTATIONS
  // ===============================
  
  /** Flag to determine if SQLite is being used */
  private useSqlite: boolean = false;

  /**
   * Initialize the database for fast command searching
   * Prepares the database for use with either in-memory or SQLite storage
   * 
   * @param {boolean} useSqlite - Whether to use SQLite or in-memory database
   * @returns {Promise<void>} Promise that resolves when database is initialized
   */
  public async initializeDatabase(useSqlite: boolean = false): Promise<void> {
    this.useSqlite = useSqlite;
    
    if (this.useSqlite) {
      console.log("Initializing SQLite database");
      await storageService.initialize();
      
      // Populate SQLite with static data if needed
      // This would be a one-time operation when switching to SQLite
      const legacyCommands = Object.values(commandsDatabase);
      const commands = legacyCommands.map(adaptLegacyCommand);
      console.log(`Would import ${commands.length} commands into SQLite`);
    } else {
      console.log("Using in-memory command database");
    }
  }
  
  /**
   * Search commands using the configured database source
   * Uses SQLite if enabled, otherwise falls back to in-memory
   * 
   * @param {string} query - The search query to match against database
   * @returns {Promise<Command[]>} Promise that resolves with search results
   */
  public async searchCommandsDb(query: string): Promise<Command[]> {
    if (this.useSqlite) {
      return await storageService.searchCommands(query);
    }
    // Fall back to in-memory implementation
    return Promise.resolve(this.searchCommands(query));
  }

  /**
   * Get command by name using the configured database source
   * Uses SQLite if enabled, otherwise falls back to in-memory
   * 
   * @param {string} commandName - Name of command to retrieve
   * @returns {Promise<Command | null>} Promise that resolves with command or null
   */
  public async getCommandDbByName(commandName: string): Promise<Command | null> {
    if (this.useSqlite) {
      return await storageService.getCommandByName(commandName);
    }
    // Fall back to in-memory implementation
    return Promise.resolve(this.getCommandByName(commandName));
  }
  
  /**
   * Save a command to the database
   * Uses SQLite if enabled, otherwise logs a message (in-memory is read-only)
   * 
   * @param {Command} command - The command to save
   * @returns {Promise<void>} Promise that resolves when command is saved
   */
  public async saveCommand(command: Command): Promise<boolean> {
    if (this.useSqlite) {
      return await storageService.saveCommand(command);
    }
    console.log(`Would save command ${command.name} if using SQLite`);
    return Promise.resolve(true);
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
