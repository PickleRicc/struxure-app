/**
 * File patterns and directories to exclude from processing
 * These patterns represent files that are typically not relevant
 * for code analysis and understanding relationships between files
 */

export const excludePatterns = {
  // Build and output directories
  directories: [
    'node_modules',
    'dist',
    'build',
    'out',
    '.next',
    'coverage',
    '__pycache__',
    'venv',
    '.git',
    '.svn',
    'target',  // Maven/Gradle build
    'bin',     // Binary outputs
    'obj',     // .NET build
  ],

  // File patterns to exclude
  patterns: [
    // Dependencies and lock files
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'Gemfile.lock',
    'poetry.lock',
    
    // Build and configuration
    '*.pyc',
    '*.pyo',
    '*.pyd',
    '*.class',
    '*.o',
    '*.obj',
    '*.exe',
    '*.dll',
    '*.so',
    '*.dylib',
    
    // IDE and editor files
    '.DS_Store',
    'Thumbs.db',
    '.idea',
    '.vscode',
    '*.swp',
    '*.swo',
    '*~',
    
    // Logs and temporary files
    '*.log',
    '*.tmp',
    '*.temp',
    '*.cache',
    
    // Test coverage and reports
    '*.lcov',
    '.nyc_output',
    'coverage.xml',
    
    // Media and large binary files
    '*.jpg',
    '*.jpeg',
    '*.png',
    '*.gif',
    '*.ico',
    '*.pdf',
    '*.zip',
    '*.tar',
    '*.gz',
    '*.rar',
    
    // Environment and secrets
    '.env*',
    '*.pem',
    '*.key',
    '*.cert',
    'secrets.*',
  ]
}

/**
 * Check if a file should be excluded based on its path
 * @param {string} filePath - The path of the file to check
 * @returns {boolean} - True if the file should be excluded
 */
export function shouldExcludeFile(filePath) {
  const normalizedPath = filePath.toLowerCase()
  
  // Check directory patterns
  if (excludePatterns.directories.some(dir => 
    normalizedPath.includes(`/${dir}/`) || normalizedPath.includes(`\\${dir}\\`))) {
    return true
  }
  
  // Check file patterns
  return excludePatterns.patterns.some(pattern => {
    if (pattern.startsWith('*.')) {
      // Handle extension patterns
      const ext = pattern.slice(1) // Remove *
      return normalizedPath.endsWith(ext)
    }
    // Handle exact matches and path contains
    return normalizedPath.includes(pattern.toLowerCase())
  })
}

/**
 * Get a list of allowed file extensions that are typically relevant for code analysis
 * @returns {string[]} - Array of allowed file extensions
 */
export const getAllowedExtensions = () => [
  // Web
  '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
  '.html', '.htm', '.css', '.scss', '.sass', '.less',
  
  // Backend
  '.py', '.rb', '.php', '.java', '.go', '.rs',
  '.cs', '.cpp', '.c', '.h', '.hpp',
  
  // Config and Data
  '.json', '.yaml', '.yml', '.toml', '.xml',
  '.sql', '.graphql', '.gql',
  
  // Documentation
  '.md', '.mdx', '.rst', '.txt',
]
