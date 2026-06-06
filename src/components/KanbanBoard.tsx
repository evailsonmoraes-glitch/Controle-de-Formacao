import React from 'react';
import { Kanban, ArrowLeftRight, ArrowRight, ArrowLeft } from 'lucide-react';
import { SpreadsheetData, DataRecord } from '../types';
import { cleanNumber } from '../utils/csvParser';

interface KanbanBoardProps {
  data: SpreadsheetData;
  activeFilters: { [key: string]: string };
  onUpdateRow: (index: number, updatedFields: Partial<DataRecord>) => void;
}

export default function KanbanBoard({ data, activeFilters, onUpdateRow }: KanbanBoardProps) {
  const { columns, rows } = data;

  // Locate the status column
  const statusCol = columns.find(col => col.name.toLowerCase().includes('status') || col.name.toLowerCase().includes('etapa') || col.name.toLowerCase().includes('situa'));
  const statusColName = statusCol ? statusCol.name : null;

  // Fallback status list
  const statuses = statusCol && statusCol.distinctValues.length > 0 
    ? statusCol.distinctValues 
    : ['Pendente', 'Concluído'];

  // Map other key columns
  const codeCol = columns.find(col => col.name.toLowerCase().includes('códig') || col.name.toLowerCase().includes('id') || col.name.toLowerCase().includes('ref') || col.name.toLowerCase().includes('matríc'))?.name || 'Código';
  const clientCol = columns.find(col => col.name.toLowerCase().includes('client') || col.name.toLowerCase().includes('empres') || col.name.toLowerCase().includes('pescador') || col.name.toLowerCase().includes('aluno') || col.name.toLowerCase().includes('nome'))?.name || 'Cliente';
  const catCol = columns.find(col => col.name.toLowerCase().includes('categ') || col.name.toLowerCase().includes('curs'))?.name || 'Categoria';
  const priceCol = columns.find(col => col.type === 'numeric' || col.name.toLowerCase().includes('carga') || col.name.toLowerCase().includes('hora'))?.name || 'Valor';
  const ownerCol = columns.find(col => col.name.toLowerCase().includes('respons') || col.name.toLowerCase().includes('funcion') || col.name.toLowerCase().includes('dono') || col.name.toLowerCase().includes('instru') || col.name.toLowerCase().includes('facilita'))?.name || 'Responsável';
  const priorityCol = columns.find(col => col.name.toLowerCase().includes('priorid'))?.name || 'Prioridade';

  // Filter rows
  const filteredRowsWithIndices = rows.map((row, idx) => ({ row, idx })).filter(({ row }) => {
    return Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true;
      return String(row[key] || '').trim() === value.trim();
    });
  });

  // Group rows by status
  const groupedRows: { [key: string]: Array<{ row: DataRecord; idx: number }> } = {};
  statuses.forEach(status => {
    groupedRows[status] = [];
  });

  // Keep a "Outros" (Others) category for values not in the initial status list
  const othersCategory = 'Outros';
  let hasOthers = false;

  filteredRowsWithIndices.forEach(({ row, idx }) => {
    const statusVal = statusColName ? String(row[statusColName] || '').trim() : 'Aguardando';
    // Match against our status list
    const matchedStatus = statuses.find(s => s.toLowerCase() === statusVal.toLowerCase());
    if (matchedStatus) {
      groupedRows[matchedStatus].push({ row, idx });
    } else {
      if (!groupedRows[othersCategory]) {
        groupedRows[othersCategory] = [];
      }
      groupedRows[othersCategory].push({ row, idx });
      hasOthers = true;
    }
  });

  const allColumns = hasOthers ? [...statuses, othersCategory] : statuses;

  const handleMove = (idx: number, currentStatus: string, direction: 'next' | 'prev') => {
    if (!statusColName) return;
    
    const currentIdx = allColumns.indexOf(currentStatus);
    let targetIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;

    if (targetIdx >= 0 && targetIdx < allColumns.length) {
      const newStatus = allColumns[targetIdx];
      onUpdateRow(idx, { [statusColName]: newStatus });
    }
  };

  const getPriorityColor = (priority: string) => {
    const p = String(priority).toLowerCase();
    if (p.includes('alt') || p.includes('urgente')) return 'bg-rose-500';
    if (p.includes('méd') || p.includes('meio')) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const formatPrice = (val: any) => {
    const num = cleanNumber(val);
    if (num === null) return val;
    const colName = priceCol.toLowerCase();
    if (colName.includes('carga') || colName.includes('hora') || colName.includes('h')) {
      return `${num} h`;
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-indigo-500/15 border border-indigo-500/25 rounded-2xl text-indigo-400">
          <Kanban className="w-5 h-5" />
        </div>
        <h4 className="text-lg font-black tracking-tight text-white uppercase">
          Quadro de Fluxos Kanban {statusColName ? `(Etapa: ${statusColName})` : ''}
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto pb-4">
        {allColumns.map(status => {
          const cards = groupedRows[status] || [];

          return (
            <div 
              key={status}
              id={`kanban-column-${status.toLowerCase().replace(/\s/g, '-')}`} 
              className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-5 border border-white/10 flex flex-col min-h-[480px]"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <span className="font-extrabold text-white text-xs tracking-wider uppercase">
                  {status}
                </span>
                <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-black">
                  {cards.length}
                </span>
              </div>

              {/* Card List */}
              <div className="flex-1 space-y-3.5 overflow-y-auto">
                {cards.length > 0 ? (
                  cards.map(({ row, idx }) => {
                    const code = row[codeCol] || `Item #${idx + 1}`;
                    const client = row[clientCol];
                    const category = row[catCol];
                    const price = row[priceCol];
                    const owner = row[ownerCol];
                    const priority = row[priorityCol];

                    return (
                      <div 
                        key={idx}
                        id={`kanban-card-${idx}`}
                        className="bg-slate-900/40 p-4.5 rounded-[1.5rem] border border-white/10 shadow-lg hover:border-indigo-500/35 transition-all flex flex-col gap-2.5 relative group"
                      >
                        {/* Tags */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono font-black text-indigo-300">
                            {code}
                          </span>
                          {priority && (
                            <span className="flex items-center gap-1.5 text-[10px] uppercase font-black text-slate-350">
                              <span className={`w-2 h-2 rounded-full ${getPriorityColor(priority)}`} />
                              {priority}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h5 className="font-extrabold text-white text-sm leading-snug tracking-tight">
                          {client ? String(client) : 'Pescador / Aluno sem Nome'}
                        </h5>

                        {/* Middle info */}
                        <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-350 mt-1">
                          {category && (
                            <div>
                              <p className="text-[9px] uppercase font-bold text-slate-400">{catCol}</p>
                              <p className="truncate font-semibold text-slate-200">{String(category)}</p>
                            </div>
                          )}
                          {price && (
                            <div>
                              <p className="text-[9px] uppercase font-bold text-slate-400">{priceCol}</p>
                              <p className="truncate font-bold text-white font-mono">
                                {formatPrice(price)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Bottom Info and Owner */}
                        {owner && (
                          <div className="border-t border-white/5 pt-2.5 flex items-center justify-between text-xs text-slate-300 mt-1">
                            <span className="font-bold text-[11px] truncate text-slate-300">
                              👤 {String(owner)}
                            </span>
                          </div>
                        )}

                        {/* Large Touch Navigation Arrows inside card */}
                        {statusColName && (
                          <div className="flex justify-end gap-2 pt-2.5 mt-1 border-t border-white/5">
                            {allColumns.indexOf(status) > 0 && (
                              <button 
                                id={`move-prev-btn-${idx}`}
                                onClick={() => handleMove(idx, status, 'prev')}
                                className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15 text-indigo-300 rounded-xl transition-all flex items-center justify-center cursor-pointer min-h-[40px]"
                                title="Mover para coluna anterior"
                              >
                                <ArrowLeft className="w-4.5 h-4.5 text-indigo-400" />
                              </button>
                            )}
                            {allColumns.indexOf(status) < allColumns.length - 1 && (
                              <button 
                                id={`move-next-btn-${idx}`}
                                onClick={() => handleMove(idx, status, 'next')}
                                className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15 text-indigo-300 rounded-xl transition-all flex items-center justify-center cursor-pointer min-h-[40px]"
                                title="Mover para próxima coluna"
                              >
                                <ArrowRight className="w-4.5 h-4.5 text-indigo-400" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs border border-dashed border-white/10 rounded-[1.5rem] py-12">
                    Nenhum item nesta etapa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
