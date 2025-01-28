/**
 * Map of file extensions to their language names
 */
const LANGUAGE_MAP = {
  // Web Development
  'js': 'JavaScript',
  'jsx': 'React JSX',
  'ts': 'TypeScript',
  'tsx': 'React TSX',
  'html': 'HTML',
  'htm': 'HTML',
  'css': 'CSS',
  'scss': 'SCSS',
  'sass': 'SASS',
  'less': 'LESS',
  'vue': 'Vue',
  'svelte': 'Svelte',

  // Backend Languages
  'py': 'Python',
  'java': 'Java',
  'class': 'Java Bytecode',
  'cpp': 'C++',
  'cc': 'C++',
  'cxx': 'C++',
  'c': 'C',
  'h': 'C/C++ Header',
  'hpp': 'C++ Header',
  'cs': 'C#',
  'go': 'Go',
  'rs': 'Rust',
  'rb': 'Ruby',
  'php': 'PHP',
  'pl': 'Perl',
  'swift': 'Swift',
  'kt': 'Kotlin',
  'scala': 'Scala',
  'm': 'Objective-C',
  'mm': 'Objective-C++',

  // Shell Scripts
  'sh': 'Shell Script',
  'bash': 'Bash Script',
  'zsh': 'Zsh Script',
  'fish': 'Fish Script',
  'ps1': 'PowerShell',
  'bat': 'Batch Script',
  'cmd': 'Command Script',

  // Data & Config
  'json': 'JSON',
  'yaml': 'YAML',
  'yml': 'YAML',
  'xml': 'XML',
  'toml': 'TOML',
  'ini': 'INI',
  'conf': 'Configuration',
  'config': 'Configuration',
  'env': 'Environment Variables',

  // Documentation
  'md': 'Markdown',
  'mdx': 'MDX',
  'txt': 'Plain Text',
  'rst': 'reStructuredText',
  'tex': 'LaTeX',
  'doc': 'Word Document',
  'docx': 'Word Document',
  'pdf': 'PDF',

  // Database
  'sql': 'SQL',
  'psql': 'PostgreSQL',
  'mysql': 'MySQL',
  'sqlite': 'SQLite',

  // Other
  'r': 'R',
  'matlab': 'MATLAB',
  'f': 'Fortran',
  'f90': 'Fortran 90',
  'asm': 'Assembly',
  'S': 'Assembly',
  'dart': 'Dart',
  'lua': 'Lua',
  'ex': 'Elixir',
  'exs': 'Elixir Script',
  'erl': 'Erlang',
  'hrl': 'Erlang Header',
  'clj': 'Clojure',
  'elm': 'Elm',
  'hs': 'Haskell',
  'lhs': 'Literate Haskell'
};

/**
 * Checks if a file is binary based on its extension
 */
const isBinaryFile = (ext) => {
  const binaryExtensions = ['pdf', 'doc', 'docx', 'class'];
  return binaryExtensions.includes(ext);
};

/**
 * Extracts text content from different file types
 */
export const parseFileContent = (filename, content) => {
  try {
    console.log(`\n=== Parsing file: ${filename} ===`);
    
    // Get file extension
    const ext = filename.split('.').pop().toLowerCase();
    const language = LANGUAGE_MAP[ext] || 'Unknown';
    console.log(`File type: ${ext} (${language})`);
    
    // Check if it's a binary file
    if (isBinaryFile(ext)) {
      console.log('Binary file detected - skipping content extraction');
      return {
        success: false,
        text: '',
        type: ext,
        language,
        error: 'Binary file format not supported'
      };
    }

    // For text-based files, process the content
    const preview = content.slice(0, 200); // First 200 characters
    console.log('\nContent preview:');
    console.log('----------------------------------------');
    console.log(preview + (content.length > 200 ? '...' : ''));
    console.log('----------------------------------------');
    console.log(`Total content length: ${content.length} characters`);
    
    // Count lines of code (excluding empty lines)
    const lines = content.split('\n').filter(line => line.trim().length > 0).length;
    const totalLines = content.split('\n').length;
    console.log(`Lines of code: ${lines} (${totalLines} total lines)`);
    
    // Check if this is a supported language
    if (!LANGUAGE_MAP[ext]) {
      console.log('Warning: Unrecognized file extension, treating as plain text');
    }
    
    return {
      success: true,
      text: content,
      type: ext,
      language,
      stats: {
        lines,
        totalLines,
        characters: content.length,
        nonEmptyLines: lines
      }
    };
    
  } catch (error) {
    console.error(`Error parsing ${filename}:`, error);
    return {
      success: false,
      text: '',
      type: 'unknown',
      language: 'Unknown',
      error: error.message
    };
  }
};
