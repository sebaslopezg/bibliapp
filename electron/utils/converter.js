import fs from 'fs'
import path from 'path'

// Bible book names in Spanish (indexed by book number, starting from 1)
const BIBLE_BOOKS = {
  1: 'genesis',
  2: 'exodo',
  3: 'levitico',
  4: 'numeros',
  5: 'deuteronomio',
  6: 'josue',
  7: 'jueces',
  8: 'rut',
  9: '1_samuel',
  10: '2_samuel',
  11: '1_reyes',
  12: '2_reyes',
  13: '1_cronicas',
  14: '2_cronicas',
  15: 'esdras',
  16: 'nehemias',
  17: 'ester',
  18: 'job',
  19: 'salmos',
  20: 'proverbios',
  21: 'eclesiastes',
  22: 'isaias',
  23: 'jeremias',
  24: 'lamentaciones',
  25: 'ezequiel',
  26: 'daniel',
  27: 'oseas',
  28: 'joel',
  29: 'amos',
  30: 'abdias',
  31: 'jonas',
  32: 'miqueas',
  33: 'nahum',
  34: 'habacuc',
  35: 'sofonias',
  36: 'hageo',
  37: 'zacarias',
  38: 'malaquias',
  39: 'mateo',
  40: 'marcos',
  41: 'lucas',
  42: 'juan',
  43: 'hechos',
  44: 'romanos',
  45: 'gálatas',
  46: '1_corintios',
  47: '2_corintios',
  48: 'gálatas',
  49: 'efesios',
  50: 'filipenses',
  51: 'colosenses',
  52: '1_tesalonicenses',
  53: '2_tesalonicenses',
  54: '1_timoteo',
  55: '2_timoteo',
  56: 'tito',
  57: 'filemon',
  58: 'hebreos',
  59: 'santiago',
  60: '1_pedro',
  61: '2_pedro',
  62: '1_juan',
  63: '2_juan',
  64: '3_juan',
  65: 'judas',
  66: 'apocalipsis'
};

function convertBibleToJSON(textData, bibleVersion = "Nueva Reina Valera 2000") {
  const result = {
    bible_version: bibleVersion,
    books: {}
  };

  let verses = [];
  
  if (typeof textData === 'string') {
    // Parse string format: (46, 1, 1, 'text'), (46, 1, 2, 'text'), ...
    const regex = /\((\d+),\s*(\d+),\s*(\d+),\s*'([^']*)'\)/g;
    let match;
    while ((match = regex.exec(textData)) !== null) {
      verses.push({
        book: parseInt(match[1]),
        chapter: parseInt(match[2]),
        verse: parseInt(match[3]),
        text: match[4]
      });
    }
  } else if (Array.isArray(textData)) {
    verses = textData.map(item => {
      if (Array.isArray(item)) {
        return {
          book: item[0],
          chapter: item[1],
          verse: item[2],
          text: item[3]
        };
      }
      return item;
    });
  }

  // Group verses by book and chapter
  verses.forEach(({ book, chapter, verse, text }) => {
    const bookName = BIBLE_BOOKS[book];
    
    if (!bookName) {
      console.warn(`Unknown book number: ${book}`);
      return;
    }

    if (!result.books[bookName]) {
      result.books[bookName] = {};
    }

    if (!result.books[bookName][chapter]) {
      result.books[bookName][chapter] = [];
    }

    result.books[bookName][chapter][verse - 1] = text;
  });

  return result;
}

function getAllTextFiles(dir) {
  let files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files = files.concat(getAllTextFiles(fullPath));
        } else if (stat.isFile() && item.endsWith('.txt')) {
          files.push(fullPath);
        }
      } catch (err) {
        console.warn(`Error checking file: ${fullPath}`, err.message);
      }
    });
  } catch (err) {
    console.error(`Error reading directory: ${dir}`, err.message);
  }
  
  return files;
}

async function mergeBibleFiles(inputDirectory, outputFilePath, bibleVersion = "Nueva Reina Valera 2000") {
  try {
    console.log(`Reading files from: ${inputDirectory}`);
    
    // Get all .txt files (including from subdirectories)
    const files = getAllTextFiles(inputDirectory);
    
    if (files.length === 0) {
      console.error('No .txt files found in the directory');
      return;
    }

    console.log(`Found ${files.length} files to process`);

    let allTextData = '';

    // Read and concatenate all files
    files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      allTextData += content + ' ';
      console.log(`Processed: ${path.basename(filePath)}`);
    });

    // Convert to JSON
    console.log('Converting to JSON format...');
    const jsonBible = convertBibleToJSON(allTextData, bibleVersion);

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created output directory: ${outputDir}`);
    }

    // Write to output file
    fs.writeFileSync(outputFilePath, JSON.stringify(jsonBible, null, 2), 'utf-8');
    console.log(`✓ JSON file created successfully: ${outputFilePath}`);
    console.log(`Total books: ${Object.keys(jsonBible.books).length}`);

  } catch (error) {
    console.error('Error processing files:', error.message);
  }
}

// Usage example:
// Adjust these paths to match your setup
//const inputDir = './bible_books';        // Directory containing .txt files
//const outputFile = './bible_books';       // Output JSON file path
//const bibleVersion = "Nueva Reina Valera 2000";
//
//mergeBibleFiles(inputDir, outputFile, bibleVersion);

export {mergeBibleFiles, convertBibleToJSON, getAllTextFiles}