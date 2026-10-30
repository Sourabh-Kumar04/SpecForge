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
  Edit3,
  Eye,
  Save,
  RotateCcw,
  RefreshCw,
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
  jobId?: string;
  onSaveFile?: (path: string, content: string) => Promise<void>;
  onRetest?: () => Promise<void>;
  isRetesting?: boolean;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
  files,
  downloadUrl,
  jobId,
  onSaveFile,
  onRetest,
  isRetesting = false,
}) => {
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeFile = files.find((f) => f.path === selectedPath) || files[0];

  // Update edited content when file changes
  useEffect(() => {
    if (activeFile) {
      setEditedContent(activeFile.content);
      setIsEditing(false);
      setSaveSuccess(false);
    }
  }, [activeFile?.path]);

  // Prism highlight effect
  useEffect(() => {
    if (!isEditing) {
      Prism.highlightAll();
    }
  }, [activeFile?.path, files, isEditing]);

  const totalLines = useMemo(() => {
    return files.reduce((acc, f) => acc + (f.content ? f.content.split('\n').length : 0), 0);
  }, [files]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const query = searchQuery.toLowerCase();
    return files.filter((f) => f.path.toLowerCase().includes(query));
  }, [files, searchQuery]);

  const hasUnsavedChanges = activeFile && editedContent !== activeFile.content;

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(isEditing ? editedContent : activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!activeFile || !onSaveFile) return;
    setIsSaving(true);
    try {
      await onSaveFile(activeFile.path, editedContent);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save file:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (activeFile) {
      setEditedContent(activeFile.content);
    }
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
      return <FlaskConical size={14} color="var(--accent-amber-bright)" />;
    }
    if (path.endsWith('.py')) {
      return <FileCode size={14} color="var(--accent-amber-bright)" />;
    }
    if (path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.js')) {
      return <Code size={14} color="#ffa366" />;
    }
    if (path.endsWith('.md')) {
      return <FileText size={14} color="#94a3b8" />;
    }
    if (path.endsWith('.sh') || path.endsWith('requirements.txt')) {
      return <Terminal size={14} color="#cbd5e1" />;
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
        <Folder size={36} color="var(--accent-amber)" style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
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
        border: '1px solid var(--border-amber)',
      }}
    >
      {/* Top Action Bar */}
      <div
        style={{
          padding: '0.85rem 1.35rem',
          background: 'rgba(15, 16, 21, 0.95)',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Folder size={17} color="var(--accent-amber-bright)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
            Forged Repository Workspace
          </h3>
          <span
            className="badge badge-amber"
            style={{ fontSize: '0.68rem' }}
          >
            {files.length} FILE{files.length === 1 ? '' : 'S'}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
            }}
          >
            {totalLines} lines
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Re-run Tests Button */}
          {onRetest && (
            <button
              type="button"
              onClick={onRetest}
              disabled={isRetesting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 107, 26, 0.12)',
                border: '1px solid var(--border-amber)',
                color: 'var(--accent-amber-bright)',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                cursor: isRetesting ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Runs isolated sandbox test verification on current files"
            >
              {isRetesting ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <FlaskConical size={13} />
              )}
              <span>{isRetesting ? 'Running Sandbox...' : 'Re-run Tests'}</span>
            </button>
          )}

          {downloadUrl && (
            <a
              href={downloadUrl}
              download
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-success)',
                border: '1px solid var(--color-success)',
                color: '#ffffff',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.15s ease',
              }}
            >
              <Download size={13} />
              <span>Download ZIP</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Split Layout: Sidebar + Code Preview / Editor */}
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
            background: 'rgba(10, 11, 15, 0.9)',
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
                  fontSize: '0.76rem',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)',
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
                  onClick={() => {
                    setSelectedPath(file.path);
                    setIsEditing(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: isSelected ? 'rgba(255, 107, 26, 0.12)' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 600 : 400,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
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
                          background: 'rgba(255, 107, 26, 0.15)',
                          color: 'var(--accent-amber-bright)',
                          border: '1px solid rgba(255, 107, 26, 0.3)',
                          padding: '0 4px',
                          borderRadius: '2px',
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

        {/* Right Code Viewer & In-Browser Editor */}
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
              {/* Code Viewer / Editor Top Bar */}
              <div
                style={{
                  padding: '0.6rem 1.25rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'rgba(14, 15, 20, 0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                  <FileText size={15} color="var(--accent-amber-bright)" />
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
                    style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}
                  >
                    {(isEditing ? editedContent : activeFile.content).split('\n').length} lines
                  </span>

                  {hasUnsavedChanges && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        color: '#fbbf24',
                        padding: '1px 6px',
                        borderRadius: '2px',
                        fontWeight: 600,
                      }}
                    >
                      Unsaved edits
                    </span>
                  )}

                  {saveSuccess && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                        background: 'rgba(34, 197, 94, 0.15)',
                        border: '1px solid rgba(34, 197, 94, 0.35)',
                        color: 'var(--color-success-bright)',
                        padding: '1px 6px',
                        borderRadius: '2px',
                        fontWeight: 600,
                      }}
                    >
                      Saved!
                    </span>
                  )}
                </div>

                {/* Editor & Copy Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  {/* Toggle Edit / View */}
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isEditing ? 'rgba(255, 107, 26, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${isEditing ? 'var(--border-amber)' : 'var(--border-subtle)'}`,
                      color: isEditing ? 'var(--accent-amber-bright)' : '#cbd5e1',
                      fontSize: '0.74rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    {isEditing ? <Eye size={12} /> : <Edit3 size={12} />}
                    <span>{isEditing ? 'View Mode' : 'Edit Mode'}</span>
                  </button>

                  {isEditing && (
                    <>
                      {/* Save Button */}
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || !hasUnsavedChanges}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.3rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          background: hasUnsavedChanges
                            ? 'var(--accent-forge)'
                            : 'var(--bg-surface-elevated)',
                          border: `1px solid ${hasUnsavedChanges ? 'rgba(255, 255, 255, 0.2)' : 'var(--border-subtle)'}`,
                          color: '#ffffff',
                          fontSize: '0.74rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          cursor: hasUnsavedChanges ? 'pointer' : 'default',
                          opacity: hasUnsavedChanges ? 1 : 0.5,
                        }}
                      >
                        {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                        <span>Save File</span>
                      </button>

                      {/* Reset Changes */}
                      {hasUnsavedChanges && (
                        <button
                          type="button"
                          onClick={handleReset}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.3rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-muted)',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                          }}
                          title="Discard unsaved edits"
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                    </>
                  )}

                  {/* Copy Button */}
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
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? <Check size={12} color="var(--color-success-bright)" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Code Pre or Textarea Editor */}
              <div
                style={{
                  padding: '1.25rem',
                  overflowX: 'auto',
                  flex: 1,
                  maxHeight: '520px',
                  display: 'flex',
                }}
              >
                {isEditing ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '440px',
                      background: '#090a0d',
                      border: '1px solid var(--border-amber)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1rem',
                      color: '#f8fafc',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                      lineHeight: 1.6,
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <pre style={{ margin: 0, background: 'transparent', width: '100%' }}>
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
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileBrowser;
