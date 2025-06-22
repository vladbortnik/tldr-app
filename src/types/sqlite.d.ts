/**
 * Type definitions for SQLite integration
 * These types define the interfaces for SQLite functionality
 */

/**
 * SQLite Database Configuration
 */
export interface SQLiteConfig {
  /** Path to the database file */
  path: string;
  
  /** Whether to create the database if it doesn't exist */
  create: boolean;
  
  /** Memory mode - in-memory database with no persistence */
  memory?: boolean;
  
  /** Read-only mode */
  readonly?: boolean;
  
  /** File open mode (defaults to normal) */
  fileMustExist?: boolean;
}

/**
 * Statement result interface
 */
export interface SQLiteResult<T = unknown> {
  /** Number of rows affected by the statement */
  changes: number;
  
  /** Last inserted row ID */
  lastInsertRowid: number | bigint;
  
  /** Result data (for SELECT statements) */
  data?: T[];
}

/**
 * Statement parameter type
 */
export type SQLiteParam = string | number | boolean | null | Buffer | Uint8Array;

/**
 * Statement binding parameters
 */
export type SQLiteBindings = SQLiteParam[] | Record<string, SQLiteParam>;

/**
 * Prepared statement interface
 */
export interface SQLiteStatement<T = unknown> {
  /**
   * Run statement with parameters and return result
   * @param {SQLiteBindings} params - Statement parameters
   * @returns {SQLiteResult<T>} Statement execution result
   */
  run(params?: SQLiteBindings): SQLiteResult<T>;
  
  /**
   * Get all rows from statement
   * @param {SQLiteBindings} params - Statement parameters
   * @returns {T[]} Array of result rows
   */
  all<R = T>(params?: SQLiteBindings): R[];
  
  /**
   * Get first row from statement
   * @param {SQLiteBindings} params - Statement parameters
   * @returns {T | undefined} First row or undefined
   */
  get<R = T>(params?: SQLiteBindings): R | undefined;
  
  /**
   * Execute statement multiple times with different parameters
   * @param {SQLiteBindings[]} paramsArray - Array of parameter sets
   * @returns {number} Number of rows modified
   */
  batch(paramsArray: SQLiteBindings[]): number;
}

/**
 * SQLite Database interface
 */
export interface SQLiteDatabase {
  /**
   * Prepare an SQL statement
   * @param {string} sql - SQL statement text
   * @returns {SQLiteStatement} Prepared statement
   */
  prepare<T = unknown>(sql: string): SQLiteStatement<T>;
  
  /**
   * Execute SQL without returning results
   * @param {string} sql - SQL statement text
   * @returns {void}
   */
  exec(sql: string): void;
  
  /**
   * Start a transaction
   * @returns {void}
   */
  transaction<T>(fn: () => T): T;
  
  /**
   * Close the database connection
   * @returns {void}
   */
  close(): void;
}
