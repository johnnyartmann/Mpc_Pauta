"use client";

import { useRef, useCallback, useEffect, useState } from "react";

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichEditor({ content, onChange, placeholder }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [initialized, setInitialized] = useState(false);

  // Set initial content once
  useEffect(() => {
    if (editorRef.current && !initialized && content) {
      editorRef.current.innerHTML = content;
      setInitialized(true);
    }
  }, [content, initialized]);

  // Sync external content changes (from PDF import, pauta switch)
  useEffect(() => {
    if (editorRef.current && initialized && !isInternalChange.current && content !== undefined) {
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
      }
    }
    isInternalChange.current = false;
  }, [content, initialized]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCmd = (command: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, value);
    handleInput();
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm transition-shadow duration-200 focus-within:shadow-md focus-within:border-blue-300">
      <div className="rich-editor-toolbar">
        <ToolbarButton onClick={() => execCmd("bold")} title="Negrito">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 15.5H10V12.5H13.5C14.33 12.5 15 13.17 15 14C15 14.83 14.33 15.5 13.5 15.5ZM10 6.5H13C13.83 6.5 14.5 7.17 14.5 8C14.5 8.83 13.83 9.5 13 9.5H10V6.5ZM15.6 10.79C16.57 10.12 17.25 9.02 17.25 8C17.25 5.74 15.5 4 13.25 4H7V18H14.04C16.13 18 17.75 16.3 17.75 14.21C17.75 12.69 16.89 11.39 15.6 10.79Z"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => execCmd("italic")} title="Itálico">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4V7H12.21L8.79 17H6V20H14V17H11.79L15.21 7H18V4H10Z"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => execCmd("underline")} title="Sublinhado">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17C15.31 17 18 14.31 18 11V3H15.5V11C15.5 12.93 13.93 14.5 12 14.5S8.5 12.93 8.5 11V3H6V11C6 14.31 8.69 17 12 17ZM5 19V21H19V19H5Z"/></svg>
        </ToolbarButton>
        <div className="rich-editor-divider" />
        <ToolbarButton onClick={() => execCmd("insertOrderedList")} title="Lista Ordenada">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 17H4V17.5H3V18.5H4V19H2V20H5V16H2V17ZM3 8H4V4H2V5H3V8ZM2 11H3.8L2 13.1V14H5V13H3.2L5 10.9V10H2V11ZM7 5V7H21V5H7ZM7 19H21V17H7V19ZM7 13H21V11H7V13Z"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => execCmd("insertUnorderedList")} title="Lista">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5C3.17 10.5 2.5 11.17 2.5 12S3.17 13.5 4 13.5 5.5 12.83 5.5 12 4.83 10.5 4 10.5ZM4 4.5C3.17 4.5 2.5 5.17 2.5 6S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5ZM4 16.5C3.17 16.5 2.5 17.18 2.5 18S3.18 19.5 4 19.5 5.5 18.82 5.5 18 4.83 16.5 4 16.5ZM7 19H21V17H7V19ZM7 13H21V11H7V13ZM7 5V7H21V5H7Z"/></svg>
        </ToolbarButton>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="rich-editor-content"
        data-placeholder={placeholder}
      />
    </div>
  );
}

function ToolbarButton({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button type="button" onClick={onClick} title={title} className="rich-editor-btn">
      {children}
    </button>
  );
}
