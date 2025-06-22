/**
 * Services Layer Exports
 * Central export file for all application services
 */

// Type definitions
export type { Command } from './types';
export { CommandSource } from './types';

// Command Service - provides access to command data
export { commandService, CommandService } from './commandService';

// Storage Service interface for renderer use
export type { ICommandStorage } from './storageService';

// Import StorageService class for typing purposes
import { StorageService } from './storageService';
export { StorageService };

// Create a mock storage service for renderer safety
// This prevents direct SQLite access from the renderer
export const storageService: Partial<StorageService> = {}; // Type-safe mock for renderer process
