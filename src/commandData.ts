// TypeScript interface for type safety (like Python dataclass)
export interface Command {
  name: string;
  standsFor: string; // What the abbreviation means or origin of command name
  description: string;
  examples: string[];
  category: string;
}

/**
 * Static command database for MVP
 * In production, this will come from SQLite database
 * For now, it's like having a Python dict with command info
 */
export const commandsDatabase: Record<string, Command> = {
  // File and Directory Operations
  ls: {
    name: "ls",
    standsFor: "list",
    description: "List directory contents",
    examples: [
      "ls                    # List files and directories",
      "ls -la                # List all files with detailed info",
      "ls -lh                # List with human-readable file sizes",
      "ls *.txt              # List only .txt files",
    ],
    category: "file-operations",
  },

  cd: {
    name: "cd",
    standsFor: "change directory",
    description: "Change directory",
    examples: [
      "cd /path/to/directory  # Change to specific directory",
      "cd ~                  # Change to home directory",
      "cd ..                 # Go up one directory",
      "cd -                  # Go to previous directory",
    ],
    category: "file-operations",
  },

  pwd: {
    name: "pwd",
    standsFor: "print working directory",
    description: "Print working directory (show current location)",
    examples: [
      "pwd                   # Show current directory path",
      "pwd -P                # Show physical path (resolve symlinks)",
    ],
    category: "file-operations",
  },

  mkdir: {
    name: "mkdir",
    standsFor: "make directory",
    description: "Create directories",
    examples: [
      "mkdir new-folder      # Create a single directory",
      "mkdir -p path/to/deep/folder  # Create nested directories",
      "mkdir dir1 dir2 dir3  # Create multiple directories",
    ],
    category: "file-operations",
  },

  rmdir: {
    name: "rmdir",
    standsFor: "remove directory",
    description: "Remove empty directories",
    examples: [
      "rmdir empty-folder    # Remove empty directory",
      "rmdir -p path/to/empty/dirs  # Remove empty nested directories",
    ],
    category: "file-operations",
  },

  rm: {
    name: "rm",
    standsFor: "remove",
    description: "Remove files and directories",
    examples: [
      "rm file.txt           # Remove a file",
      "rm -r directory/      # Remove directory and contents recursively",
      "rm -f file.txt        # Force remove (no confirmation)",
      "rm *.tmp              # Remove all .tmp files",
    ],
    category: "file-operations",
  },

  cp: {
    name: "cp",
    standsFor: "copy",
    description: "Copy files and directories",
    examples: [
      "cp file.txt copy.txt  # Copy file to new name",
      "cp file.txt /path/to/destination/  # Copy to directory",
      "cp -r source/ destination/  # Copy directory recursively",
    ],
    category: "file-operations",
  },

  mv: {
    name: "mv",
    standsFor: "move",
    description: "Move/rename files and directories",
    examples: [
      "mv old.txt new.txt    # Rename file",
      "mv file.txt /path/to/destination/  # Move file",
      "mv directory/ /new/location/  # Move directory",
    ],
    category: "file-operations",
  },

  // Text Processing
  grep: {
    name: "grep",
    standsFor: "global regular expression print",
    description: "Search text patterns in files",
    examples: [
      "grep 'pattern' file.txt  # Search for pattern in file",
      "grep -r 'text' .      # Search recursively in all files",
      "grep -i 'PATTERN' file.txt  # Case-insensitive search",
      "grep -n 'pattern' file.txt  # Show line numbers",
    ],
    category: "text-processing",
  },

  find: {
    name: "find",
    standsFor: "find (intuitive name)",
    description: "Search for files and directories",
    examples: [
      "find . -name '*.txt'  # Find all .txt files",
      "find . -type f        # Find all files (not directories)",
      "find . -type d        # Find all directories",
      "find . -size +1M      # Find files larger than 1MB",
    ],
    category: "text-processing",
  },

  cat: {
    name: "cat",
    standsFor: "concatenate",
    description: "Display file contents",
    examples: [
      "cat file.txt          # Display file content",
      "cat file1.txt file2.txt  # Display multiple files",
      "cat > newfile.txt     # Create new file (Ctrl+D to save)",
    ],
    category: "text-processing",
  },

  less: {
    name: "less",
    standsFor: "'less is more' (improved version of 'more' command)",
    description: "View file contents page by page",
    examples: [
      "less large-file.txt   # View file with pagination",
      "less +G file.txt      # Start at end of file",
      "# Navigation: Space=next page, b=previous page, q=quit",
    ],
    category: "text-processing",
  },

  head: {
    name: "head",
    standsFor: "head (top part of file)",
    description: "Display first lines of file",
    examples: [
      "head file.txt         # Show first 10 lines",
      "head -n 20 file.txt   # Show first 20 lines",
      "head -c 100 file.txt  # Show first 100 characters",
    ],
    category: "text-processing",
  },

  tail: {
    name: "tail",
    standsFor: "tail (bottom part of file)",
    description: "Display last lines of file",
    examples: [
      "tail file.txt         # Show last 10 lines",
      "tail -n 20 file.txt   # Show last 20 lines",
      "tail -f log.txt       # Follow file changes (live updates)",
    ],
    category: "text-processing",
  },

  // System Information
  ps: {
    name: "ps",
    standsFor: "process status",
    description: "Display running processes",
    examples: [
      "ps                    # Show processes for current user",
      "ps aux                # Show all processes with details",
      "ps aux | grep python  # Find Python processes",
    ],
    category: "system-info",
  },

  top: {
    name: "top",
    standsFor: "top (processes using most resources)",
    description: "Display and update running processes",
    examples: [
      "top                   # Show live process monitor",
      "top -p 1234           # Monitor specific process ID",
      "# Press q to quit, k to kill process",
    ],
    category: "system-info",
  },

  df: {
    name: "df",
    standsFor: "disk free",
    description: "Display disk space usage",
    examples: [
      "df                    # Show disk usage",
      "df -h                 # Show in human-readable format (GB, MB)",
      "df -i                 # Show inode usage",
    ],
    category: "system-info",
  },

  du: {
    name: "du",
    standsFor: "disk usage",
    description: "Display directory space usage",
    examples: [
      "du                    # Show directory sizes",
      "du -h                 # Human-readable sizes",
      "du -sh *              # Summary of each item in current directory",
    ],
    category: "system-info",
  },

  // Network and Git
  curl: {
    name: "curl",
    standsFor: "Client URL (or 'see URL')",
    description: "Transfer data from servers",
    examples: [
      "curl https://api.example.com  # Make GET request",
      "curl -X POST https://api.example.com  # Make POST request",
      "curl -o file.zip https://example.com/file.zip  # Download file",
    ],
    category: "network",
  },

  git: {
    name: "git",
    standsFor:
      "git (British slang for 'unpleasant person' - Linus Torvalds' humor)",
    description: "Version control system",
    examples: [
      "git status            # Check repository status",
      "git add .             # Stage all changes",
      "git commit -m 'message'  # Commit with message",
      "git push              # Push to remote repository",
    ],
    category: "development",
  },
};

/**
 * Get all available command names for autocomplete
 * Similar to getting dictionary keys in Python: list(commands.keys())
 */
export const getCommandNames = (): string[] => {
  return Object.keys(commandsDatabase);
};

/**
 * Search commands by name or description
 * Similar to filtering a Python list with list comprehension
 */
export const searchCommands = (query: string): Command[] => {
  const searchTerm = query.toLowerCase().trim();

  if (!searchTerm) {
    return []; // Return empty array if no search term
  }

  // Filter commands that match name or description
  return Object.values(commandsDatabase).filter(
    (command) =>
      command.name.toLowerCase().includes(searchTerm) ||
      command.description.toLowerCase().includes(searchTerm)
  );
};

/**
 * Get command by exact name
 * Similar to dictionary lookup in Python: commands.get(name)
 */
export const getCommandByName = (name: string): Command | null => {
  return commandsDatabase[name.toLowerCase()] || null;
};

/**
 * Get commands by category
 * Similar to filtering by category in Python
 */
export const getCommandsByCategory = (category: string): Command[] => {
  return Object.values(commandsDatabase).filter(
    (command) => command.category === category
  );
};
