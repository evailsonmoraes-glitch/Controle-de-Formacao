import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { SpreadsheetData } from '../types';
import { Users, CheckCircle, MapPin, Building2, TrendingUp } from 'lucide-react';

interface ChartSectionProps {
  data: SpreadsheetData;
  activeFilters: { [key: string]: string };
}

const COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#3b82f6', // blue
];

export default function ChartSection({ data, activeFilters }: ChartSectionProps) {
  const { rows } = data;

  // 1. Filtered rows according to active filters on top
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      return Object.entries(activeFilters).every(([key, value]) => {
        if (!value) return true;
        return String(row[key] || '').trim() === value.trim();
      });
    });
  }, [rows, activeFilters]);

  // 2. CADASTROS: Cumulative timeline progression of registrations
  const cumulativeData = useMemo(() => {
    let count = 0;
    return filteredRows.map((row, index) => {
      count += 1;
      const id = String(row['Matrícula'] || `Seq ${index + 1}`);
      const nome = String(row['Nome Pescador'] || 'Pescador');
      return {
        id,
        name: nome.split(' ')[0], // Show short first name
        acumulado: count
      };
    });
  }, [filteredRows]);

  // 3. SITUAÇÃO: "Situação" Column distribution (Pendente / Concluído Ratio)
  const situacaoData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredRows.forEach(row => {
      const val = String(row['Situação'] || 'Pendente').trim();
      counts[val] = (counts[val] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    }));
  }, [filteredRows]);

  // 4. ENTIDADE: "Entidade" Column distribution counts
  const entidadeData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredRows.forEach(row => {
      const val = String(row['Entidade'] || 'Não Definido').trim();
      counts[val] = (counts[val] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredRows]);

  // 5. LOCAL DA FORMAÇÃO: "Local de Formação" Column distribution counts
  const localFormacaoData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredRows.forEach(row => {
      const val = String(row['Local de Formação'] || 'Não Definido').trim();
      counts[val] = (counts[val] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredRows]);

  return (
    <div className="space-y-8">
      
      {/* Dynamic Summary Cards to match the main indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Total Cadastros */}
        <div className="bg-gradient-to-br from-indigo-950/45 via-slate-900/40 to-indigo-900/50 border border-white/10 rounded-3xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                Indicador 1
              </span>
              <p className="text-sm font-bold text-slate-300 mt-2">Cadastros</p>
              <h3 className="text-3xl font-black text-white font-mono tracking-tight">{filteredRows.length}</h3>
            </div>
            <div className="bg-indigo-500/10 p-2.5 rounded-2xl text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-3 font-semibold flex items-center gap-1">
            <span className="text-emerald-400">● Live</span> Alunos ativos no painel
          </p>
        </div>

        {/* KPI 2: Situação Concluídos */}
        {(() => {
          const total = filteredRows.length;
          const concluidos = filteredRows.filter(r => String(r['Situação']).toLowerCase().includes('concl')).length;
          const pct = total > 0 ? Math.round((concluidos / total) * 100) : 0;
          
          return (
            <div className="bg-gradient-to-br from-emerald-950/45 via-slate-900/40 to-emerald-900/50 border border-white/10 rounded-3xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    Indicador 2
                  </span>
                  <p className="text-sm font-bold text-slate-300 mt-2">Aproveitamento</p>
                  <h3 className="text-3xl font-black text-white font-mono tracking-tight">{concluidos}</h3>
                </div>
                <div className="bg-emerald-500/10 p-2.5 rounded-2xl text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-3 font-semibold">
                <strong>{pct}%</strong> de concluintes formados
              </p>
            </div>
          );
        })()}

        {/* KPI 3: Total de Entidades */}
        <div className="bg-gradient-to-br from-violet-950/45 via-slate-900/40 to-violet-900/50 border border-white/10 rounded-3xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full">
                Indicador 3
              </span>
              <p className="text-sm font-bold text-slate-300 mt-2">Parcerias Ativas</p>
              <h3 className="text-3xl font-black text-white font-mono tracking-tight">{entidadeData.length}</h3>
            </div>
            <div className="bg-violet-500/10 p-2.5 rounded-2xl text-violet-400 border border-violet-500/20">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-3 font-semibold">
            Esferas / Colônias registradas
          </p>
        </div>

        {/* KPI 4: Total de Regiões */}
        <div className="bg-gradient-to-br from-cyan-950/45 via-slate-900/40 to-cyan-900/50 border border-white/10 rounded-3xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                Indicador 4
              </span>
              <p className="text-sm font-bold text-slate-300 mt-2">Polos Formadores</p>
              <h3 className="text-3xl font-black text-white font-mono tracking-tight">{localFormacaoData.length}</h3>
            </div>
            <div className="bg-cyan-500/10 p-2.5 rounded-2xl text-cyan-400 border border-cyan-500/20">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-3 font-semibold">
            Municípios e locais mapeados
          </p>
        </div>

      </div>

      {/* Bento Grid layout containing the 4 specific required charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
        
        {/* CHART 1: CADASTROS (Cumulative chronological area) */}
        <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base">Evolução de Cadastros</h4>
                <p className="text-[11px] text-slate-400">Progressão cumulativa de pescadores inscritos</p>
              </div>
            </div>
          </div>

          <div className="h-[260px] w-full">
            {cumulativeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientCadastros" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis 
                    dataKey="id" 
                    tickLine={false} 
                    axisLine={false} 
                    fontSize={10} 
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    fontSize={10} 
                    tick={{ fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      border: '1px solid rgba(255,255,255,0.15)', 
                      borderRadius: '16px', 
                      color: '#fff', 
                      backdropFilter: 'blur(12px)',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}
                    formatter={(value: number, name: string, prop: any) => [
                      `${value} Alunos`, 
                      `Nome: ${prop.payload.name}`
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="acumulado" 
                    stroke="#6366f1" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#gradientCadastros)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Nenhum cadastro filtrado para traçar.
              </div>
            )}
          </div>
        </div>

        {/* CHART 2: SITUAÇÃO (Pie ratio chart) */}
        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/15">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-base">Situação Geral</h4>
              <p className="text-[11px] text-slate-400">Porcentagem de aproveitamento</p>
            </div>
          </div>

          <div className="flex-1 min-h-[160px] relative flex items-center justify-center">
            {situacaoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={situacaoData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {situacaoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name.toLowerCase().includes('concl') ? '#10b981' : '#f59e0b'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      border: '1px solid rgba(255,255,255,0.15)', 
                      borderRadius: '12px', 
                      color: '#fff', 
                      backdropFilter: 'blur(10px)',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs">Sem dados de situação.</div>
            )}
          </div>

          {/* Simple Legend */}
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-3">
            {situacaoData.map((item, idx) => {
              const matchesConcl = item.name.toLowerCase().includes('concl');
              return (
                <div key={item.name} className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: matchesConcl ? '#10b981' : '#f59e0b' }} 
                  />
                  <span className="truncate text-slate-300 font-medium font-mono text-[10px]">
                    {item.name}: {item.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 3: ENTIDADE */}
        <div className="lg:col-span-6 bg-white/5 border border-white/10 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/15">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-base">Alunos por Entidade</h4>
              <p className="text-[11px] text-slate-400">Total de matrículas por Colônias parcerias</p>
            </div>
          </div>

          <div className="h-[210px] w-full">
            {entidadeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={entidadeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false} 
                    fontSize={9} 
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    fontSize={10} 
                    tick={{ fill: '#94a3b8' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      border: '1px solid rgba(255,255,255,0.15)', 
                      borderRadius: '12px', 
                      color: '#fff', 
                      backdropFilter: 'blur(10px)',
                      fontSize: '10px'
                    }}
                    formatter={(total: number) => [`${total} Alunos`, 'Total']}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    {entidadeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Massa de dados indisponível.
              </div>
            )}
          </div>
        </div>

        {/* CHART 4: LOCAL DA FORMAÇÃO */}
        <div className="lg:col-span-6 bg-white/5 border border-white/10 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/15">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-base">Local da Formação</h4>
              <p className="text-[11px] text-slate-400">Volume de alunos por polo municipal de capacitação</p>
            </div>
          </div>

          <div className="h-[210px] w-full">
            {localFormacaoData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={localFormacaoData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false} 
                    fontSize={10} 
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    fontSize={10} 
                    tick={{ fill: '#94a3b8' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      border: '1px solid rgba(255,255,255,0.15)', 
                      borderRadius: '12px', 
                      color: '#fff', 
                      backdropFilter: 'blur(10px)',
                      fontSize: '10px'
                    }}
                    formatter={(total: number) => [`${total} Alunos Mapeados`, 'Capacidade']}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    {localFormacaoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Massa de dados indisponível.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
