// Simple test script to check SQLite FTS5 support
const sqlite3 = require('sqlite3');
const path = require('path');

// Create an in-memory database for testing
const db = new sqlite3.Database(':memory:');

// Try to create an FTS5 virtual table
db.serialize(() => {
  // First log SQLite version
  db.get("SELECT sqlite_version() as version", (err, row) => {
    if (err) {
      console.error("Error checking SQLite version:", err);
      return;
    }
    console.log("SQLite version:", row.version);
    
    // Try to create an FTS5 table
    db.run(`CREATE VIRTUAL TABLE test_fts USING fts5(content)`, (err) => {
      if (err) {
        console.error("FTS5 NOT SUPPORTED:", err.message);
        console.log("\nResult: SQLite installation does NOT include FTS5 support");
      } else {
        console.log("FTS5 is supported!");
        console.log("\nResult: SQLite installation includes FTS5 support");
        
        // Try a simple FTS5 operation
        db.run("INSERT INTO test_fts VALUES ('This is a test document for FTS5 search')", (err) => {
          if (err) {
            console.error("Error inserting test data:", err);
            return;
          }
          
          db.get("SELECT * FROM test_fts WHERE test_fts MATCH 'search'", (err, row) => {
            if (err) {
              console.error("Error querying FTS5 table:", err);
              return;
            }
            console.log("FTS5 search result:", row ? row.content : "No match");
          });
        });
      }
    });
  });
});

// Close the database when done
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err);
      return;
    }
    console.log("Database closed successfully");
  });
}, 1000);
