#!/usr/bin/env node

/**
 * Database Pre-Population Script
 * 
 * This script:
 * 1. Clones the tldr-pages repository (or updates if it exists)
 * 2. Parses markdown files into command objects
 * 3. Creates/populates SQLite database with commands
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sqlite3 = require('sqlite3').verbose();

// Configuration
const REPO_URL = 'https://github.com/tldr-pages/tldr.git';
const TEMP_DIR = path.join(__dirname, '../temp-tldr');
const DB_PATH = path.join(__dirname, '../src/assets/commands.db');
const PAGES_DIR = path.join(TEMP_DIR, 'pages');
const OS_TARGETS = ['common', 'linux', 'osx', 'windows'];

// Ensure directories exist
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Clone or update the repository
function setupRepository() {
  console.log('Setting up tldr-pages repository...');
  
  if (!fs.existsSync(TEMP_DIR)) {
    console.log('Cloning repository...');
    execSync(`git clone ${REPO_URL} ${TEMP_DIR}`, { stdio: 'inherit' });
  } else {
    console.log('Updating repository...');
    execSync(`cd ${TEMP_DIR} && git pull`, { stdio: 'inherit' });
  }
}

// Parse a markdown file into a command object
function parseMarkdownFile(filePath, osType) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Extract basic info
  const name = path.basename(filePath, '.md');
  const title = lines[0].replace('# ', '');
  const summary = lines[1].trim();
  
  // Extract examples
  const examples = [];
  let currentExample = null;
  
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('- ')) {
      if (currentExample) {
        examples.push(currentExample);
      }
      currentExample = { description: line.substring(2), code: '' };
    } else if (line.startsWith('`') && line.endsWith('`') && currentExample) {
      currentExample.code = line.substring(1, line.length - 1);
    }
  }
  
  if (currentExample) {
    examples.push(currentExample);
  }
  
  // Extract category based on directory structure
  const category = path.dirname(filePath).split(path.sep).pop();
  
  return {
    name,
    standsFor: '',  // Will need additional processing if available
    summary,
    description: summary,
    category: osType || 'common',
    examples: examples.map(e => `${e.description}\n${e.code}`),
    content: content
  };
}

// Create and populate the database
function populateDatabase(commands) {
  console.log('Creating and populating the database...');
  
  // Delete existing database if it exists
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
  
  // Create database and tables
  const db = new sqlite3.Database(DB_PATH);
  
  db.serialize(() => {
    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS commands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        stands_for TEXT,
        summary TEXT,
        category TEXT,
        examples TEXT,
        tldr_content TEXT
      )
    `);
    
    db.run(`
      CREATE VIRTUAL TABLE IF NOT EXISTS commands_fts USING fts5(
        name,
        summary,
        tldr_content,
        content=commands,
        content_rowid=id
      )
    `);
    
    // Create insert statement
    const insertStmt = db.prepare(`
      INSERT INTO commands (name, stands_for, summary, category, examples, tldr_content)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    // Insert commands
    let count = 0;
    commands.forEach(cmd => {
      insertStmt.run(
        cmd.name,
        cmd.standsFor,
        cmd.summary,
        cmd.category,
        cmd.examples.join('\n'),
        cmd.content
      );
      count++;
    });
    
    insertStmt.finalize();
    
    // Create triggers for FTS
    db.run(`
      CREATE TRIGGER IF NOT EXISTS commands_ai AFTER INSERT ON commands BEGIN
        INSERT INTO commands_fts(rowid, name, summary, tldr_content)
        VALUES (new.id, new.name, new.summary, new.tldr_content);
      END
    `);
    
    db.run(`
      CREATE TRIGGER IF NOT EXISTS commands_ad AFTER DELETE ON commands BEGIN
        INSERT INTO commands_fts(commands_fts, rowid, name, summary, tldr_content)
        VALUES('delete', old.id, old.name, old.summary, old.tldr_content);
      END
    `);
    
    db.run(`
      CREATE TRIGGER IF NOT EXISTS commands_au AFTER UPDATE ON commands BEGIN
        INSERT INTO commands_fts(commands_fts, rowid, name, summary, tldr_content)
        VALUES('delete', old.id, old.name, old.summary, old.tldr_content);
        INSERT INTO commands_fts(rowid, name, summary, tldr_content)
        VALUES (new.id, new.name, new.summary, new.tldr_content);
      END
    `);
    
    console.log(`Inserted ${count} commands into the database`);
  });
  
  db.close();
}

// Main function
async function main() {
  try {
    // Setup repository
    setupRepository();
    
    // Process markdown files
    console.log('Processing markdown files...');
    const commands = [];
    
    for (const osType of OS_TARGETS) {
      const osDir = path.join(PAGES_DIR, osType);
      
      if (fs.existsSync(osDir)) {
        const files = fs.readdirSync(osDir);
        
        for (const file of files) {
          if (file.endsWith('.md')) {
            const filePath = path.join(osDir, file);
            const command = parseMarkdownFile(filePath, osType);
            commands.push(command);
          }
        }
      }
    }
    
    // Populate database
    populateDatabase(commands);
    
    console.log('Database population completed successfully!');
    console.log(`Database size: ${(fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(2)} MB`);
    
    // Optionally clean up
    // fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
