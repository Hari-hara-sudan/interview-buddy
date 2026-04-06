/**
 * Client-side real-time typo detection engine.
 * Uses keyword dictionaries per language + Levenshtein distance for fuzzy matching.
 * Zero API calls — instant detection.
 */

// ── Keyword Dictionaries ──────────────────────────────────────────────
const JAVASCRIPT_KEYWORDS = [
    // Core language keywords
    "break", "case", "catch", "class", "const", "continue", "debugger",
    "default", "delete", "do", "else", "export", "extends", "false",
    "finally", "for", "function", "if", "import", "in", "instanceof",
    "let", "new", "null", "of", "return", "super", "switch", "this",
    "throw", "true", "try", "typeof", "undefined", "var", "void",
    "while", "with", "yield", "async", "await", "static", "get", "set",
    "constructor", "prototype", "arguments", "eval", "new", "void",
    // String methods
    "charAt", "charCodeAt", "concat", "endsWith", "includes", "indexOf",
    "lastIndexOf", "match", "replace", "replaceAll", "search", "slice",
    "split", "substring", "substr", "toLowerCase", "toUpperCase", "trim",
    "trimStart", "trimEnd", "startsWith", "padStart", "padEnd", "repeat",
    // Array methods
    "push", "pop", "shift", "unshift", "slice", "splice", "concat",
    "map", "filter", "reduce", "reduceRight", "forEach", "find", "findIndex",
    "includes", "indexOf", "lastIndexOf", "some", "every", "sort", "reverse",
    "flat", "flatMap", "fill", "copyWithin", "entries", "keys", "values",
    // Object methods
    "create", "defineProperty", "defineProperties", "assign", "keys", "values",
    "entries", "freeze", "seal", "preventExtensions", "getPrototypeOf",
    "setPrototypeOf", "getOwnPropertyDescriptor", "getOwnPropertyDescriptors",
    // Built-in objects
    "console", "log", "error", "warn", "info", "table", "assert", "clear",
    "count", "time", "timeEnd", "trace", "group", "groupEnd", "groupCollapsed",
    "Math", "abs", "ceil", "floor", "round", "max", "min", "pow", "sqrt",
    "random", "sin", "cos", "tan", "PI", "E",
    "Array", "Object", "String", "Number", "Boolean", "Promise", "Symbol",
    "Map", "Set", "WeakMap", "WeakSet", "Proxy", "Reflect", "Error",
    "TypeError", "ReferenceError", "SyntaxError", "RangeError", "Date",
    "RegExp", "JSON", "parse", "stringify", "parseFloat", "parseInt",
    "isNaN", "isFinite", "encodeURIComponent", "decodeURIComponent",
    "setTimeout", "setInterval", "setImmediate", "clearTimeout", "clearInterval",
    "requestAnimationFrame", "cancelAnimationFrame", "fetch", "Promise",
    // DOM/Web APIs
    "document", "window", "localStorage", "sessionStorage", "location",
    "history", "navigator", "screen", "alert", "confirm", "prompt",
    "addEventListener", "removeEventListener", "querySelector", "querySelectorAll",
    "getElementById", "getElementsByClassName", "getElementsByTagName",
    "createElement", "appendChild", "removeChild", "innerHTML", "textContent",
];

const PYTHON_KEYWORDS = [
    // Core language keywords
    "and", "as", "assert", "async", "await", "break", "class", "continue",
    "def", "del", "elif", "else", "except", "finally", "for", "from",
    "global", "if", "import", "in", "is", "lambda", "nonlocal", "not",
    "or", "pass", "raise", "return", "try", "while", "with", "yield",
    "False", "None", "True",
    // Built-in functions
    "abs", "all", "any", "ascii", "bin", "bool", "breakpoint", "bytearray",
    "bytes", "callable", "chr", "classmethod", "compile", "complex", "copyright",
    "delattr", "dict", "dir", "divmod", "enumerate", "eval", "exec", "exit",
    "filter", "float", "format", "frozenset", "getattr", "globals", "hasattr",
    "hash", "help", "hex", "id", "input", "int", "isinstance", "issubclass",
    "iter", "len", "license", "list", "locals", "map", "max", "memoryview",
    "min", "next", "object", "oct", "open", "ord", "pow", "print", "property",
    "range", "repr", "reversed", "round", "set", "setattr", "slice", "sorted",
    "staticmethod", "str", "sum", "super", "tuple", "type", "vars", "zip",
    // String methods
    "capitalize", "casefold", "center", "count", "encode", "endswith", "expandtabs",
    "find", "format", "format_map", "index", "isalnum", "isalpha", "isascii",
    "isdecimal", "isdigit", "isidentifier", "islower", "isnumeric", "isprintable",
    "isspace", "istitle", "isupper", "join", "ljust", "lower", "lstrip",
    "maketrans", "partition", "replace", "rfind", "rindex", "rjust", "rpartition",
    "rsplit", "rstrip", "split", "splitlines", "startswith", "strip", "swapcase",
    "title", "translate", "upper", "zfill",
    // List methods
    "append", "clear", "copy", "count", "extend", "index", "insert", "pop",
    "remove", "reverse", "sort",
    // Dict methods
    "clear", "copy", "fromkeys", "get", "items", "keys", "pop", "popitem",
    "setdefault", "update", "values",
    // Set methods
    "add", "clear", "copy", "difference", "difference_update", "discard",
    "intersection", "intersection_update", "isdisjoint", "issubset", "issuperset",
    "pop", "remove", "symmetric_difference", "symmetric_difference_update", "union",
    "update",
    // Commonly used modules
    "math", "import", "sys", "os", "random", "time", "datetime", "json",
    "re", "collections", "itertools", "functools", "operator", "string",
    "io", "pickle", "csv", "pathlib", "typing", "subprocess",
];

const JAVA_KEYWORDS = [
    // Core language keywords
    "abstract", "assert", "boolean", "break", "byte", "case", "catch",
    "char", "class", "const", "continue", "default", "do", "double",
    "else", "enum", "extends", "final", "finally", "float", "for",
    "goto", "if", "implements", "import", "instanceof", "int", "interface",
    "long", "native", "new", "null", "package", "private", "protected",
    "public", "return", "short", "static", "strictfp", "super", "switch",
    "synchronized", "this", "throw", "throws", "transient", "try", "void",
    "volatile", "while",
    // String methods
    "charAt", "charCodeAt", "concat", "contains", "contentEquals", "endsWith",
    "equals", "equalsIgnoreCase", "format", "getBytes", "getChars", "hashCode",
    "indexOf", "lastIndexOf", "length", "matches", "replace", "replaceAll",
    "replaceFirst", "split", "startsWith", "subSequence", "substring", "toLowerCase",
    "toUpperCase", "trim",
    // Collection methods
    "add", "addAll", "clear", "contains", "containsAll", "isEmpty", "iterator",
    "remove", "removeAll", "retainAll", "size", "stream", "toArray",
    // List methods
    "addAll", "get", "indexOf", "lastIndexOf", "listIterator", "remove", "set",
    "subList",
    // Map methods
    "clear", "containsKey", "containsValue", "entrySet", "get", "getOrDefault",
    "keySet", "put", "putAll", "putIfAbsent", "remove", "replace", "size", "values",
    // Built-in classes
    "String", "Integer", "Double", "Float", "Long", "Short", "Byte", "Boolean",
    "Character", "Number", "Object", "Class", "Throwable", "Exception",
    "RuntimeException", "ArrayList", "LinkedList", "HashMap", "HashSet",
    "TreeMap", "TreeSet", "LinkedHashMap", "LinkedHashSet", "PriorityQueue",
    "Arrays", "Collections", "Math", "System", "Scanner", "File", "FileReader",
    "FileWriter", "BufferedReader", "BufferedWriter", "PrintWriter", "Pattern",
    "Matcher", "Thread", "Runnable", "Callable", "Future", "ExecutorService",
    "Optional", "Stream", "Comparator", "Comparable", "Serializable", "Cloneable",
    // Common methods
    "println", "print", "System", "out", "in", "err", "main", "public", "static",
    "void", "new", "this", "super", "extends", "implements", "interface",
];

const KEYWORD_MAP: Record<string, string[]> = {
    javascript: JAVASCRIPT_KEYWORDS,
    python: PYTHON_KEYWORDS,
    java: JAVA_KEYWORDS,
};

// ── Common Typo Map (Most Frequently Made Mistakes) ────────────────────
const COMMON_TYPOS: Record<string, string> = {
    // Control flow
    "fur": "for", "whiel": "while", "wile": "while", "fro": "for", "forr": "for",
    "iff": "if", "inif": "if", "retrun": "return", "retrn": "return",
    "retun": "return", "reutrn": "return", "funciton": "function",
    "functin": "function", "functoin": "function", "functino": "function",
    // Booleans
    "tre": "true", "tru": "true", "flase": "false", "fals": "false", "fasle": "false",
    // Variables
    "lett": "let", "conts": "const", "consti": "const",
    // Array/Object
    "puchh": "push", "popp": "pop", "shfit": "shift", "unshfit": "unshift",
    "slcie": "slice", "splcie": "splice", "mapp": "map", "fiter": "filter",
    "filet": "filter", "reduc": "reduce", "forEac": "forEach", "forEacH": "forEach",
    // Python
    "prnt": "print", "pritn": "print", "prin": "print", "defn": "def", "deff": "def",
    "il": "if", "raneg": "range", "ragne": "range", "lne": "len", "lent": "len",
    "lennth": "length", "appen": "append", "apend": "append", "apendd": "append",
    "exten": "extend", "extned": "extend", "remmove": "remove", "remve": "remove",
    "sorrt": "sort", "serach": "search", "serch": "search",
    // Java
    "printl": "println", "pritln": "println", "prisntln": "println",
    "Sytem": "System", "Systme": "System", "Strig": "String", "Stirng": "String",
    "Strign": "String", "publi": "public", "publc": "public", "publci": "public",
    "staitic": "static", "statci": "static", "sattic": "static",
    "vodi": "void", "viod": "void", "pbulic": "public",
    // Methods
    "lenght": "length", "lengt": "length", "lenthg": "length",
    "uppecase": "uppercase", "uppercse": "uppercase",
    "lowercse": "lowercase", "loweracse": "lowercase",
    "substirng": "substring", "substrng": "substring",
    "concaat": "concat", "concatt": "concat",
    "inculdes": "includes", "incllude": "includes", "incldes": "includes",
    "indexof": "indexOf", "lastindexof": "lastIndexOf",
    "splitt": "split", "splits": "split", "spllit": "split",
    "replacee": "replace", "replac": "replace", "replase": "replace",
    "tostrng": "toString", "tostring": "toString", "tostirng": "toString",
    "parseint": "parseInt", "parsefloat": "parseFloat",
    "isnan": "isNaN", "isinfinit": "isfinite", "fininte": "isFinite",
    // Math
    "matth": "Math", "mah": "Math", "absol": "abs", "absl": "abs",
    "flor": "floor", "floow": "floor", "ceill": "ceil", "ciel": "ceil",
    "roound": "round", "rund": "round", "marx": "max", "sqare": "sqrt",
    "sqaurt": "sqrt", "powe": "pow", "poweer": "pow",
    // Variables
    "thsi": "this", "tis": "this", "selff": "self", "slf": "self",
    "supre": "super", "supr": "super", "consol": "console",
    "conssole": "console", "consle": "console",
    // Control
    "thow": "throw", "thrw": "throw", "cath": "catch", "ctach": "catch",
    "carch": "catch", "contineu": "continue", "contninue": "continue",
    "finaly": "finally", "finallly": "finally", "finanly": "finally",
    // Types
    "intg": "int", "intt": "int", "floa": "float", "floatt": "float",
    "stir": "str", "strr": "str", "booll": "bool", "bolean": "bool",
    "tupel": "tuple", "liste": "list", "lst": "list", "dct": "dict",
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
    const lowerWord = word.toLowerCase();

    // Layer 1: Check common typos first (exact matches in dictionary)
    if (COMMON_TYPOS[lowerWord]) {
        const suggestion = COMMON_TYPOS[lowerWord];
        return {
            typo: word,
            suggestion: suggestion,
            message: `Hey, I noticed you typed "${word}" — did you mean "${suggestion}"? That's a common typo!`,
        };
    }

    // Layer 2: Check keyword dictionary with Levenshtein distance
    const keywords = KEYWORD_MAP[language] || KEYWORD_MAP.javascript;

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
