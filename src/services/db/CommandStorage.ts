/**
 * CommandStorage - Command-specific database operations
 * Implements ICommandStorage interface for the CommandService
 */

import { Command, CommandSource } from "../types";
import { ICommandStorage } from "../storageService";
import { databaseService, DbResult } from "./DatabaseService";

/**
 * Interface for command results from database
 */
interface CommandRow {
  id: number;
  name: string;
  stands_for?: string;
  summary: string;
  category?: string;
  examples?: string;
  tldr_content?: string;
}

/**
 * SQLite implementation of command storage
 * Handles all command-related database operations
 */
export class SQLiteCommandStorage implements ICommandStorage {
  /**
   * Initialize command storage
   * @returns {Promise<boolean>} Success indicator
   */
  public async initialize(): Promise<boolean> {
    // Initialize database
    return await databaseService.initialize();
  }

  /**
   * Search for commands using FTS5 full-text search
   *
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Command[]>} Matching commands
   */
  public async searchCommands(
    query: string,
    limit: number = 10
  ): Promise<Command[]> {
    try {
      // Clean the query for FTS5 search
      const cleanQuery = this.sanitizeFtsQuery(query);

      // If query is empty, return recent commands
      if (!cleanQuery) {
        return this.getRecentCommands(limit);
      }

      // Search using FTS5 virtual table
      const result = await databaseService.all<CommandRow>(
        `
        SELECT 
          c.id,
          c.name,
          c.stands_for,
          c.summary,
          cat.name AS category,
          (SELECT GROUP_CONCAT(example, '\n') FROM command_examples WHERE command_id = c.id) AS examples,
          (SELECT content FROM command_content 
           WHERE command_id = c.id 
           AND content_type_id = (SELECT id FROM content_types WHERE name = 'tldr') 
           LIMIT 1) AS tldr_content
        FROM commands c
        JOIN command_search s ON c.id = s.rowid
        LEFT JOIN categories cat ON c.category_id = cat.id
        WHERE command_search MATCH ?
        ORDER BY rank
        LIMIT ?
      `,
        [cleanQuery, limit]
      );

      return result.success ? this.rowsToCommands(result.data || []) : [];
    } catch (error) {
      console.error("Error searching commands:", error);
      return [];
    }
  }

  /**
   * Get recently accessed commands
   *
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Command[]>} Recent commands
   */
  public async getRecentCommands(limit: number = 10): Promise<Command[]> {
    try {
      const result = await databaseService.all<CommandRow>(
        `
        SELECT 
          c.id,
          c.name,
          c.stands_for,
          c.summary,
          cat.name AS category,
          (SELECT GROUP_CONCAT(example, '\n') FROM command_examples WHERE command_id = c.id) AS examples,
          (SELECT content FROM command_content 
           WHERE command_id = c.id 
           AND content_type_id = (SELECT id FROM content_types WHERE name = 'tldr')
           LIMIT 1) AS tldr_content
        FROM commands c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN command_history h ON c.id = h.command_id
        GROUP BY c.id
        ORDER BY MAX(h.timestamp) DESC, c.name ASC
        LIMIT ?
      `,
        [limit]
      );

      return result.success ? this.rowsToCommands(result.data || []) : [];
    } catch (error) {
      console.error("Error getting recent commands:", error);
      return [];
    }
  }

  /**
   * Get command by name
   *
   * @param {string} name - Command name to find
   * @returns {Promise<Command|null>} Command if found, null otherwise
   */
  public async getCommandByName(name: string): Promise<Command | null> {
    try {
      const result = await databaseService.get<CommandRow>(
        `
        SELECT 
          c.id,
          c.name,
          c.stands_for,
          c.summary,
          cat.name AS category,
          (SELECT GROUP_CONCAT(example, '\n') FROM command_examples WHERE command_id = c.id) AS examples,
          (SELECT content FROM command_content 
           WHERE command_id = c.id 
           AND content_type_id = (SELECT id FROM content_types WHERE name = 'tldr')
           LIMIT 1) AS tldr_content
        FROM commands c
        LEFT JOIN categories cat ON c.category_id = cat.id
        WHERE c.name = ?
      `,
        [name]
      );

      if (!result.success || !result.data) {
        return null;
      }

      return this.rowToCommand(result.data);
    } catch (error) {
      console.error(`Error getting command by name (${name}):`, error);
      return null;
    }
  }

  /**
   * Save command to database
   *
   * @param {Command} command - Command to save
   * @returns {Promise<boolean>} Success indicator
   */
  public async saveCommand(command: Command): Promise<boolean> {
    try {
      return await databaseService.transaction(async () => {
        // Find or create category
        let categoryId: number | null = null;
        if (command.category) {
          const categoryResult = await databaseService.get<{ id: number }>(
            `
            SELECT id FROM categories WHERE name = ?
          `,
            [command.category]
          );

          if (categoryResult.success && categoryResult.data) {
            categoryId = categoryResult.data.id;
          } else {
            const newCategory = await databaseService.run(
              `
              INSERT INTO categories (name) VALUES (?)
            `,
              [command.category]
            );

            if (newCategory.success) {
              categoryId = newCategory.data!.lastID;
            }
          }
        }

        // Insert or update command
        const existingCommand = await this.getCommandByName(command.name);
        let commandId: number;

        if (existingCommand) {
          // Update existing command
          const updateResult = await databaseService.run(
            `
            UPDATE commands 
            SET summary = ?, stands_for = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE name = ?
          `,
            [
              command.summary,
              command.standsFor || null,
              categoryId,
              command.name,
            ]
          );

          commandId = existingCommand.id!;
        } else {
          // Insert new command
          const insertResult = await databaseService.run(
            `
            INSERT INTO commands (name, summary, stands_for, category_id)
            VALUES (?, ?, ?, ?)
          `,
            [
              command.name,
              command.summary,
              command.standsFor || null,
              categoryId,
            ]
          );

          if (!insertResult.success) {
            throw new Error("Failed to insert command");
          }

          commandId = insertResult.data!.lastID;
        }

        // Save examples
        if (command.examples && command.examples.length > 0) {
          // Delete old examples
          await databaseService.run(
            `
            DELETE FROM command_examples WHERE command_id = ?
          `,
            [commandId]
          );

          // Insert new examples
          let sortOrder = 0;
          for (const example of command.examples) {
            await databaseService.run(
              `
              INSERT INTO command_examples (command_id, example, sort_order)
              VALUES (?, ?, ?)
            `,
              [commandId, example, sortOrder++]
            );
          }
        }

        // Save TLDR content
        if (command.content) {
          const contentTypeResult = await databaseService.get<{ id: number }>(`
            SELECT id FROM content_types WHERE name = 'tldr'
          `);

          if (contentTypeResult.success && contentTypeResult.data) {
            const contentTypeId = contentTypeResult.data.id;

            await databaseService.run(
              `
              INSERT OR REPLACE INTO command_content 
              (command_id, content_type_id, content, format, updated_at)
              VALUES (?, ?, ?, 'markdown', CURRENT_TIMESTAMP)
            `,
              [commandId, contentTypeId, command.content]
            );
          }
        }

        // Log in history
        await databaseService.run(
          `
          INSERT INTO command_history (command_id, raw_input)
          VALUES (?, ?)
        `,
          [commandId, command.name]
        );
      });
    } catch (error) {
      console.error("Error saving command:", error);
      return false;
    }

    return true;
  }

  /**
   * Get command content by ID and type
   *
   * @param {number} commandId - Command ID
   * @param {string} contentType - Content type (tldr, manpage, etc)
   * @returns {Promise<string|null>} Command content if found
   */
  public async getCommandContent(
    commandId: number,
    contentType: string = "tldr"
  ): Promise<string | null> {
    try {
      const result = await databaseService.get<{ content: string }>(
        `
        SELECT content
        FROM command_content
        WHERE command_id = ? AND content_type_id = (
          SELECT id FROM content_types WHERE name = ?
        )
      `,
        [commandId, contentType]
      );

      return result.success && result.data ? result.data.content : null;
    } catch (error) {
      console.error(
        `Error getting ${contentType} content for command ${commandId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Save command content
   *
   * @param {number} commandId - Command ID
   * @param {string} content - Content to save
   * @param {string} contentType - Content type (tldr, manpage, etc)
   * @param {string} format - Content format (markdown, html, etc)
   * @returns {Promise<boolean>} Success indicator
   */
  public async saveCommandContent(
    commandId: number,
    content: string,
    contentType: string = "tldr",
    format: string = "markdown"
  ): Promise<boolean> {
    try {
      // Get content type ID
      const contentTypeResult = await databaseService.get<{ id: number }>(
        `
        SELECT id FROM content_types WHERE name = ?
      `,
        [contentType]
      );

      if (!contentTypeResult.success || !contentTypeResult.data) {
        return false;
      }

      const contentTypeId = contentTypeResult.data.id;

      // Insert or replace content
      const result = await databaseService.run(
        `
        INSERT OR REPLACE INTO command_content
        (command_id, content_type_id, content, format, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
        [commandId, contentTypeId, content, format]
      );

      return result.success;
    } catch (error) {
      console.error(
        `Error saving ${contentType} content for command ${commandId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Log command usage in history
   *
   * @param {number} commandId - Command ID
   * @param {string} rawInput - User's raw input
   * @returns {Promise<boolean>} Success indicator
   */
  public async logCommandUsage(
    commandId: number,
    rawInput: string
  ): Promise<boolean> {
    try {
      const result = await databaseService.run(
        `
        INSERT INTO command_history (command_id, raw_input)
        VALUES (?, ?)
      `,
        [commandId, rawInput]
      );

      return result.success;
    } catch (error) {
      console.error(`Error logging command usage for ${commandId}:`, error);
      return false;
    }
  }

  /**
   * Import commands in bulk
   *
   * @param {Command[]} commands - Commands to import
   * @returns {Promise<number>} Number of commands imported
   */
  public async importCommands(commands: Command[]): Promise<number> {
    let imported = 0;

    for (const command of commands) {
      const success = await this.saveCommand(command);
      if (success) imported++;
    }

    return imported;
  }

  /**
   * Get command count
   *
   * @returns {Promise<number>} Number of commands in database
   */
  public async getCommandCount(): Promise<number> {
    return await databaseService.getCommandCount();
  }

  /**
   * Convert database row to Command object
   *
   * @private
   * @param {CommandRow} row - Database row
   * @returns {Command} Command object
   */
  private rowToCommand(row: CommandRow): Command {
    return {
      id: row.id,
      name: row.name,
      standsFor: row.stands_for,
      summary: row.summary,
      description: row.summary, // Use summary as description until we have separate fields
      category: row.category || '',
      examples: row.examples ? row.examples.split("\n") : [],
      content: row.tldr_content,
      source: CommandSource.SQLITE
    };
  }

  /**
   * Convert array of database rows to Command objects
   *
   * @private
   * @param {CommandRow[]} rows - Database rows
   * @returns {Command[]} Array of Command objects
   */
  private rowsToCommands(rows: CommandRow[]): Command[] {
    return rows.map((row) => this.rowToCommand(row));
  }

  /**
   * Sanitize FTS query for SQLite
   *
   * @private
   * @param {string} query - Raw query
   * @returns {string} Sanitized query for FTS5
   */
  private sanitizeFtsQuery(query: string): string {
    if (!query || typeof query !== "string") return "";

    // Clean and prepare the query for FTS5
    const cleaned = query
      .trim()
      .replace(/[^\w\s*"\-]/g, " ") // Remove special chars except wildcards
      .replace(/\s+/g, " "); // Normalize spaces

    return cleaned;
  }
}

// Export singleton instance
export const sqliteCommandStorage = new SQLiteCommandStorage();

// Default export for easier importing
export default sqliteCommandStorage;
