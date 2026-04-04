/**
 * Client-side real-time typo detection engine.
 * Uses keyword dictionaries per language + Levenshtein distance for fuzzy matching.
 * Zero API calls — instant detection.
 */

// ── Keyword Dictionaries ──────────────────────────────────────────────
const JAVASCRIPT_KEYWORDS = [
    "break", "case", "catch", "class", "const", "continue", "debugger",
    "default", "delete", "do", "else", "export", "extends", "false",
    "finally", "for", "function", "if", "import", "in", "instanceof",
    "let", "new", "null", "of", "return", "super", "switch", "this",
    "throw", "true", "try", "typeof", "undefined", "var", "void",
    "while", "with", "yield", "async", "await",
    // Common builtins
    "console", "log", "push", "pop", "shift", "unshift", "slice", "splice",
    "map", "filter", "reduce", "forEach", "find", "includes", "indexOf",
    "length", "toString", "parseInt", "parseFloat", "isNaN", "Math",
    "Array", "Object", "String", "Number", "Boolean", "Promise",
    "setTimeout", "setInterval", "clearTimeout", "clearInterval",
    "JSON", "parse", "stringify",
];

const PYTHON_KEYWORDS = [
    "and", "as", "assert", "async", "await", "break", "class", "continue",
    "def", "del", "elif", "else", "except", "false", "finally", "for",
    "from", "global", "if", "import", "in", "is", "lambda", "none",
    "nonlocal", "not", "or", "pass", "raise", "return", "true", "try",
    "while", "with", "yield",
    // Common builtins
    "print", "range", "len", "list", "dict", "set", "tuple", "int",
    "float", "str", "bool", "type", "input", "open", "file", "self",
    "super", "init", "append", "extend", "remove", "sort", "sorted",
    "enumerate", "zip", "map", "filter", "reduce", "isinstance",
];

const JAVA_KEYWORDS = [
    "abstract", "assert", "boolean", "break", "byte", "case", "catch",
    "char", "class", "const", "continue", "default", "do", "double",
    "else", "enum", "extends", "final", "finally", "float", "for",
    "goto", "if", "implements", "import", "instanceof", "int",
    "interface", "long", "native", "new", "null", "package", "private",
    "protected", "public", "return", "short", "static", "strictfp",
    "super", "switch", "synchronized", "this", "throw", "throws",
    "transient", "try", "void", "volatile", "while",
    // Common builtins
    "System", "out", "println", "String", "Integer", "Double", "Boolean",
    "ArrayList", "HashMap", "HashSet", "LinkedList", "Collections",
    "Arrays", "Math", "Scanner", "Exception", "Override",
];

const KEYWORD_MAP: Record<string, string[]> = {
    javascript: JAVASCRIPT_KEYWORDS,
    python: PYTHON_KEYWORDS,
    java: JAVA_KEYWORDS,
};

// ── Levenshtein Distance ──────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
    }
    return dp[m][n];
}

// ── Typo Detection ────────────────────────────────────────────────────

export interface TypoMatch {
    typo: string;
    suggestion: string;
    message: string;
}

/**
 * Extracts the last "completed" word from the code.
 * A word is considered "complete" when followed by a boundary character.
 */
function extractLastCompletedWord(code: string): string | null {
    // Boundary chars that signal a word just ended
    const boundaryPattern = /[a-zA-Z_$][a-zA-Z0-9_$]*(?=[^a-zA-Z0-9_$]?\s*$)/;

    // Get last ~50 chars to extract the recent word
    const tail = code.slice(-50);

    // Find the last word that was just completed (followed by non-alpha or end)
    const words = tail.match(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g);
    if (!words || words.length === 0) return null;

    return words[words.length - 1];
}

/**
 * Check if a word is a near-miss typo of a known keyword.
 * Returns TypoMatch if a typo is detected, null otherwise.
 */
function checkWordForTypo(word: string, language: string): TypoMatch | null {
    const keywords = KEYWORD_MAP[language] || KEYWORD_MAP.javascript;
    const lowerWord = word.toLowerCase();

    // If the word IS a valid keyword, no typo
    if (keywords.some(k => k.toLowerCase() === lowerWord)) return null;

    // Skip very short words (1-2 chars) — too many false positives
    if (word.length < 3) return null;

    // Skip words that look like variable names (camelCase, has numbers, etc.)
    // We only check words that are CLOSE to a keyword
    let bestMatch: string | null = null;
    let bestDistance = Infinity;

    for (const keyword of keywords) {
        // Only compare words of similar length (±2 chars)
        if (Math.abs(keyword.length - word.length) > 2) continue;

        const dist = levenshtein(lowerWord, keyword.toLowerCase());

        // A typo is 1 or 2 edits away from a real keyword
        // For short words (3-4 chars), only allow distance 1
        const maxDist = word.length <= 4 ? 1 : 2;

        if (dist > 0 && dist <= maxDist && dist < bestDistance) {
            bestDistance = dist;
            bestMatch = keyword;
        }
    }

    if (bestMatch) {
        return {
            typo: word,
            suggestion: bestMatch,
            message: `Hey, I noticed you typed "${word}" — did you mean "${bestMatch}"? That looks like a typo!`,
        };
    }

    return null;
}

// ── Debounce / Tracking ───────────────────────────────────────────────

// Track which typos we've already reported (avoid repeating)
const reportedTypos = new Set<string>();

/**
 * Main entry point: Checks the latest code for new typos.
 * Returns a TypoMatch if a NEW typo is found, null otherwise.
 */
export function detectTypo(code: string, previousCode: string, language: string): TypoMatch | null {
    // Only check if code actually changed
    if (code === previousCode) return null;

    // Find the diff — what was just typed
    // Get the new characters that were added
    const addedText = code.length > previousCode.length
        ? code.slice(previousCode.length)
        : "";

    // Check if the user just typed a boundary character (space, bracket, semicolon, paren, etc.)
    const boundaryChars = [" ", "(", ")", "{", "}", ";", ":", ",", ".", "\n", "\t", "[", "]"];
    const lastChar = addedText.slice(-1);

    if (!boundaryChars.includes(lastChar) && addedText.length <= 2) {
        // User is still typing a word, wait for boundary
        return null;
    }

    // Extract the word that was just completed (right before the boundary)
    const beforeBoundary = code.slice(0, code.length - (boundaryChars.includes(lastChar) ? 1 : 0));
    const wordMatch = beforeBoundary.match(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*$/);

    if (!wordMatch) return null;

    const word = wordMatch[1];

    // Skip if we already reported this exact typo
    const typoKey = `${word}@${code.length}`;
    if (reportedTypos.has(word)) return null;

    const match = checkWordForTypo(word, language);

    if (match) {
        reportedTypos.add(word);
        // Clean up old entries after 30 seconds (allow re-detection if they fix and re-type)
        setTimeout(() => reportedTypos.delete(word), 30000);
        return match;
    }

    return null;
}

/**
 * Reset all tracked typos (call when switching questions/languages).
 */
export function resetTypoTracking(): void {
    reportedTypos.clear();
}
