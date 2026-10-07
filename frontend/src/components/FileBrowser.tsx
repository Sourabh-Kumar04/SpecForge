import React, { useState, useEffect } from 'react';
import { GeneratedFile } from '../types';
import { FileCode, Copy, Check, Download, Folder, FileText } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';

interface FileBrowserProps {
  files: GeneratedFile[];
  downloadUrl?: string;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({ files, downloadUrl }) => {
  const [selectedPath, setSelectedPath] = useState<string>(files[0]?.path || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (files.length > 0 && !files.some(f => f.path === selectedPath)) {
      setSelectedPath(files[0].path);
    }
  }, [files]);

  useEffect(() => {
    Prism.highlightAll();
  }, [selectedPath, files]);

  const activeFile = files.find(f => f.path === selectedPath) || files[0];

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getGrammarLanguage = (lang: string, path: string) => {
    if (path.endsWith('.py')) return 'python';
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
    if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.md')) return 'markdown';
    if (path.endsWith('.sh') || path.endsWith('requirements.txt')) return 'bash';
    return 'none';
  };

  if (!files || files.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '3rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
      }}>
        <Folder size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
        <p>No repository files generated yet.</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      overflow: 'hidden',
      marginBottom: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
    }}>
      {/* Top Bar */}
      <div style={{
        padding: '0.85rem 1.25rem',
        background: 'rgba(255, 255, 255, 0.02)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Folder size={17} color="#38bdf8" />
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
            Generated Repository Workspace ({files.length} files)
          </h3>
        </div>

        {downloadUrl && (
          <a
            href={downloadUrl}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '7px',
              background: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #334155',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={13} />
            <span>Download ZIP</span>
          </a>
        )}
      </div>

      {/* Main Split Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '440px' }}>
        {/* Left File Tree */}
        <div style={{
          background: 'var(--bg-card-subtle)',
          borderRight: '1px solid var(--border)',
          padding: '0.75rem 0.5rem',
          overflowY: 'auto',
          maxHeight: '520px',
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0.4rem 0.6rem', marginBottom: '0.3rem' }}>
            Project Files
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {files.map((file) => {
              const isSelected = file.path === selectedPath;
              const isTest = file.path.includes('test');
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedPath(file.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: isSelected ? '#1e293b' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 600 : 400,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    transition: 'all 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <FileCode size={14} color={isTest ? '#f59e0b' : (isSelected ? '#38bdf8' : '#64748b')} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.path}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Code Viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#0d1117' }}>
          {activeFile && (
            <>
              <div style={{
                padding: '0.55rem 1rem',
                borderBottom: '1px solid var(--border)',
                background: '#161b22',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={14} color="#94a3b8" />
                  <span style={{ fontSize: '0.82rem', fontFamily: 'JetBrains Mono, monospace', color: '#e2e8f0', fontWeight: 600 }}>
                    {activeFile.path}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    ({activeFile.content.split('\n').length} lines)
                  </span>
                </div>

                <button
                  onClick={handleCopy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '5px',
                    background: '#21262d',
                    border: '1px solid #30363d',
                    color: '#c9d1d9',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  {copied ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div style={{ padding: '1rem', overflowX: 'auto', flex: 1, maxHeight: '480px' }}>
                <pre style={{ margin: 0, background: 'transparent' }}>
                  <code className={`language-${getGrammarLanguage(activeFile.language, activeFile.path)}`} style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                    {activeFile.content}
                  </code>
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
