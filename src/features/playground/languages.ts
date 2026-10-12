/** Languages in the playground: names, whether they can run here, and starter programs. */
import type { CodeLanguage } from '@/domain/content/types';
import { isRunnableLanguage } from './execution/codeRunner';

export interface LanguageInfo {
  id: CodeLanguage;
  name: string;
  /** How (or whether) the code runs. */
  runtime: string;
  extension: string;
  starter: string;
  starterStdin?: string;
}

export const LANGUAGES: LanguageInfo[] = [
  {
    id: 'python',
    name: 'Python',
    runtime: 'Python 3 (Pyodide) in a sandboxed worker in your browser',
    extension: 'py',
    starter: 'name = input("Your name: ")\nprint(f"Hello, {name}!")\n',
    starterStdin: 'Study Hub\n',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    runtime: 'A sandboxed worker in your browser; input() reads stdin lines',
    extension: 'js',
    starter: 'const values = [3, 1, 2];\nconsole.log(values.toSorted((a, b) => a - b));\n',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    runtime: 'Types are stripped, not checked, then it runs like JavaScript',
    extension: 'ts',
    starter: 'function greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("Study Hub"));\n',
  },
  {
    id: 'sql',
    name: 'SQL (SQLite)',
    runtime: 'SQLite in memory; every run starts from an empty database',
    extension: 'sql',
    starter: "CREATE TABLE notes (id INTEGER PRIMARY KEY, title TEXT);\nINSERT INTO notes (title) VALUES ('first'), ('second');\n\nSELECT * FROM notes;\n",
  },
  {
    id: 'c',
    name: 'C',
    runtime: 'Editor only: C cannot be compiled or run in Study Hub yet',
    extension: 'c',
    starter: '#include <stdio.h>\n\nint main(void) {\n  printf("Hello, Study Hub!\\n");\n  return 0;\n}\n',
  },
  {
    id: 'java',
    name: 'Java',
    runtime: 'Editor only: Java cannot be compiled or run in Study Hub yet',
    extension: 'java',
    starter: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, Study Hub!");\n  }\n}\n',
  },
  {
    id: 'bash',
    name: 'Bash',
    runtime: 'Editor only: shell scripts cannot be run in Study Hub',
    extension: 'sh',
    starter: '#!/usr/bin/env bash\nfor name in alpha beta; do\n  echo "Hello, $name"\ndone\n',
  },
];

const BY_ID = new Map(LANGUAGES.map((language) => [language.id, language]));

export function languageInfo(id: CodeLanguage): LanguageInfo {
  const info = BY_ID.get(id);
  if (!info) throw new Error(`Unknown language ${id}`);
  return info;
}

export const canRun = (id: CodeLanguage) => isRunnableLanguage(id);
