import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  RefreshCw,
  PackageCheck,
  Layers,
  FileCode,
} from 'lucide-react';
import { ComponentInventoryResponse, ComponentItem, JobDetail } from '../types';
import { fetchComponents } from '../api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';

interface ComponentsInventoryProps {
  currentJob?: JobDetail | null;
  onSelectComponent?: (comp: ComponentItem) => void;
}

export const ComponentsInventory: React.FC<ComponentsInventoryProps> = ({ currentJob }) => {
  const [data, setData] = useState<ComponentInventoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inventoryMode, setInventoryMode] = useState<'specforge' | 'project'>(
    currentJob?.files?.some((f) => f.path === 'COMPONENTS.md') ? 'project' : 'specforge'
  );

  const loadData = () => {
    setIsLoading(true);
    setError(null);
    fetchComponents()
      .then((res) => {
        setData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load component inventory');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const components = data?.components || [];
  const categories = ['all', ...Array.from(new Set(components.map((c) => c.category)))];

  const filteredComponents = components.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dependencies.some((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const projectComponentsFile = currentJob?.files?.find((f) => f.path === 'COMPONENTS.md');

  const totalLines = components.reduce((acc, c) => acc + c.line_count, 0);
  const runtimeDepsCount = data?.package_json?.dependencies
    ? Object.keys(data.package_json.dependencies).length
    : 0;
  const devDepsCount = data?.package_json?.devDependencies
    ? Object.keys(data.package_json.devDependencies).length
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Top Header Card */}
      <Card variant="accent">
        <CardHeader style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-forge)',
                  border: '1px solid var(--accent-forge-bright)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Boxes size={20} color="#ffffff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <CardTitle style={{ fontSize: '1.25rem' }}>Component Inventory Tracker</CardTitle>
                  <Badge variant="amber" size="sm">
                    LIVE INSPECTION
                  </Badge>
                  {data && (
                    <Badge variant="secondary" size="sm">
                      v{data.specforge_version}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Verified UI components, exact versions, and package dependencies sourced from real package manifests and component code.
                </CardDescription>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {projectComponentsFile && (
                <div style={{ display: 'flex', background: 'var(--bg-base)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => setInventoryMode('specforge')}
                    style={{
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.74rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      border: inventoryMode === 'specforge' ? '1px solid var(--border-amber)' : '1px solid transparent',
                      background: inventoryMode === 'specforge' ? 'var(--accent-forge-subtle)' : 'transparent',
                      color: inventoryMode === 'specforge' ? 'var(--accent-forge-bright)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    SpecForge App ({components.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInventoryMode('project')}
                    style={{
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.74rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      border: inventoryMode === 'project' ? '1px solid var(--border-amber)' : '1px solid transparent',
                      background: inventoryMode === 'project' ? 'var(--accent-forge-subtle)' : 'transparent',
                      color: inventoryMode === 'project' ? 'var(--accent-forge-bright)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    Generated Repo Inventory
                  </button>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
                title="Rescan component inventory from disk"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <Card variant="default">
          <CardHeader style={{ padding: '1rem 1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              TRACKED UI COMPONENTS
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {components.length}
              </span>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>modules</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-forge-bright)', marginTop: '0.2rem' }}>
              {totalLines.toLocaleString()} total lines of code
            </span>
          </CardHeader>
        </Card>

        <Card variant="default">
          <CardHeader style={{ padding: '1rem 1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              RUNTIME DEPENDENCIES
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {runtimeDepsCount}
              </span>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>packages</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-success-bright)', marginTop: '0.2rem' }}>
              From package.json dependencies
            </span>
          </CardHeader>
        </Card>

        <Card variant="default">
          <CardHeader style={{ padding: '1rem 1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              BUILD & DEV TOOLING
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {devDepsCount}
              </span>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>dev packages</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Vite, Oxlint, TypeScript
            </span>
          </CardHeader>
        </Card>

        <Card variant="default">
          <CardHeader style={{ padding: '1rem 1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              DESIGN ARCHITECTURE
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {categories.length - 1}
              </span>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>tiers</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Primitives, Views, Modals
            </span>
          </CardHeader>
        </Card>
      </div>

      {/* Package.json Direct Versions Callout */}
      {data?.package_json && (
        <Card variant="subtle">
          <CardContent style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
              <PackageCheck size={14} color="var(--accent-forge-bright)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                MANIFEST PACKAGES (package.json)
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {Object.entries(data.package_json.dependencies || {}).map(([pkg, ver]) => (
                <div
                  key={pkg}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-default)',
                    padding: '0.25rem 0.55rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pkg}</span>
                  <span style={{ color: 'var(--accent-forge-bright)' }}>{ver}</span>
                </div>
              ))}
              {Object.entries(data.package_json.devDependencies || {}).map(([pkg, ver]) => (
                <div
                  key={pkg}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.25rem 0.55rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{pkg}</span>
                  <span style={{ color: 'var(--text-dim)' }}>{ver}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Inventory View (if toggled) */}
      {inventoryMode === 'project' && projectComponentsFile && (
        <Card variant="default">
          <CardHeader style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCode size={16} color="var(--accent-forge-bright)" />
                <CardTitle style={{ fontSize: '1rem' }}>Generated Project COMPONENTS.md</CardTitle>
                <Badge variant="amber" size="sm">
                  {currentJob?.spec?.project_type || 'project'}
                </Badge>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Autonomously tracked upon generation
              </span>
            </div>
          </CardHeader>
          <CardContent style={{ padding: '1.25rem 1.5rem' }}>
            <pre
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                margin: 0,
              }}
            >
              {projectComponentsFile.content}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* SpecForge UI Components Table */}
      {inventoryMode === 'specforge' && (
        <Card variant="default">
          <CardHeader style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Layers size={16} color="var(--accent-forge-bright)" />
                <CardTitle style={{ fontSize: '1rem' }}>SpecForge Component Catalog</CardTitle>
                <Badge variant="secondary" size="sm">
                  {filteredComponents.length} showing
                </Badge>
              </div>

              {/* Search & Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '220px' }}>
                  <Input
                    placeholder="Search components or deps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '2rem', height: '32px', fontSize: '0.78rem' }}
                  />
                  <Search
                    size={13}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '0.25rem 0.55rem',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                        borderRadius: 'var(--radius-sm)',
                        border: selectedCategory === cat ? '1px solid var(--border-amber)' : '1px solid var(--border-subtle)',
                        background: selectedCategory === cat ? 'var(--accent-forge-subtle)' : 'var(--bg-surface)',
                        color: selectedCategory === cat ? 'var(--accent-forge-bright)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent style={{ padding: 0 }}>
            {isLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                Scanning frontend components and package dependencies...
              </div>
            ) : error ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-error-bright)', fontSize: '0.85rem' }}>
                {error}
              </div>
            ) : filteredComponents.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No components match the selected query.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>COMPONENT</TableHead>
                    <TableHead>CATEGORY</TableHead>
                    <TableHead>PACKAGE DEPENDENCIES & VERSIONS</TableHead>
                    <TableHead>INTERNAL IMPORTS</TableHead>
                    <TableHead style={{ textAlign: 'right' }}>LINES</TableHead>
                    <TableHead style={{ textAlign: 'right' }}>SIZE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComponents.map((comp) => (
                    <TableRow key={comp.path}>
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.86rem' }}>
                            {comp.name}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {comp.path}
                          </span>
                          {comp.exports && comp.exports.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                              {comp.exports.slice(0, 3).map((exp) => (
                                <span
                                  key={exp}
                                  style={{
                                    fontSize: '0.62rem',
                                    fontFamily: 'var(--font-mono)',
                                    color: 'var(--text-dim)',
                                    background: 'var(--bg-surface)',
                                    padding: '0.05rem 0.35rem',
                                    borderRadius: '2px',
                                  }}
                                >
                                  export {exp}
                                </span>
                              ))}
                              {comp.exports.length > 3 && (
                                <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                  +{comp.exports.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={comp.category.includes('Primitive') ? 'amber' : comp.category.includes('Modal') ? 'secondary' : 'default'}
                          size="sm"
                        >
                          {comp.category}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {comp.dependencies && comp.dependencies.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {comp.dependencies.map((dep) => (
                              <div
                                key={dep.name}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  background: 'var(--bg-surface-elevated)',
                                  border: '1px solid var(--border-default)',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '0.7rem',
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{dep.name}</span>
                                <span style={{ color: 'var(--accent-forge-bright)' }}>{dep.version}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            Zero external deps
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {comp.internal_dependencies && comp.internal_dependencies.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {comp.internal_dependencies.map((item) => (
                              <span
                                key={item}
                                style={{
                                  fontSize: '0.68rem',
                                  color: 'var(--text-secondary)',
                                  fontFamily: 'var(--font-mono)',
                                  background: 'var(--bg-surface)',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '2px',
                                  border: '1px solid var(--border-subtle)',
                                }}
                              >
                                {item.split('/').pop()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            Standalone
                          </span>
                        )}
                      </TableCell>

                      <TableCell style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {comp.line_count}
                      </TableCell>

                      <TableCell style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {(comp.size_bytes / 1024).toFixed(1)} KB
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComponentsInventory;
