/**
 * Piston API Client - Real code execution
 * Free public API: https://emkc.org/api/v2/piston/execute
 */

export interface PistonExecuteRequest {
    language: string;
    version: string;
    files: Array<{
        name?: string;
        content: string;
    }>;
    args?: string[];
    stdin?: string;
    compile_timeout?: number;
    run_timeout?: number;
    compile_memory_limit?: number;
    run_memory_limit?: number;
}

export interface PistonExecuteResponse {
    language: string;
    version: string;
    run: {
        stdout: string;
        stderr: string;
        output: string;
        code: number | null;
        signal: string | null;
    };
}

export interface CodeExecutionResult {
    status: "success" | "error" | "timeout";
    stdout: string;
    stderr: string;
    code: number | null;
    passed: number;
    total: number;
    testResults: Array<{
        input: string;
        expected: string;
        actual: string;
        passed: boolean;
    }>;
}

// Map user language selection to Piston language
const languageMap: Record<string, string> = {
    javascript: "javascript",
    python: "python",
    java: "java",
};

/**
 * Execute code using Piston API
 */
export async function executeCode(
    language: "javascript" | "python" | "java",
    code: string,
    testCases: Array<{ input: string; expected: string }>
): Promise<CodeExecutionResult> {
    const pistonLang = languageMap[language] || language;

    // Wrap code with test execution logic
    const wrappedCode = wrapCodeWithTests(language, code, testCases);

    const payload: PistonExecuteRequest = {
        language: pistonLang,
        version: "*",
        files: [
            {
                name: `solution.${getFileExtension(language)}`,
                content: wrappedCode,
            },
        ],
        compile_timeout: 10000,
        run_timeout: 10000,
    };

    try {
        const response = await fetch("https://emkc.org/api/v2/piston/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = (await response.json()) as PistonExecuteResponse;

        // Parse test results from output
        return parseTestResults(result, testCases);
    } catch (error) {
        console.error("Piston API error:", error);
        return {
            status: "error",
            stdout: "",
            stderr: error instanceof Error ? error.message : "Unknown error",
            code: 1,
            passed: 0,
            total: testCases.length,
            testResults: testCases.map((tc) => ({
                input: tc.input,
                expected: tc.expected,
                actual: "ERROR",
                passed: false,
            })),
        };
    }
}

/**
 * Wrap user code with test harness
 */
function wrapCodeWithTests(
    language: "javascript" | "python" | "java",
    userCode: string,
    testCases: Array<{ input: string; expected: string }>
): string {
    if (language === "javascript") {
        return wrapJavaScript(userCode, testCases);
    } else if (language === "python") {
        return wrapPython(userCode, testCases);
    } else if (language === "java") {
        return wrapJava(userCode, testCases);
    }
    return userCode;
}

function wrapJavaScript(userCode: string, testCases: Array<{ input: string; expected: string }>): string {
    const testJson = JSON.stringify(testCases);
    return `
${userCode}

// Test harness
const testCases = ${testJson};
const results = [];

for (const tc of testCases) {
    try {
        const actual = String(solve(tc.input));
        const passed = actual === tc.expected;
        results.push({
            input: tc.input,
            expected: tc.expected,
            actual: actual,
            passed: passed
        });
        console.log(JSON.stringify({
            type: 'test',
            input: tc.input,
            expected: tc.expected,
            actual: actual,
            passed: passed
        }));
    } catch (e) {
        console.error('ERROR:' + e.message);
        results.push({
            input: tc.input,
            expected: tc.expected,
            actual: 'ERROR',
            passed: false
        });
    }
}

console.log(JSON.stringify({ type: 'summary', results: results }));
`;
}

function wrapPython(userCode: string, testCases: Array<{ input: string; expected: string }>): string {
    const testJson = JSON.stringify(testCases);
    return `
import json
${userCode}

# Test harness
test_cases = ${testJson}
results = []

for tc in test_cases:
    try:
        actual = str(solve(tc['input']))
        passed = actual == tc['expected']
        results.append({
            'input': tc['input'],
            'expected': tc['expected'],
            'actual': actual,
            'passed': passed
        })
        print(json.dumps({
            'type': 'test',
            'input': tc['input'],
            'expected': tc['expected'],
            'actual': actual,
            'passed': passed
        }))
    except Exception as e:
        print(f'ERROR:{str(e)}')
        results.append({
            'input': tc['input'],
            'expected': tc['expected'],
            'actual': 'ERROR',
            'passed': False
        })

print(json.dumps({'type': 'summary', 'results': results}))
`;
}

function wrapJava(userCode: string, testCases: Array<{ input: string; expected: string }>): string {
    const testJson = JSON.stringify(testCases);
    return `
import java.util.*;

public class Solution {
    ${userCode}
    
    public static void main(String[] args) {
        String testJson = '${testJson}';
        // Parse and run tests
        List<Map<String, Object>> results = new ArrayList<>();
        
        // Note: For Java, we'd need JSON parsing - simplified version
        System.out.println("Java execution requires additional setup for test parsing");
    }
}
`;
}

function getFileExtension(language: "javascript" | "python" | "java"): string {
    const extensions: Record<string, string> = {
        javascript: "js",
        python: "py",
        java: "java",
    };
    return extensions[language] || language;
}

/**
 * Parse Piston execution output to extract test results
 */
function parseTestResults(
    pistonResult: PistonExecuteResponse,
    testCases: Array<{ input: string; expected: string }>
): CodeExecutionResult {
    const output = pistonResult.run.stdout + pistonResult.run.stderr;
    const testResults: CodeExecutionResult["testResults"] = [];

    // Try to extract individual test results from output
    const lines = output.split("\n");
    let passed = 0;
    let hasValidResults = false;

    for (const line of lines) {
        if (line.includes("type") && line.includes("test")) {
            try {
                const obj = JSON.parse(line);
                if (obj.type === "test") {
                    testResults.push({
                        input: obj.input,
                        expected: obj.expected,
                        actual: obj.actual,
                        passed: obj.passed,
                    });
                    if (obj.passed) passed++;
                    hasValidResults = true;
                }
            } catch (e) {
                // Skip malformed JSON lines
            }
        }
    }

    // Fallback: if no test results found, create based on output
    if (!hasValidResults) {
        for (let i = 0; i < testCases.length; i++) {
            testResults.push({
                input: testCases[i].input,
                expected: testCases[i].expected,
                actual: "Unable to execute",
                passed: false,
            });
        }
    }

    return {
        status: pistonResult.run.code === 0 ? "success" : "error",
        stdout: pistonResult.run.stdout,
        stderr: pistonResult.run.stderr,
        code: pistonResult.run.code,
        passed: passed,
        total: testCases.length,
        testResults: testResults,
    };
}
