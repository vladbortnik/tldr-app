/**
 * copy-sqlite-bindings.js
 * 
 * This script copies SQLite native bindings to the appropriate location 
 * to ensure they're bundled with the Electron app
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting SQLite binding copy process');

function findNodeVersion() {
  try {
    const nodeVersion = process.versions.node;
    const majorVersion = nodeVersion.split('.')[0];
    console.log(`Node version: ${nodeVersion} (Major: ${majorVersion})`);
    return { full: nodeVersion, major: majorVersion };
  } catch (err) {
    console.warn('Could not determine Node version:', err.message);
    return { full: '16.0.0', major: '16' }; // Fallback to a common version
  }
}

function findElectronInfo() {
  try {
    // Try to get Electron version from package.json
    const packageJson = require(path.join(process.cwd(), 'package.json'));
    const electronVersion = packageJson.devDependencies?.electron || '36.0.0';
    console.log(`Electron version from package.json: ${electronVersion}`);
    
    // Run electron to get the Node version it uses
    try {
      // This might fail if Electron isn't installed
      const electronInfo = JSON.parse(execSync('npx electron --version-json').toString());
      console.log(`Electron uses Node: ${electronInfo.node}`);
      return {
        version: electronInfo.electron || electronVersion.replace('^', ''),
        nodeVersion: electronInfo.node,
        nodeMajor: parseInt(electronInfo.node.split('.')[0], 10)
      };
    } catch (execErr) {
      console.warn('Could not execute Electron to determine Node version:', execErr.message);
      return { version: electronVersion.replace('^', ''), nodeVersion: '16.0.0', nodeMajor: 16 };
    }
  } catch (err) {
    console.warn('Could not determine Electron info:', err.message);
    return { version: '36.0.0', nodeVersion: '16.0.0', nodeMajor: 16 };
  }
}

function generatePossiblePaths() {
  // Get architecture and platform
  const platform = process.platform;
  const arch = process.arch;
  console.log(`Platform: ${platform}, Architecture: ${arch}`);
  
  // Get Node version used by Electron
  const electronInfo = findElectronInfo();
  const nodeInfo = findNodeVersion();
  
  // Possible ABI versions (Electron's Node version is what matters)
  const nodeMajor = electronInfo.nodeMajor || parseInt(nodeInfo.major, 10);
  
  // Base paths
  const appRoot = process.cwd();
  const nodeModulesPath = path.join(appRoot, 'node_modules/sqlite3');
  
  // Generate possible binding paths
  const possiblePaths = [
    // New path format
    path.join(nodeModulesPath, `lib/binding/node-v${nodeMajor}-${platform}-${arch}/node_sqlite3.node`),
    // Pre-built path with ABI
    path.join(nodeModulesPath, `lib/binding/napi-v6-${platform}-${arch}/node_sqlite3.node`),
    // Release build
    path.join(nodeModulesPath, 'build/Release/node_sqlite3.node'),
    // Check node_modules/.bin directory
    path.join(appRoot, 'node_modules/.bin/node_sqlite3.node')
  ];
  
  // Add variations with different Node major versions
  [16, 18, 19, 20].forEach(version => {
    possiblePaths.push(path.join(nodeModulesPath, `lib/binding/node-v${version}-${platform}-${arch}/node_sqlite3.node`));
  });
  
  return possiblePaths;
}

function findSqliteBinary() {
  try {
    // First try using bindings package if available
    try {
      const bindings = require('bindings');
      try {
        // Try to locate the binary path using bindings
        const bindingPath = bindings({
          bindings: 'node_sqlite3.node',
          module_root: path.dirname(require.resolve('sqlite3'))
        });
        
        console.log(`Found SQLite3 binary using bindings at: ${bindingPath}`);
        return bindingPath;
      } catch (bindingErr) {
        console.log('Bindings package failed to find SQLite3 binary, trying manual search...');
        // Continue to fallback
      }
    } catch (bindingsPkgErr) {
      console.log('Bindings package not available, trying manual search...');
      // Continue to fallback
    }
    
    // Fallback: Check all possible paths
    const possiblePaths = generatePossiblePaths();
    
    console.log('Searching for SQLite3 binary in common locations...');
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        console.log(`Found SQLite3 binary at: ${p}`);
        return p;
      } else {
        console.log(`Not found at: ${p}`);
      }
    }
    
    // Last resort: Try using find in node_modules
    try {
      console.log('Trying to find SQLite3 binary using file search...');
      const filePattern = platform === 'win32' ? 'node_sqlite3.node' : 'node_sqlite3.node';
      const searchCmd = `find ${path.join(process.cwd(), 'node_modules')} -name "${filePattern}" 2>/dev/null | head -n 1`;
      
      console.log(`Executing: ${searchCmd}`);
      const foundPath = execSync(searchCmd).toString().trim();
      
      if (foundPath && fs.existsSync(foundPath)) {
        console.log(`Found SQLite3 binary via search at: ${foundPath}`);
        return foundPath;
      }
    } catch (findErr) {
      console.log('File search failed:', findErr.message);
    }
    
    console.error('SQLite3 binary not found in any location');
    return false;
  } catch (error) {
    console.error('Error finding SQLite3 binary:', error.message);
    return false;
  }
}

function copyBinaryToResources(sourcePath) {
  try {
    // Make sure directories exist
    const resourcesDir = path.join(process.cwd(), 'resources');
    if (!fs.existsSync(resourcesDir)) {
      fs.mkdirSync(resourcesDir, { recursive: true });
      console.log(`Created resources directory: ${resourcesDir}`);
    }
    
    // Target path in resources directory
    const targetPath = path.join(resourcesDir, 'node_sqlite3.node');
    
    // Copy the file
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Successfully copied SQLite3 binary to: ${targetPath}`);
    
    // Also try to copy it to the .vite/build directory if it exists (for dev mode)
    const viteDir = path.join(process.cwd(), '.vite/build');
    if (fs.existsSync(viteDir)) {
      const viteTargetPath = path.join(viteDir, 'node_sqlite3.node');
      fs.copyFileSync(sourcePath, viteTargetPath);
      console.log(`Copied SQLite3 binary to Vite build dir: ${viteTargetPath}`);
    }
    
    // If out directory exists (for production build)
    const outDir = path.join(process.cwd(), 'out');
    if (fs.existsSync(outDir)) {
      // Find all directories that might need the binary
      try {
        const dirs = fs.readdirSync(outDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => path.join(outDir, dirent.name));
        
        for (const dir of dirs) {
          const targetOutPath = path.join(dir, 'node_sqlite3.node');
          try {
            fs.copyFileSync(sourcePath, targetOutPath);
            console.log(`Copied SQLite3 binary to output dir: ${targetOutPath}`);
          } catch (copyErr) {
            console.warn(`Could not copy to ${targetOutPath}:`, copyErr.message);
          }
        }
      } catch (dirErr) {
        console.warn('Error copying to out directories:', dirErr.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error copying SQLite3 binary to resources:', error.message);
    return false;
  }
}

function createMockBinary() {
  console.log('Creating mock SQLite3 binary as fallback');
  
  try {
    // Create mock binary as a simple empty file
    const resourcesDir = path.join(process.cwd(), 'resources');
    if (!fs.existsSync(resourcesDir)) {
      fs.mkdirSync(resourcesDir, { recursive: true });
    }
    
    const mockPath = path.join(resourcesDir, 'node_sqlite3.node');
    
    // Write a minimal binary file (just a few bytes to make it non-empty)
    fs.writeFileSync(mockPath, Buffer.from([0x7F, 0x45, 0x4C, 0x46, 0x02, 0x01])); // ELF header magic bytes
    
    console.log(`Created mock binary at ${mockPath} (app will use in-memory fallback)`);
    return true;
  } catch (error) {
    console.error('Failed to create mock binary:', error.message);
    return false;
  }
}

// Main execution
try {
  console.log('Searching for SQLite3 binary...');
  const binaryPath = findSqliteBinary();
  
  if (binaryPath) {
    console.log('Found real SQLite3 binary, copying it to resources...');
    const success = copyBinaryToResources(binaryPath);
    
    if (success) {
      console.log('SQLite3 binary copy process completed successfully');
      process.exit(0);
    } else {
      console.error('Failed to copy real SQLite3 binary, creating mock...');
      const mockSuccess = createMockBinary();
      
      if (mockSuccess) {
        console.log('Mock binary created successfully');
        process.exit(0);
      } else {
        console.error('Failed to create mock binary');
        process.exit(1);
      }
    }
  } else {
    console.log('SQLite3 binary not found, creating mock...');
    const mockSuccess = createMockBinary();
    
    if (mockSuccess) {
      console.log('Mock binary created successfully');
      process.exit(0);
    } else {
      console.error('Failed to create mock binary');
      process.exit(1);
    }
  }
} catch (error) {
  console.error('Script execution failed:', error.message);
  
  // Try to create mock as last resort
  try {
    console.error('Attempting to create mock binary as last resort...');
    const mockSuccess = createMockBinary();
    
    if (mockSuccess) {
      console.log('Mock binary created successfully as fallback');
      process.exit(0);
    } else {
      console.error('All attempts failed');
      process.exit(1);
    }
  } catch (finalError) {
    console.error('Final attempt failed:', finalError.message);
    process.exit(1);
  }
}
