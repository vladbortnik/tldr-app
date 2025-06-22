/**
 * SQLite Loader - Handles loading the SQLite3 module with error handling
 * This module helps with loading native SQLite bindings in Electron
 */

import * as fs from 'fs';
import * as path from 'path';

// Define sqlite3 interface for type safety
export interface SQLite3Database {
  run(sql: string, params: any[], callback?: (err: Error | null) => void): this;
  all(sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void): this;
  get(sql: string, params: any[], callback: (err: Error | null, row: any) => void): this;
  exec(sql: string, callback?: (err: Error | null) => void): this;
  close(callback?: (err: Error | null) => void): this;
}

export interface SQLite3 {
  verbose(): {
    Database: new (path: string, mode?: number, callback?: (err: Error | null) => void) => SQLite3Database;
  };
}

/**
 * Load SQLite3 module with enhanced error handling and diagnostics
 * @returns {SQLite3 | null} SQLite3 module or null if loading fails
 */
export function loadSQLite(): SQLite3 | null {
  try {
    // Check if we're in Electron's renderer process
    const isRenderer = (process && process.type === 'renderer');
    if (isRenderer) {
      console.warn('Attempting to load SQLite3 in renderer process. ' +
                  'SQLite operations should be performed in main process via IPC.');
      throw new Error('SQLite3 should not be loaded in renderer process');
    }

    // Try to require sqlite3
    try {
      const sqlite3 = require('sqlite3');
      console.log('SQLite3 module loaded successfully');
      
      // Debug information about the module
      try {
        const sqlite3Path = require.resolve('sqlite3');
        console.log(`SQLite3 module path: ${sqlite3Path}`);
        
        // Check multiple possible binding paths
        const appRoot = path.resolve(process.cwd());
        const nodeModulesPath = path.join(appRoot, 'node_modules/sqlite3');
        
        const possiblePaths = [
          path.join(nodeModulesPath, 'lib/binding/node-v135-darwin-arm64/node_sqlite3.node'),
          path.join(nodeModulesPath, 'lib/binding/node-v135-darwin-x64/node_sqlite3.node'),
          path.join(nodeModulesPath, 'build/Release/node_sqlite3.node'),
          path.join(appRoot, 'resources/node_sqlite3.node')
        ];
        
        console.log('Checking SQLite3 binary paths:');
        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            console.log(`✓ Found SQLite3 binary at: ${p}`);
          } else {
            console.log(`✗ Not found: ${p}`);
          }
        }
      } catch (pathError) {
        console.error('Could not check SQLite3 paths:', pathError);
      }
      
      return sqlite3;
    } catch (loadError) {
      console.error('Failed to load SQLite3 module:', loadError);
      throw loadError;
    }
  } catch (error: any) {
    console.error('SQLite3 loading failed:', error);
    console.error('SQLite3 error details:', error.stack || error.message || String(error));
    return null;
  }
}

/**
 * Create mock SQLite database for fallback when native module can't be loaded
 * @returns {SQLite3} Mock SQLite3 module
 */
export function createMockSQLite(): SQLite3 {
  console.warn('Creating mock SQLite3 implementation - database operations will be simulated');
  
  // Create mock database implementation
  return {
    verbose: () => ({
      Database: class MockDatabase {
        constructor(dbPath: string, _mode?: number, callback?: (err: Error | null) => void) {
          console.warn(`Mock SQLite3 database created (${dbPath}). All operations will be simulated.`);
          if (callback) {
            setTimeout(() => callback(null), 0);
          }
        }
        
        run(_sql: string, _params: any[], callback?: (err: Error | null) => void): any {
          if (callback) callback(null);
          return this;
        }
        
        all(_sql: string, _params: any[], callback: (err: Error | null, rows: any[]) => void): any {
          callback(null, []);
          return this;
        }
        
        get(_sql: string, _params: any[], callback: (err: Error | null, row: any) => void): any {
          callback(null, {});
          return this;
        }
        
        exec(_sql: string, callback?: (err: Error | null) => void): any {
          if (callback) callback(null);
          return this;
        }
        
        close(callback?: (err: Error | null) => void): any {
          if (callback) callback(null);
          return this;
        }
      }
    })
  };
}
