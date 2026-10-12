/**
 * Code editor (CodeMirror 6) with line numbers, bracket matching, indentation and syntax
 * highlighting. Its theme reads the palette's CSS variables, so it follows the app theme.
 * Load it lazily: `const CodeEditor = lazy(() => import('@/components/CodeEditor'))`.
 */
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { SQLite, sql } from '@codemirror/lang-sql';
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import CodeMirror from '@uiw/react-codemirror';
import { useMemo } from 'react';
import { useTheme } from '@/app/useTheme';

export type EditorLanguage = 'python' | 'javascript' | 'typescript' | 'sql' | 'c' | 'java' | 'bash' | 'markdown';

function languageExtension(language: EditorLanguage): Extension {
  switch (language) {
    case 'python':
      return python();
    case 'javascript':
      return javascript();
    case 'typescript':
      return javascript({ typescript: true });
    case 'sql':
      return sql({ dialect: SQLite });
    case 'c':
      return cpp();
    case 'java':
      return java();
    case 'bash':
      return StreamLanguage.define(shell);
    case 'markdown':
      return markdown();
  }
}

const sheetTheme = (dark: boolean) =>
  EditorView.theme(
    {
      '&': { backgroundColor: 'var(--sheet)', color: 'var(--ink)', fontSize: '0.875rem' },
      '.cm-content': { fontFamily: 'var(--font-code)', caretColor: 'var(--print)', padding: '10px 0' },
      '.cm-scroller': { fontFamily: 'var(--font-code)', lineHeight: '1.6' },
      '.cm-gutters': { backgroundColor: 'var(--sheet-2)', color: 'var(--ink-faint)', borderRight: '1px solid var(--rule)' },
      '.cm-activeLine': { backgroundColor: 'var(--print-soft)' },
      '.cm-activeLineGutter': { backgroundColor: 'var(--print-soft)', color: 'var(--print-strong)' },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--print)', borderLeftWidth: '2px' },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: 'var(--print-soft) !important' },
      '.cm-matchingBracket': { backgroundColor: 'var(--print-soft)', outline: '1px solid var(--print-line)' },
      '&.cm-focused': { outline: 'none' },
      '.cm-placeholder': { color: 'var(--ink-faint)' },
      '.cm-tooltip': { backgroundColor: 'var(--sheet)', border: '1px solid var(--rule-strong)', color: 'var(--ink)' },
    },
    { dark },
  );

const sheetHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: [tags.keyword, tags.operatorKeyword, tags.modifier, tags.controlKeyword], color: 'var(--print-strong)' },
    { tag: [tags.string, tags.special(tags.string), tags.regexp], color: 'var(--correct)' },
    { tag: [tags.number, tags.bool, tags.null, tags.atom], color: 'var(--slip)' },
    { tag: [tags.comment, tags.lineComment, tags.blockComment], color: 'var(--ink-faint)', fontStyle: 'italic' },
    { tag: [tags.function(tags.variableName), tags.function(tags.propertyName), tags.definition(tags.function(tags.variableName))], color: 'var(--ink)', fontWeight: '600' },
    { tag: [tags.typeName, tags.className], color: 'var(--print)' },
    { tag: [tags.heading], color: 'var(--ink)', fontWeight: '700' },
    { tag: [tags.link, tags.url], color: 'var(--print-strong)', textDecoration: 'underline' },
  ]),
);

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: EditorLanguage;
  /** Ctrl/Cmd + Enter */
  onRun?: () => void;
  readOnly?: boolean;
  minHeight?: string;
  maxHeight?: string;
  label: string;
  placeholder?: string;
}

export default function CodeEditor({ value, onChange, language, onRun, readOnly = false, minHeight = '10rem', maxHeight = '32rem', label, placeholder }: CodeEditorProps) {
  const { resolved } = useTheme();
  const extensions = useMemo(
    () => [languageExtension(language), sheetTheme(resolved === 'dark'), sheetHighlight, EditorView.lineWrapping, EditorView.contentAttributes.of({ 'aria-label': label })],
    [language, resolved, label],
  );

  return (
    <div
      className="overflow-hidden rounded-md border border-rule-strong focus-within:border-print"
      onKeyDownCapture={(event) => {
        // Ctrl/Cmd + Enter runs the code. Caught before the editor sees it, so it does not also insert a line.
        if (onRun && event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          event.stopPropagation();
          onRun();
        }
      }}
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme="none"
        readOnly={readOnly}
        minHeight={minHeight}
        maxHeight={maxHeight}
        placeholder={placeholder}
        basicSetup={{ foldGutter: false, highlightActiveLine: true, autocompletion: true, bracketMatching: true, closeBrackets: true, indentOnInput: true, tabSize: language === 'python' ? 4 : 2 }}
        indentWithTab
      />
    </div>
  );
}
