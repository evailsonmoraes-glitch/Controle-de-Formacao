import React, { useState } from 'react';
import { Search, Plus, Trash2, Download, ChevronLeft, ChevronRight, Filter, Pencil, Check, X } from 'lucide-react';
import { SpreadsheetData, DataRecord } from '../types';
import { cleanNumber } from '../utils/csvParser';

interface DataTableProps {
  data: SpreadsheetData;
  activeFilters: { [key: string]: string };
  onFilterChange: (colName: string, value: string) => void;
  onClearFilters: () => void;
  onAddRow: (newRow: DataRecord) => void;
  onDeleteRow: (index: number) => void;
  onUpdateRow: (index: number, updatedFields: Partial<DataRecord>) => void;
}

export default function DataTable({ 
  data, 
  activeFilters, 
  onFilterChange, 
  onClearFilters, 
  onAddRow, 
  onDeleteRow,
  onUpdateRow
}: DataTableProps) {
  const { columns, rows } = data;

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAdding, setIsAdding] = useState(false);

  // New row form state
  const [newRowData, setNewRowData] = useState<DataRecord>({});

  // Editing row states
  const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null);
  const [editingFields, setEditingFields] = useState<DataRecord>({});

  // Get filtered list based on search and selected column filters
  const processedRows = rows.map((row, idx) => ({ row, idx })).filter(({ row }) => {
    // 1. Column-specific dropdown filters
    const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true;
      return String(row[key] || '').trim() === value.trim();
    });

    if (!matchesFilters) return false;

    // 2. Global search match
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(s)
    );
  });

  // Pagination bounds
  const totalRows = processedRows.length;
  const totalPages = Math.ceil(totalRows / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = processedRows.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    }
  };

  const handleFormChange = (fieldName: string, value: string) => {
    setNewRowData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-fill code or registration ID if empty
    const codeCol = columns.find(col => 
      col.name.toLowerCase().includes('códig') || 
      col.name.toLowerCase().includes('id') || 
      col.name.toLowerCase().includes('matríc')
    );
    const finalRow: DataRecord = { ...newRowData };
    
    if (codeCol && !finalRow[codeCol.name]) {
      const isMatricula = codeCol.name.toLowerCase().includes('matríc');
      const prefix = isMatricula ? 'PESC-2026-' : 'REG-';
      const count = rows.length + 1;
      const numStr = isMatricula ? String(count).padStart(3, '0') : String(100 + count);
      finalRow[codeCol.name] = `${prefix}${numStr}`;
    }

    // Prefill date columns with current date if empty
    columns.forEach(col => {
      if (col.type === 'date' && !finalRow[col.name]) {
        finalRow[col.name] = new Date().toISOString().split('T')[0];
      }
    });

    onAddRow(finalRow);
    setNewRowData({});
    setIsAdding(false);
  };

  const handleDeleteWithCheck = (index: number) => {
    const r = rows[index];
    const itemLabel = r['Pescador / Aluno'] || r['Cliente'] || r['Código'] || r['Matrícula'] || r['Matricula'] || `Linha ${index + 1}`;
    const confirmed = window.confirm(
      `Confirma a exclusão de "${itemLabel}"? Esta alteração afeta apenas o visualizador atual de dados local.`
    );
    if (confirmed) {
      onDeleteRow(index);
    }
  };

  const handleExportCSV = () => {
    if (rows.length === 0) return;
    
    const headers = columns.map(c => c.name);
    const csvRows = [
      headers.join(';'), // Use CSV semicolon standard
      ...rows.map(row => 
        headers.map(h => {
          let fieldVal = String(row[h] || '').replace(/"/g, '""');
          if (fieldVal.includes(';') || fieldVal.includes('\n')) {
            fieldVal = `"${fieldVal}"`;
          }
          return fieldVal;
        }).join(';')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${data.title.replace(/\s+/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categoricalColumns = columns.filter(col => col.type === 'categorical');

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-xl p-4 md:p-6 mb-8 text-white">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h4 className="text-lg font-bold text-white flex items-center gap-2">
            📊 Base Unificada de Registros
          </h4>
          <p className="text-slate-400 text-xs mt-1">Busque, filtre e gerencie linhas individualmente no cache local</p>
        </div>
        
        {/* Large Quick Buttons */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            id="table-add-row-btn"
            onClick={() => setIsAdding(!isAdding)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-extrabold text-sm px-5 py-3 rounded-xl transition-all shadow-lg min-h-[48px] cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Adicionar Linha
          </button>
          
          <button 
            id="table-export-csv-btn"
            onClick={handleExportCSV}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-white font-extrabold text-sm px-5 py-3 rounded-xl transition-all min-h-[48px] cursor-pointer"
          >
            <Download className="w-5 h-5" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Dynamic filters selectors - Large buttons for touch devices */}
      {categoricalColumns.length > 0 && (
        <div className="mb-6 p-5 bg-slate-950/40 rounded-2xl border border-white/5 backdrop-blur-md">
          <h5 className="font-extrabold text-white text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-indigo-400" /> Filtros Rápidos de Coluna
          </h5>
          <div className="flex flex-wrap gap-4">
            {categoricalColumns.map(col => {
              const activeVal = activeFilters[col.name] || '';
              return (
                <div key={col.name} className="flex flex-col min-w-[140px] flex-1 sm:flex-initial">
                  <span className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">{col.name}</span>
                  <select 
                    className="bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 min-h-[44px] cursor-pointer"
                    value={activeVal}
                    onChange={(e) => onFilterChange(col.name, e.target.value)}
                  >
                    <option value="" className="bg-slate-900"> (Filtrar {col.name})</option>
                    {col.distinctValues.map(v => (
                      <option key={v} value={v} className="bg-slate-900">{v}</option>
                    ))}
                  </select>
                </div>
              );
            })}
            {Object.values(activeFilters).some(v => v !== '') && (
              <div className="flex items-end flex-initial self-end">
                <button 
                  id="table-clear-filters-btn"
                  onClick={onClearFilters}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors min-h-[44px] cursor-pointer"
                >
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline Adding form */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="mb-6 p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] animate-fade-in text-white">
          <h5 className="font-extrabold text-white text-sm mb-4">🆕 Preencher Novo Registro</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {columns.map(col => (
              <div key={col.name} className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-350 mb-1.5">{col.name}</label>
                {col.type === 'categorical' && col.distinctValues.length > 0 ? (
                  <select 
                    required
                    value={newRowData[col.name] || ''}
                    onChange={(e) => handleFormChange(col.name, e.target.value)}
                    className="bg-slate-950/40 text-white px-3 py-2.5 rounded-xl border border-white/10 text-xs min-h-[44px] focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="" className="bg-slate-900 text-white">Selecione...</option>
                    {col.distinctValues.map(v => (
                      <option key={v} value={v} className="bg-slate-900 text-white">{v}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type={col.type === 'numeric' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                    step={col.type === 'numeric' ? 'any' : undefined}
                    placeholder={`Inserir ${col.name}`}
                    value={newRowData[col.name] || ''}
                    onChange={(e) => handleFormChange(col.name, e.target.value)}
                    className="bg-slate-950/40 text-white px-3 py-2.5 rounded-xl border border-white/10 text-xs min-h-[44px] focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-xl min-h-[40px] border border-white/5 cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl min-h-[40px] pointer-events-auto cursor-pointer"
            >
              Confirmar e Cadastrar
            </button>
          </div>
        </form>
      )}

      {/* Global search & size */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-5 h-5 text-indigo-400" />
          </span>
          <input 
            type="text"
            id="table-global-search"
            placeholder="Pesquisar por cliente, responsável, código..."
            className="w-full bg-slate-950/40 text-white pl-11 pr-4 py-3 rounded-xl text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-505 font-medium min-h-[48px] placeholder-slate-500 transition-colors"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Page size dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-300 font-semibold">
          <span>Ver</span>
          <select 
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-950/40 border border-white/10 text-white px-2 py-1.5 rounded-lg font-bold cursor-pointer"
          >
            <option value={5} className="bg-slate-900">5 itens</option>
            <option value={10} className="bg-slate-900">10 itens</option>
            <option value={25} className="bg-slate-900">25 itens</option>
          </select>
        </div>
      </div>

      {/* Table responsive Container */}
      <div className="overflow-x-auto -mx-4 md:-mx-6">
        <div className="inline-block min-w-full align-middle px-4 md:px-6">
          <div className="overflow-hidden border border-white/10 rounded-2xl">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-[#1e293b]/70 text-slate-300">
                <tr>
                  {columns.map(col => (
                    <th 
                      key={col.name}
                      scope="col" 
                      className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-300 font-sans"
                    >
                      {col.name}
                    </th>
                  ))}
                  <th scope="col" className="relative px-6 py-4 w-16">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-white/10 text-slate-200">
                {paginatedRows.length > 0 ? (
                  paginatedRows.map(({ row, idx }) => {
                    const isEditingThisRow = editingRowIdx === idx;
                    return (
                      <tr 
                        key={idx}
                        className={`transition-colors ${isEditingThisRow ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : 'hover:bg-white/5'}`}
                      >
                        {columns.map(col => {
                          const cellVal = row[col.name];
                          let content: any = cellVal;
                          
                          if (isEditingThisRow) {
                            if (col.type === 'categorical') {
                              content = (
                                <select
                                  className="bg-slate-950/80 border border-white/20 text-white rounded-xl text-xs py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                  value={String(editingFields[col.name] ?? cellVal ?? '')}
                                  onChange={(e) => setEditingFields(prev => ({ ...prev, [col.name]: e.target.value }))}
                                >
                                  <option value="">(Selecione)</option>
                                  {col.distinctValues.map(v => (
                                    <option key={v} value={v}>{v}</option>
                                  ))}
                                </select>
                              );
                            } else if (col.type === 'numeric') {
                              content = (
                                <input
                                  type="text"
                                  className="w-24 bg-slate-950/80 border border-white/20 text-white rounded-xl text-xs py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                                  value={String(editingFields[col.name] ?? cellVal ?? '')}
                                  onChange={(e) => setEditingFields(prev => ({ ...prev, [col.name]: e.target.value }))}
                                />
                              );
                            } else if (col.type === 'date') {
                              content = (
                                <input
                                  type="date"
                                  className="bg-slate-950/80 border border-white/20 text-white rounded-xl text-xs py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                                  value={String(editingFields[col.name] ?? cellVal ?? '')}
                                  onChange={(e) => setEditingFields(prev => ({ ...prev, [col.name]: e.target.value }))}
                                />
                              );
                            } else {
                              content = (
                                <input
                                  type="text"
                                  className="w-full min-w-[140px] bg-slate-950/80 border border-white/20 text-white rounded-xl text-xs py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                  value={String(editingFields[col.name] ?? cellVal ?? '')}
                                  onChange={(e) => setEditingFields(prev => ({ ...prev, [col.name]: e.target.value }))}
                                />
                              );
                            }
                          } else {
                            // Treat colors or styling for special columns e.g. status
                            if (col.name.toLowerCase().includes('status')) {
                              const isSuccess = String(cellVal).toLowerCase().includes('concl');
                              const isWarning = String(cellVal).toLowerCase().includes('andam') || String(cellVal).toLowerCase().includes('aprov');
                              const isDanger = String(cellVal).toLowerCase().includes('canc') || String(cellVal).toLowerCase().includes('atras');
                              
                              content = (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold leading-4 tracking-wide border shadow-sm ${
                                  isSuccess ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 
                                  isWarning ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                                  isDanger ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' :
                                  'bg-indigo-500/15 text-indigo-300 border-indigo-500/20'
                                }`}>
                                  {String(cellVal)}
                                </span>
                              );
                            } else if (col.type === 'numeric') {
                              const parsed = cleanNumber(cellVal);
                              if (parsed !== null) {
                                const isCurrency = col.name.toLowerCase().includes('r$') || 
                                                   col.name.toLowerCase().includes('receit') || 
                                                   col.name.toLowerCase().includes('valor');
                                content = (
                                  <span className="font-mono font-bold text-white">
                                    {isCurrency 
                                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parsed)
                                      : parsed.toLocaleString('pt-BR')}
                                  </span>
                                );
                              }
                            } else if (col.type === 'date') {
                              content = <span className="font-mono text-slate-300">{String(cellVal)}</span>;
                            } else if (col.name.toLowerCase().includes('códig') || col.name.toLowerCase().includes('id')) {
                              content = <span className="font-mono font-bold text-xs text-indigo-300">{String(cellVal)}</span>;
                            } else {
                              content = <span className="text-slate-200">{String(cellVal)}</span>;
                            }
                          }

                          return (
                            <td key={col.name} className="px-6 py-4 whitespace-nowrap text-sm">
                              {content}
                            </td>
                          );
                        })}
                        
                        {/* Actions Trigger */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEditingThisRow ? (
                              <>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    onUpdateRow(idx, editingFields);
                                    setEditingRowIdx(null);
                                    setEditingFields({});
                                  }}
                                  className="text-emerald-400 hover:text-emerald-350 p-2 hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer"
                                  title="Salvar alterações"
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setEditingRowIdx(null);
                                    setEditingFields({});
                                  }}
                                  className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                                  title="Cancelar edição"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setEditingRowIdx(idx);
                                    setEditingFields({ ...row });
                                  }}
                                  className="text-amber-400 hover:text-amber-300 p-2 hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer"
                                  title="Editar Registro"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                  id={`table-delete-row-btn-${idx}`}
                                  onClick={() => handleDeleteWithCheck(idx)}
                                  className="text-rose-400 hover:text-rose-350 p-2 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                                  title="Excluir Registro"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-xs text-slate-400">
                      Nenhum correspondente encontrado para os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
          <span className="text-xs text-slate-400 font-medium">
            Mostrando <span className="font-bold text-white">{startIndex + 1}</span> a{' '}
            <span className="font-bold text-white">{Math.min(startIndex + pageSize, totalRows)}</span> de{' '}
            <span className="font-bold text-white">{totalRows}</span> itens
          </span>

          <div className="flex gap-2">
            <button 
              id="pagination-prev"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all min-h-[40px] flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center text-xs font-bold text-slate-300 px-2">
              Pág. {currentPage} de {totalPages}
            </div>

            <button 
              id="pagination-next"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all min-h-[40px] flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
