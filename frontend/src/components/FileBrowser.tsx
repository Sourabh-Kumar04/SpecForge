import React, { useState, useEffect, useMemo } from 'react';
import { GeneratedFile } from '../types';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Folder,
  FileText,
  Search,
  FlaskConical,
  Terminal,
  Code,
} from 'lucide-react';
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
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeFile = files.find((f) => f.path === selectedPath) || files[0];

  useEffect(() => {
    Prism.highlightAll();
  }, [activeFile?.path, files]);

  const totalLines = useMemo(() => {
    return files.reduce((acc, f) => acc + (f.content ? f.content.split('\n').length : 0), 0);
  }, [files]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const query = searchQuery.toLowerCase();
    return files.filter((f) => f.path.toLowerCase().includes(query));
  }, [files, searchQuery]);

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
    return lang || 'none';
  };

  const getFileIcon = (path: string) => {
    if (path.includes('test') || path.endsWith('_test.py')) {
      return <FlaskConical size={14} color="#f59e0b" />;
    }
    if (path.endsWith('.py')) {
      return <FileCode size={14} color="var(--accent-cyan-bright)" />;
    }
    if (path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.js')) {
      return <Code size={14} color="#a78bfa" />;
    }
    if (path.endsWith('.md')) {
      return <FileText size={14} color="#94a3b8" />;
    }
    if (path.endsWith('.sh') || path.endsWith('requirements.txt')) {
      return <Terminal size={14} color="#34d399" />;
    }
    return <FileCode size={14} color="var(--text-muted)" />;
  };

  if (!files || files.length === 0) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          marginBottom: '1.75rem',
        }}
      >
        <Folder size={36} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          No Repository Files Generated Yet
        </h4>
        <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
          Submit a specification above to trigger autonomous code generation.
        </p>
      </div>
    );
  }

  return (
    <div
      className="glass-panel"
      style={{
        overflow: 'hidden',
        marginBottom: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Action Bar */}
      <div
        style={{
          padding: '0.85rem 1.35rem',
          background: 'rgba(15, 20, 32, 0.75)',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Folder size={18} color="var(--accent-cyan-bright)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
            Generated Repository Workspace
          </h3>
          <span
            className="badge badge-cyan"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}
          >
            {files.length} file{files.length === 1 ? '' : 's'}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
            }}
          >
            {totalLines} lines generated
          </span>
        </div>

        {downloadUrl && (
          <a
            href={downloadUrl}
            download
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={14} />
            <span>Download Verified ZIP</span>
          </a>
        )}
      </div>

      {/* Main Split Layout: Sidebar + Code Preview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '270px 1fr',
          minHeight: '480px',
        }}
      >
        {/* Left File Tree Sidebar */}
        <div
          style={{
            background: 'rgba(8, 11, 18, 0.85)',
            borderRight: '1px solid var(--border-default)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* File Search */}
          <div style={{ padding: '0.65rem 0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.35rem 0.6rem',
              }}
            >
              <Search size={13} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Filter files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* File Item List */}
          <div
            style={{
              padding: '0.5rem',
              overflowY: 'auto',
              flex: 1,
              maxHeight: '520px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            {filteredFiles.map((file) => {
              const isSelected = file.path === (activeFile?.path || selectedPath);
              const isTest = file.path.includes('test') || file.path.endsWith('_test.py');
              const lines = file.content ? file.content.split('\n').length : 0;

              return (
                <button
                  type="button"
                  key={file.path}
                  onClick={() => setSelectedPath(file.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 600 : 400,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    transition: 'all 0.12s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getFileIcon(file.path)}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.path}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                    {isTest && (
                      <span
                        style={{
                          fontSize: '0.62rem',
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          padding: '0 4px',
                          borderRadius: '3px',
                          fontWeight: 700,
                        }}
                      >
                        TEST
                      </span>
                    )}
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                      {lines}L
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Code Viewer */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-input)',
            minWidth: 0,
          }}
        >
          {activeFile && (
            <>
              {/* Code Viewer Top Bar */}
              <div
                style={{
                  padding: '0.6rem 1.25rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'rgba(12, 16, 26, 0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                  <FileText size={15} color="var(--accent-cyan-bright)" />
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#ffffff',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activeFile.path}
                  </span>
                  <span
                    className="badge badge-slate"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      padding: '0.1rem 0.45rem',
                    }}
                  >
                    {activeFile.content.split('\n').length} lines
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: copied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${copied ? 'rgba(34, 197, 94, 0.4)' : 'var(--border-subtle)'}`,
                    color: copied ? 'var(--color-success-bright)' : '#cbd5e1',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {copied ? <Check size={13} color="var(--color-success-bright)" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Code Pre/Code Area */}
              <div
                style={{
                  padding: '1.25rem',
                  overflowX: 'auto',
                  flex: 1,
                  maxHeight: '500px',
                }}
              >
                <pre style={{ margin: 0, background: 'transparent' }}>
                  <code
                    className={`language-${getGrammarLanguage(activeFile.language, activeFile.path)}`}
                    style={{
                      fontSize: '0.82rem',
                      lineHeight: 1.6,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
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

export default FileBrowser;
