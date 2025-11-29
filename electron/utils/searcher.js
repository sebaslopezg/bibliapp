import fs from 'fs'

// Load the Bible JSON file
const loadBible = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading Bible file:', error.message)
    return null
  }
}

const searchVerse = (bible, query) => {
  // Normalize the query: remove extra spaces and convert to lowercase
  const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');
  
  // Parse the query: "genesis 1:2" or "1 samuel 1:1" or "cantar de los cantares 1:1"
  // Match: book name (can have spaces/numbers) + chapter + : + verse
  const regex = /^(.+?)\s+(\d+)\s*:\s*(\d+)$/;
  const match = normalized.match(regex);
  
  if (!match) {
    return {
      success: false,
      error: 'Invalid format. Use: "book_name chapter:verse" (e.g., "genesis 1:2" or "1 samuel 1:1")'
    };
  }

  const [, bookInput, chapterInput, verseInput] = match
  const chapter = parseInt(chapterInput)
  const verse = parseInt(verseInput)

  // Find the book (case-insensitive, handle spaces and underscores)
  const normalizeBookName = (name) => name.toLowerCase().replace(/[\s_]+/g, '_')
  const normalizedInput = normalizeBookName(bookInput)
  
  const bookName = Object.keys(bible.books).find(
    book => normalizeBookName(book) === normalizedInput
  );

  if (!bookName) {
    return {
      success: false,
      error: `Book "${bookInput}" not found. Check the spelling.`
    };
  }

  const book = bible.books[bookName]

  // Check if chapter exists
  if (!book[chapter]) {
    return {
      success: false,
      error: `Chapter ${chapter} not found in ${bookName}.`
    };
  }

  const chapterVerses = book[chapter];

  // Check if verse exists (remember: array is 0-indexed)
  if (!chapterVerses[verse - 1]) {
    return {
      success: false,
      error: `Verse ${verse} not found in ${bookName} chapter ${chapter}.`
    };
  }

  return {
    success: true,
    book: bookName,
    chapter: chapter,
    verse: verse,
    text: chapterVerses[verse - 1],
    reference: `${bookName.replace(/_/g, ' ')} ${chapter}:${verse}`
  };
}

function searchRange(bible, query) {
  // Parse range: "genesis 1:2-5" or "genesis 1:2 - 1:5" or "1 samuel 1:1-5"
  const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ')
  
  // Match patterns like "genesis 1:2-5" or "1 samuel 1:2 - 1:5"
  const rangeRegex = /^(.+?)\s+(\d+):(\d+)\s*-\s*(?:(\d+):)?(\d+)$/
  const match = normalized.match(rangeRegex);
  
  if (!match) {
    return null // Not a range query
  }

  const [, bookInput, chapterInput, verseStart, chapterEnd, verseEnd] = match
  const chapter = parseInt(chapterInput)
  const startVerse = parseInt(verseStart)
  const endChapter = chapterEnd ? parseInt(chapterEnd) : chapter;
  const endVerse = parseInt(verseEnd)

  // Find the book
  const normalizeBookName = (name) => name.toLowerCase().replace(/[\s_]+/g, '_')
  const normalizedInput = normalizeBookName(bookInput)
  
  const bookName = Object.keys(bible.books).find(
    book => normalizeBookName(book) === normalizedInput
  );

  if (!bookName) {
    return {
      success: false,
      error: `Book "${bookInput}" not found.`
    };
  }

  const book = bible.books[bookName];
  const verses = [];

  // Collect all verses in range
  if (chapter === endChapter) {
    // Same chapter
    const chapterVerses = book[chapter];
    if (!chapterVerses) {
      return {
        success: false,
        error: `Chapter ${chapter} not found in ${bookName}.`
      };
    }
    for (let v = startVerse; v <= endVerse; v++) {
      if (chapterVerses[v - 1]) {
        verses.push({
          verse: v,
          text: chapterVerses[v - 1]
        });
      }
    }
  } else {
    // Multiple chapters
    for (let ch = chapter; ch <= endChapter; ch++) {
      const chapterVerses = book[ch]
      if (!chapterVerses) continue

      const start = ch === chapter ? startVerse : 1
      const end = ch === endChapter ? endVerse : chapterVerses.length

      for (let v = start; v <= end; v++) {
        if (chapterVerses[v - 1]) {
          verses.push({
            chapter: ch,
            verse: v,
            text: chapterVerses[v - 1]
          })
        }
      }
    }
  }

  if (verses.length === 0) {
    return {
      success: false,
      error: `No verses found in range ${bookName} ${chapter}:${startVerse}-${endVerse}`
    }
  }

  return {
    success: true,
    book: bookName,
    range: `${bookName.replace(/_/g, ' ')} ${chapter}:${startVerse}-${endChapter}:${endVerse}`,
    verses: verses
  };
}

// Main search function
function search(bible, query) {
  // Try range search first
  const rangeResult = searchRange(bible, query);
  if (rangeResult) {
    return rangeResult;
  }

  return searchVerse(bible, query);
}

function displayResult(result) {
  if (!result.success) {
    console.log(`Error: ${result.error}`);
    return;
  }

  if (result.verses) {
    // Range result
    console.log(`\n ${result.range}\n`);
    result.verses.forEach(v => {
      const chapter = v.chapter || result.verses[0].chapter || 1;
      const text = v.text.replace(/\/n/g, '\n');
      console.log(`${result.book.replace(/_/g, ' ')} ${chapter}:${v.verse} - ${text}`);
    });
  } else {
    // Single verse result
    const text = result.text.replace(/\/n/g, '\n');
    console.log(`\n ${result.reference}\n${text}\n`);
  }
}

// Usage example:
const biblePath = './bible.json';
const bible = loadBible(biblePath);

if (bible) {
  // Examples
  console.log('=== SINGLE VERSE SEARCHES ===');
  displayResult(search(bible, 'genesis 1:1'));
  displayResult(search(bible, 'GEneSis        1   :   2'));
  displayResult(search(bible, '1_corintios 1:1'));
  displayResult(search(bible, '1 CORINTIOS 13:4'));

  console.log('\n=== RANGE SEARCHES ===');
  displayResult(search(bible, 'genesis 1:1-3'));
  displayResult(search(bible, 'psalms 23:1-6'));
}

// Export functions for use in other files
export { loadBible, search, displayResult };