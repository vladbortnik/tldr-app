/**
 * Type definitions for sqlite3 module
 * These types provide interfaces for the sqlite3 database module
 */

declare module 'sqlite3' {
  export interface Database {
    run(sql: string, params: any[], callback?: (err: Error | null) => void): this;
    run(sql: string, callback?: (err: Error | null) => void): this;
    
    get(sql: string, params: any[], callback: (err: Error | null, row: any) => void): this;
    get(sql: string, callback: (err: Error | null, row: any) => void): this;
    
    all(sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void): this;
    all(sql: string, callback: (err: Error | null, rows: any[]) => void): this;
    
    exec(sql: string, callback?: (err: Error | null) => void): this;
    
    close(callback?: (err: Error | null) => void): void;
    
    configure(option: string, value: any): void;
    
    serialize(callback?: () => void): void;
    parallelize(callback?: () => void): void;
  }

  export interface Statement {
    bind(params: any[]): this;
    bind(...params: any[]): this;
    
    reset(): this;
    finalize(): this;
    
    run(params: any[], callback?: (err: Error | null) => void): this;
    run(...params: any[]): this;
    
    get(params: any[], callback: (err: Error | null, row: any) => void): this;
    get(...params: any[]): this;
    
    all(params: any[], callback: (err: Error | null, rows: any[]) => void): this;
    all(...params: any[]): this;
    
    each(params: any[], callback: (err: Error | null, row: any) => void, complete?: (err: Error | null, count: number) => void): this;
    each(...params: any[]): this;
  }

  export interface DatabaseConstructor {
    new(filename: string, callback?: (err: Error | null) => void): Database;
    new(filename: string, mode?: number, callback?: (err: Error | null) => void): Database;
  }

  export interface SqliteStatic {
    OPEN_READONLY: number;
    OPEN_READWRITE: number;
    OPEN_CREATE: number;
    OPEN_SHAREDCACHE: number;
    OPEN_PRIVATECACHE: number;
    OPEN_URI: number;
    
    verbose(): SqliteStatic;
    
    Database: DatabaseConstructor;
    Statement: Statement;
  }
  
  const sqlite3: SqliteStatic;
  export = sqlite3;
}
