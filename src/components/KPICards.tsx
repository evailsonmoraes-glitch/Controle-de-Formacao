import React from 'react';
import { TrendingUp, DollarSign, ListCollapse, Activity } from 'lucide-react';
import { SpreadsheetData } from '../types';
import { cleanNumber } from '../utils/csvParser';

interface KPICardsProps {
  data: SpreadsheetData;
  activeFilters: { [key: string]: string };
}

export default function KPICards({ data, activeFilters }: KPICardsProps) {
  // Find first numeric column
  const numericCol = data.columns.find(col => col.type === 'numeric');
  const numericName = numericCol ? numericCol.name : null;

  // Track filtered rows
  const filteredRows = data.rows.filter(row => {
    return Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true;
      return String(row[key] || '').trim() === value.trim();
    });
  });

  // Calculate stats
  let totalSum = 0;
  let countWithNumber = 0;
  
  filteredRows.forEach(row => {
    if (numericName) {
      const num = cleanNumber(row[numericName]);
      if (num !== null) {
        totalSum += num;
        countWithNumber++;
      }
    }
  });

  const average = countWithNumber > 0 ? totalSum / countWithNumber : 0;
  
  // Format currency helpers
  const formatValue = (val: number) => {
    if (numericName?.toLowerCase().includes('r$') || numericName?.toLowerCase().includes('reais') || numericName?.toLowerCase().includes('valor') || numericName?.toLowerCase().includes('receita')) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    }
    return val.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  };

  // Find status column for active projects count
  const statusCol = data.columns.find(col => col.name.toLowerCase().includes('status') || col.name.toLowerCase().includes('etapa'));
  const activeCount = statusCol 
    ? filteredRows.filter(row => {
        const val = String(row[statusCol.name] || '').toLowerCase();
        return val.includes('andamento') || val.includes('aprovado') || val.includes('aguardando') || val.includes('aberto');
      }).length
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Metric 1: Total Sum */}
      <div 
        id="kpi-total-revenue"
        className="relative overflow-hidden bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 backdrop-blur-lg text-white p-6 rounded-3xl shadow-xl border border-white/15 flex flex-col justify-between min-h-[140px] transition-all hover:scale-[1.02] duration-300"
      >
        <div className="flex justify-between items-start">
          <p className="text-slate-300 text-xs font-semibold uppercase tracking-widest leading-none">
            {numericName ? `Total: ${numericName}` : 'Soma de Métricas'}
          </p>
          <div className="bg-indigo-500/20 p-2.5 rounded-2xl border border-indigo-500/30">
            <DollarSign className="w-5 h-5 text-indigo-400" />
          </div>
        </div>
        <div className="mt-4">
          <h4 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent">
            {numericName ? formatValue(totalSum) : 'R$ 0,00'}
          </h4>
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1.5">Soma de todos os registros</p>
        </div>
      </div>

      {/* Metric 2: Average */}
      <div 
        id="kpi-averages"
        className="relative overflow-hidden bg-white/10 backdrop-blur-lg border border-white/10 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between min-h-[140px] transition-all hover:scale-[1.02] duration-300"
      >
        <div className="flex justify-between items-start">
          <p className="text-slate-300 text-xs font-semibold uppercase tracking-widest leading-none">
            {numericName ? `Média: ${numericName}` : 'Média das Linhas'}
          </p>
          <div className="bg-emerald-500/20 p-2.5 rounded-2xl border border-emerald-500/30">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <div className="mt-4">
          <h4 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white to-slate-200">
            {numericName ? formatValue(average) : 'R$ 0,00'}
          </h4>
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1.5">Média por registro</p>
        </div>
      </div>

      {/* Metric 3: Total Count */}
      <div 
        id="kpi-total-records"
        className="relative overflow-hidden bg-white/10 backdrop-blur-lg border border-white/10 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between min-h-[140px] transition-all hover:scale-[1.02] duration-300"
      >
        <div className="flex justify-between items-start">
          <p className="text-slate-300 text-xs font-semibold uppercase tracking-widest leading-none">
            Cadastros / Linhas
          </p>
          <div className="bg-blue-500/20 p-2.5 rounded-2xl border border-blue-500/30">
            <ListCollapse className="w-5 h-5 text-blue-400" />
          </div>
        </div>
        <div className="mt-4">
          <h4 className="text-3xl md:text-4xl font-black text-white">
            {filteredRows.length}
          </h4>
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1.5">Linhas ativas na busca</p>
        </div>
      </div>

      {/* Metric 4: Active / Progress KPI */}
      <div 
        id="kpi-active-items"
        className="relative overflow-hidden bg-white/10 backdrop-blur-lg border border-white/10 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between min-h-[140px] transition-all hover:scale-[1.02] duration-300"
      >
        <div className="flex justify-between items-start">
          <p className="text-slate-300 text-xs font-semibold uppercase tracking-widest leading-none">
            Sinalização / Ativos
          </p>
          <div className="bg-rose-500/20 p-2.5 rounded-2xl border border-rose-500/30">
            <Activity className="w-5 h-5 text-rose-400" />
          </div>
        </div>
        <div className="mt-4">
          <h4 className="text-3xl md:text-4xl font-black text-white">
            {statusCol ? activeCount : filteredRows.filter(r => r['Prioridade'] === 'Alta' || r['Prioridade'] === 'Alta').length || '0'}
          </h4>
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1.5">
            {statusCol ? 'Demandas em progresso' : 'Prioridade Máxima'}
          </p>
        </div>
      </div>
    </div>
  );
}
