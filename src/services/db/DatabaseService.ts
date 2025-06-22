/**
 * DatabaseService - Core SQLite database operations
 * Manages database connection, schema initialization, and base operations
 */
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { Command, CommandSource } from '../types';
import { loadSQLite, createMockSQLite, SQLite3, SQLite3Database } from './sqlite-loader';

// Load SQLite with improved error handling
let sqlite3: SQLite3;
let useMockDatabase = false;

try {
  const loadedSQLite = loadSQLite();
  if (loadedSQLite) {
    sqlite3 = loadedSQLite;
    console.log('SQLite3 module loaded successfully via sqlite-loader');
  } else {
    console.warn('SQLite3 module failed to load, using mock implementation');
    sqlite3 = createMockSQLite();
    useMockDatabase = true;
  }
} catch (err: any) {
  console.error('Error during SQLite3 initialization:', err);
  console.error('Falling back to mock database implementation');
  sqlite3 = createMockSQLite();
  useMockDatabase = true;
}

/**
 * Result interface for database operations
 */
export interface DbResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

/**
 * Cache item interface for API responses
 */
export interface CacheItem {
  key: string;
  content: string;
  contentType: string;
  expiresAt: Date;
}

/**
 * Database service for SQLite operations
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite3Database | null = null;
  private dbPath: string;
  private schemaPath: string;
  private prePopulatedDbPath: string;
  private initialized = false;
  
  /**
   * Create a new DatabaseService instance
   * @private
   */
  private constructor() {
    // Get app data path for SQLite database
    const userDataPath = app?.getPath('userData') || path.join(process.cwd(), 'data');
    this.dbPath = path.join(userDataPath, 'tldr.sqlite');
    
    // Path to schema SQL file
    this.schemaPath = path.join(__dirname, 'schema.sql');
    
    // Path to pre-populated database from assets
    this.prePopulatedDbPath = path.join(__dirname, '../../assets/commands.db');
  }
  
  /**
   * Get singleton instance of DatabaseService
   * @returns {DatabaseService} The singleton instance
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  /**
   * Initialize database connection and schema
   * @returns {Promise<boolean>} Promise resolving to true if successful
   */
  public async initialize(): Promise<boolean> {
    if (this.initialized && this.db) {
      return true;
    }
    
    try {
      // Ensure directory exists
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      // Check if we need to copy the pre-populated database
      if (!fs.existsSync(this.dbPath) && fs.existsSync(this.prePopulatedDbPath)) {
        console.log('Copying pre-populated database to user data directory...');
        try {
          fs.copyFileSync(this.prePopulatedDbPath, this.dbPath);
          console.log('Pre-populated database copied successfully');
        } catch (copyErr) {
          console.error('Failed to copy pre-populated database:', copyErr);
        }
      }
      
      // Create database connection with verbose mode for better logging
      const verbose = sqlite3.verbose();
      
      return new Promise<boolean>((resolve, reject) => {
        // Mode parameter (second arg) is expected to be a number
        // 1 = READONLY, 2 = READWRITE, 6 = READWRITE | CREATE
        const OPEN_READWRITE_CREATE = 6;
        
        this.db = new verbose.Database(this.dbPath, OPEN_READWRITE_CREATE, (err: Error | null) => {
          if (err) {
            console.error('Error opening database:', err.message);
            reject(err);
            return;
          }
          
          // Use non-async callbacks to avoid TypeScript errors
          this.run('PRAGMA foreign_keys = ON;').then(() => {
            this.run('PRAGMA journal_mode = WAL;').then(() => {
              // Initialize schema
              this.initSchema().then(() => {
                console.log('Database initialized successfully');
                this.initialized = true;
                resolve(true);
              }).catch((schemaError) => {
                console.error('Error initializing schema:', schemaError);
                reject(schemaError);
              });
            }).catch((pragmaError) => {
              console.error('Error setting pragma:', pragmaError);
              reject(pragmaError);
            });
          }).catch((pragmaError) => {
            console.error('Error setting foreign keys:', pragmaError);
            reject(pragmaError);
          });
        });
      });
    } catch (error) {
      console.error('Database initialization error:', error);
      return false;
    }
  }
  
  /**
   * Initialize database schema from SQL file
   * @private
   * @returns {Promise<void>}
   */
  private async initSchema(): Promise<void> {
    try {
      // Read schema SQL file
      const schemaSql = fs.readFileSync(this.schemaPath, 'utf8');
      
      // Split by semicolon to execute each statement separately
      const statements = schemaSql
        .split(';')
        .filter(stmt => stmt.trim() !== '');
      
      // Execute each statement
      for (const statement of statements) {
        await this.run(statement);
      }
      
      console.log(`Schema initialized: ${statements.length} statements executed`);
    } catch (error) {
      console.error('Error initializing schema:', error);
      throw error;
    }
  }
  
  /**
   * Run a SQL statement with optional parameters
   * @param {string} sql - SQL statement
   * @param {any[]} params - Optional parameters
   * @returns {Promise<DbResult<{ changes: number, lastID: number }>>} Result with changes and lastID
   */
  public async run(sql: string, params: any[] = []): Promise<DbResult<{ changes: number, lastID: number }>> {
    if (!this.db) {
      return { success: false, error: new Error('Database not initialized') };
    }
    
    return new Promise((resolve) => {
      this.db!.run(sql, params, function(this: {changes: number, lastID: number}, err: Error | null) {
        if (err) {
          resolve({ 
            success: false, 
            error: err 
          });
          return;
        }
        
        resolve({ 
          success: true, 
          data: { 
            changes: this.changes, 
            lastID: this.lastID 
          } 
        });
      });
    });
  }
  
  /**
   * Get a single row from the database
   * @param {string} sql - SQL statement
   * @param {any[]} params - Optional parameters
   * @returns {Promise<DbResult<T>>} Result with single row or error
   */
  public async get<T>(sql: string, params: any[] = []): Promise<DbResult<T>> {
    if (!this.db) {
      return { success: false, error: new Error('Database not initialized') };
    }
    
    return new Promise((resolve) => {
      this.db!.get(sql, params, (err: Error | null, row: any) => {
        if (err) {
          resolve({ success: false, error: err });
          return;
        }
        
        resolve({ success: true, data: row as T });
      });
    });
  }
  
  /**
   * Get multiple rows from the database
   * @param {string} sql - SQL statement
   * @param {any[]} params - Optional parameters
   * @returns {Promise<DbResult<T[]>>} Result with array of rows or error
   */
  public async all<T>(sql: string, params: any[] = []): Promise<DbResult<T[]>> {
    if (!this.db) {
      return { success: false, error: new Error('Database not initialized') };
    }
    
    return new Promise((resolve) => {
      this.db!.all(sql, params, (err: Error | null, rows: any[]) => {
        if (err) {
          resolve({ success: false, error: err });
          return;
        }
        
        resolve({ success: true, data: rows as T[] });
      });
    });
  }
  
  /**
   * Execute multiple statements in a transaction
   * @param {Function} callback - Function containing statements to execute
   * @returns {Promise<DbResult<void>>} Result of transaction
   */
  public async transaction(callback: () => Promise<void>): Promise<DbResult<void>> {
    if (!this.db) {
      return { success: false, error: new Error('Database not initialized') };
    }
    
    try {
      await this.run('BEGIN TRANSACTION');
      await callback();
      await this.run('COMMIT');
      return { success: true };
    } catch (error) {
      await this.run('ROLLBACK');
      return { success: false, error: error as Error };
    }
  }
  
  /**
   * Close database connection
   * @returns {Promise<boolean>} True if closed successfully
   */
  public async close(): Promise<boolean> {
    if (!this.db) {
      return true;
    }
    
    return new Promise((resolve) => {
      this.db!.close((err: Error | null) => {
        if (err) {
          console.error('Error closing database:', err.message);
          resolve(false);
          return;
        }
        
        this.db = null;
        this.initialized = false;
        resolve(true);
      });
    });
  }
  
  /**
   * Get commands table row count for statistics
   * @returns {Promise<number>} Number of commands in database
   */
  public async getCommandCount(): Promise<number> {
    const result = await this.get<{ count: number }>('SELECT COUNT(*) as count FROM commands');
    return result.success && result.data ? result.data.count : 0;
  }

  /**
   * Clear expired items from cache
   * @returns {Promise<number>} Number of items cleared
   */
  public async clearExpiredCache(): Promise<number> {
    const result = await this.run(
      'DELETE FROM api_cache WHERE expires_at < datetime("now")'
    );
    
    return result.success ? result.data!.changes : 0;
  }
  
  /**
   * Add item to cache with TTL
   * @param {string} key - Cache key
   * @param {string} content - Content to cache
   * @param {string} contentType - Content MIME type
   * @param {number} ttlSeconds - Time to live in seconds
   * @returns {Promise<boolean>} True if successful
   */
  public async addToCache(
    key: string,
    content: string,
    contentType = 'text/plain',
    ttlSeconds = 86400
  ): Promise<boolean> {
    const result = await this.run(
      `INSERT OR REPLACE INTO api_cache 
       (cache_key, content, content_type, expires_at) 
       VALUES (?, ?, ?, datetime("now", "+${ttlSeconds} seconds"))`,
      [key, content, contentType]
    );
    
    return result.success;
  }
  
  /**
   * Get item from cache
   * @param {string} key - Cache key
   * @returns {Promise<CacheItem|null>} Cache item if found and not expired
   */
  public async getFromCache(key: string): Promise<CacheItem|null> {
    const result = await this.get<CacheItem>(
      `SELECT cache_key as key, content, content_type as contentType, expires_at as expiresAt
       FROM api_cache
       WHERE cache_key = ? AND expires_at > datetime("now")`,
      [key]
    );
    
    return (result.success && result.data) ? result.data : null;
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();

// Default export for easier importing
export default databaseService;
