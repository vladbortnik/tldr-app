/**
 * CommandService unit tests
 */
import { commandService } from '../../../src/services';

// Mock the imported commandsDatabase
jest.mock('../../../src/shared/utils/commandData', () => ({
  default: {
    'git': {
      name: 'git',
      category: 'version control',
      description: 'Distributed version control system',
      examples: ['git init', 'git add .']
    },
    'ls': {
      name: 'ls',
      category: 'common',
      description: 'List directory contents',
      examples: ['ls -la', 'ls -h']
    }
  }
}));

describe('CommandService', () => {
  beforeEach(() => {
    // Reset any mocks before each test
  });

  describe('searchCommands', () => {
    it('should find commands by search term', async () => {
      const results = await commandService.searchCommands('git');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name.toLowerCase()).toContain('git');
    });
    
    it('should return empty array when no matches found', async () => {
      const results = await commandService.searchCommands('nonexistentcommand');
      expect(results).toEqual([]);
    });
  });

  describe('getCommandByName', () => {
    it('should return a command when it exists', async () => {
      const command = await commandService.getCommandByName('git');
      expect(command).not.toBeNull();
      expect(command?.name).toBe('git');
    });
    
    it('should return null when command does not exist', async () => {
      const command = await commandService.getCommandByName('nonexistentcommand');
      expect(command).toBeNull();
    });
  });

  describe('getCommandNames', () => {
    it('should return list of available command names', () => {
      const commandNames = commandService.getCommandNames();
      expect(commandNames).toContain('git');
      expect(commandNames).toContain('ls');
    });
  });
});
