import React, { useState } from 'react';
import { 
  Search, 
  User, 
  Printer, 
  Trash2, 
  CheckSquare, 
  X, 
  AlertCircle,
  MapPin,
  Building,
  CheckCircle,
  FileCheck2,
  FileText
} from 'lucide-react';
import { SpreadsheetData, DataRecord } from '../types';

interface SearchPageProps {
  data: SpreadsheetData;
  onDeleteRow: (index: number) => void;
  onUpdateRow: (rowIndex: number, updatedFields: Partial<DataRecord>) => void;
}

export default function SearchPage({ data, onDeleteRow, onUpdateRow }: SearchPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPescador, setSelectedPescador] = useState<DataRecord | null>(null);

  // Status/Situação quick filter pill
  const [situacaoFilter, setSituacaoFilter] = useState<'all' | 'Pendente' | 'Concluído'>('all');

  // Filter rows based on search input (name or CPF) and state filters
  const filteredRows = data.rows.map((row, originalIndex) => ({
    ...row,
    originalIndex
  })).filter(item => {
    const nome = String(item['Nome Pescador'] || '').toLowerCase();
    const cpf = String(item['CPF'] || '').toLowerCase();
    const termClean = searchTerm.toLowerCase().trim();
    
    // Check search term match
    const matchesSearch = nome.includes(termClean) || cpf.includes(termClean);
    
    // Check situacao match
    if (situacaoFilter === 'all') return matchesSearch;
    return matchesSearch && item['Situação'] === situacaoFilter;
  });

  // Toggle Pescador Status/Situação (Pendente <-> Concluído)
  const handleToggleSituacao = (originalIndex: number, currentVal: string) => {
    const newVal = currentVal === 'Concluído' ? 'Pendente' : 'Concluído';
    onUpdateRow(originalIndex, { 'Situação': newVal });
  };

  // Toggle ATA1 (Presente <-> Ausente)
  const handleToggleATA1 = (originalIndex: number, currentVal: string) => {
    const newVal = currentVal === 'Presente' ? 'Ausente' : 'Presente';
    onUpdateRow(originalIndex, { 'ATA1': newVal });
  };

  // Toggle ATA2 (Presente <-> Ausente)
  const handleToggleATA2 = (originalIndex: number, currentVal: string) => {
    const newVal = currentVal === 'Presente' ? 'Ausente' : 'Presente';
    onUpdateRow(originalIndex, { 'ATA2': newVal });
  };

  // Toggle Nautilus (Cadastrado <-> Não Cadastrado)
  const handleToggleNautilus = (originalIndex: number, currentVal: string) => {
    const newVal = currentVal === 'Cadastrado' ? 'Não Cadastrado' : 'Cadastrado';
    onUpdateRow(originalIndex, { 'Nautilus': newVal });
  };

  // Toggle Termo (Assinou <-> Não Assinou)
  const handleToggleTermo = (originalIndex: number, currentVal: string) => {
    const newVal = currentVal === 'Assinou' ? 'Não Assinou' : 'Assinou';
    onUpdateRow(originalIndex, { 'Termo': newVal });
  };

  // Trigger print overlay specifically styling a print sheet
  const handlePrintFicha = (pescador: DataRecord) => {
    setSelectedPescador(pescador);
    // Let the React render loop finish then trigger print dialog
    setTimeout(() => {
      window.print();
    }, 350);
  };

  return (
    <div className="space-y-6">
      
      {/* Search Bar & Header Area */}
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 md:p-8 backdrop-blur-md space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Search className="w-6 h-6 text-indigo-400" />
            Consulta de Pescadores
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Pesquise de forma rápida por Nome do Pescador ou CPF. Filtre também por situação de conclusão.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          
          {/* Main search text input */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-450" />
            <input
              type="text"
              placeholder="Pesquisar por Nome Pescador, CPF (ex: 123)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-slate-950/40 border border-white/10 rounded-2xl text-white font-bold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
              id="search-input-box"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-450 hover:text-white bg-transparent border-none p-0 cursor-pointer"
                title="Limpar Pesquisa"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick status filter pills */}
          <div className="flex bg-slate-950/40 p-1.5 rounded-2xl border border-white/10 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setSituacaoFilter('all')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                situacaoFilter === 'all'
                  ? 'bg-indigo-600 border border-indigo-400/25 text-white'
                  : 'text-slate-400 hover:text-slate-200 bg-transparent border-none'
              }`}
            >
              Todos ({data.rows.length})
            </button>
            <button
              onClick={() => setSituacaoFilter('Pendente')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                situacaoFilter === 'Pendente'
                  ? 'bg-amber-600/90 border border-amber-500/25 text-white'
                  : 'text-slate-400 hover:text-slate-200 bg-transparent border-none'
              }`}
            >
              Pendentes ({data.rows.filter(r => r['Situação'] === 'Pendente').length})
            </button>
            <button
              onClick={() => setSituacaoFilter('Concluído')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                situacaoFilter === 'Concluído'
                  ? 'bg-emerald-600/90 border border-emerald-500/25 text-white'
                  : 'text-slate-400 hover:text-slate-200 bg-transparent border-none'
              }`}
            >
              Concluídos ({data.rows.filter(r => r['Situação'] === 'Concluído').length})
            </button>
          </div>

        </div>

        {/* Counter of matching results */}
        <div className="text-xs text-slate-400 font-bold flex items-center justify-between">
          <span>
            Exibindo {filteredRows.length} de {data.rows.length} registros cadastrados
          </span>
          {searchTerm && (
            <span className="text-indigo-400">
              Filtro ativo: "{searchTerm}"
            </span>
          )}
        </div>
      </div>

      {/* Grid of Results */}
      {filteredRows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="search-results-grid">
          {filteredRows.map((item) => {
            const isConcl = item['Situação'] === 'Concluído';
            
            return (
              <div 
                key={item['Matrícula'] || item.originalIndex}
                className="bg-white/5 border border-white/10 rounded-[2.25rem] p-5 hover:border-indigo-500/30 hover:bg-white/10 transition-all text-left relative overflow-hidden flex flex-col justify-between group shadow-lg"
              >
                {/* Visual glow on border hover */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
                
                {/* Header info */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-black text-indigo-300 bg-indigo-500/15 py-1 px-2.5 rounded-lg border border-indigo-500/10">
                        {item['Matrícula']}
                      </span>
                    </div>

                    {/* Quick status toggle button badge */}
                    <button
                      onClick={() => handleToggleSituacao(item.originalIndex, String(item['Situação']))}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer select-none transition-all hover:scale-105 active:scale-95 ${
                        isConcl 
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/25' 
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/25 hover:bg-amber-500/25'
                      }`}
                      title="Clique para alternar situação rápida"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isConcl ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {item['Situação'] || 'Pendente'}
                    </button>
                  </div>

                  {/* Name and Client details */}
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-white text-base tracking-tight leading-tight group-hover:text-indigo-200 transition-colors truncate">
                      {item['Nome Pescador']}
                    </h3>
                    <p className="text-xs text-indigo-200 font-mono flex items-center gap-1">
                      <span className="text-slate-400">CPF:</span> {item['CPF'] || '---.---.---.--'}
                    </p>
                  </div>

                  {/* General details Grid */}
                  <div className="space-y-2.5 pt-3 border-t border-white/5 text-xs text-slate-300">
                    <div className="flex items-center gap-2 truncate">
                      <Building className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                      <span className="truncate font-semibold">{item['Entidade'] || 'Não Vinculada'}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                      <span className="truncate font-semibold">{item['Local de Formação'] || 'Niterói'}</span>
                    </div>
                  </div>

                  {/* Presence checklist status badges */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                    {/* ATA 1 pill */}
                    <button
                      onClick={() => handleToggleATA1(item.originalIndex, String(item['ATA1']))}
                      className="p-2 rounded-xl bg-slate-900/40 border border-white/5 hover:bg-slate-900 text-left transition-all cursor-pointer text-[10px]"
                      title="Clique para alternar presença da ATA 1"
                    >
                      <span className="block text-slate-400 uppercase font-bold text-[8px] tracking-wider">ATA 1</span>
                      <span className={`inline-flex items-center gap-1 font-extrabold font-mono mt-0.5 ${
                        item['ATA1'] === 'Presente' ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        {item['ATA1'] === 'Presente' ? '● Presente' : '○ Ausente'}
                      </span>
                    </button>

                    {/* ATA 2 pill */}
                    <button
                      onClick={() => handleToggleATA2(item.originalIndex, String(item['ATA2']))}
                      className="p-2 rounded-xl bg-slate-900/40 border border-white/5 hover:bg-slate-900 text-left transition-all cursor-pointer text-[10px]"
                      title="Clique para alternar presença da ATA 2"
                    >
                      <span className="block text-slate-400 uppercase font-bold text-[8px] tracking-wider">ATA 2</span>
                      <span className={`inline-flex items-center gap-1 font-extrabold font-mono mt-0.5 ${
                        item['ATA2'] === 'Presente' ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        {item['ATA2'] === 'Presente' ? '● Presente' : '○ Ausente'}
                      </span>
                    </button>
                  </div>

                  {/* Nautilus and Termo */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* Nautilus */}
                    <button
                      onClick={() => handleToggleNautilus(item.originalIndex, String(item['Nautilus']))}
                      className="p-2 rounded-xl bg-slate-900/40 border border-white/5 hover:bg-slate-900 text-left transition-all cursor-pointer text-[10px]"
                      title="Clique para alternar Nautilus"
                    >
                      <span className="block text-slate-400 uppercase font-bold text-[8px] tracking-wider">Nautilus</span>
                      <span className={`inline-block font-extrabold font-sans mt-0.5 ${
                        item['Nautilus'] === 'Cadastrado' ? 'text-indigo-400' : 'text-slate-500'
                      }`}>
                        {item['Nautilus'] === 'Cadastrado' ? '✓ Cadastrado' : '✗ Não Cadast.'}
                      </span>
                    </button>

                    {/* Termo */}
                    <button
                      onClick={() => handleToggleTermo(item.originalIndex, String(item['Termo']))}
                      className="p-2 rounded-xl bg-slate-900/40 border border-white/5 hover:bg-slate-900 text-left transition-all cursor-pointer text-[10px]"
                      title="Clique para alternar Termo"
                    >
                      <span className="block text-slate-400 uppercase font-bold text-[8px] tracking-wider">Termo Assinado</span>
                      <span className={`inline-block font-extrabold font-sans mt-0.5 ${
                        item['Termo'] === 'Assinou' ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        {item['Termo'] === 'Assinou' ? '✓ Assinou' : '✗ Não Assin.'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Operations bar in card */}
                <div className="flex gap-2.5 pt-4 mt-4 border-t border-white/5 shrink-0">
                  {/* PRINT OFFICIAL INSCRIÇÃO BUTTON */}
                  <button
                    onClick={() => handlePrintFicha(item)}
                    className="flex-1 bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-300 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Ficha</span>
                  </button>

                  {/* DELETE RECORD BUTTON */}
                  <button
                    onClick={() => {
                      if (window.confirm(`Deseja mesmo remover permanentemente a ficha de "${item['Nome Pescador']}"? Isso sincronizará com a planilha local.`)) {
                        onDeleteRow(item.originalIndex);
                      }
                    }}
                    className="bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-300 p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                    title="Remover permanentemente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-12 text-center max-w-sm mx-auto space-y-4">
          <div className="w-16 h-16 bg-slate-900/50 rounded-full flex items-center justify-center text-slate-550 mx-auto border border-white/5">
            <X className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-base">Nenhum Pescador Encontrado</h4>
            <p className="text-xs text-slate-450 mt-1 leading-relaxed">
              Não encontramos nenhum pescador que corresponda ao texto pesquisado ou ao filtro de situação selecionada. Tente digitar outro termo.
            </p>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        HIDDEN PRINTABLE OFFICIAL DOCUMENT
        We will render a beautiful template that gets caught by @media print.
        It is purely invisible in normal screen mode (using print:block utilities)
        ========================================================================
      */}
      {selectedPescador && (
        <div className="hidden print:block fixed inset-0 bg-white text-black p-10 font-sans z-[9999] overflow-y-auto" id="printable-ficha-document text-left">
          
          {/* Header */}
          <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-center text-black">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tight">Ficha Nacional de Inscrição</h1>
              <p className="text-xs mt-1 font-medium">Programa de Formação Continuada de Pescadores Profissionais</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono block">DOCUMENTO DE CONTROLE</span>
              <span className="text-sm font-mono font-bold">MATRÍCULA: {selectedPescador['Matrícula']}</span>
            </div>
          </div>

          {/* Subtitle banner */}
          <div className="bg-slate-150 p-2.5 border border-black mb-6 text-center">
            <h2 className="text-sm font-black uppercase tracking-wider">Requerimento e Dados Cadastrais do Aluno</h2>
          </div>

          {/* Core Personal Details section */}
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-4 border border-black p-4">
              <div className="col-span-2 space-y-1">
                <span className="text-[9px] uppercase font-bold text-gray-500 block">Nome do Pescador Requerente:</span>
                <span className="text-sm font-black text-black block">{selectedPescador['Nome Pescador']}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-gray-500 block">Número do CPF:</span>
                <span className="text-sm font-mono font-bold block">{selectedPescador['CPF'] || '---.---.---.--'}</span>
              </div>
            </div>

            {/* Geographic & Community Associations */}
            <div className="grid grid-cols-2 gap-4 border border-black p-4">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-gray-500 block">Entidade Associativa de Cadastro:</span>
                <span className="text-xs font-extrabold text-black block">{selectedPescador['Entidade'] || 'Não Vinculada'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-gray-500 block">Polo / Local de Formação Cursado:</span>
                <span className="text-xs font-extrabold text-black block">{selectedPescador['Local de Formação'] || 'Niterói'}</span>
              </div>
            </div>

            {/* Attendance & Process States */}
            <h3 className="font-bold text-xs uppercase block pt-2">Acompanhamento Técnico de Presença e Cadastros</h3>
            <div className="grid grid-cols-4 gap-4 border border-black p-4 text-center">
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-500 block">ATA de Presença 1</span>
                <span className="text-xs font-black block mt-1 uppercase text-black">
                  [ {selectedPescador['ATA1'] === 'Presente' ? 'X' : ' ' } ] Presente &nbsp;&nbsp;&nbsp; [ {selectedPescador['ATA1'] !== 'Presente' ? 'X' : ' ' } ] Ausente
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-500 block">ATA de Presença 2</span>
                <span className="text-xs font-black block mt-1 uppercase text-black">
                  [ {selectedPescador['ATA2'] === 'Presente' ? 'X' : ' ' } ] Presente &nbsp;&nbsp;&nbsp; [ {selectedPescador['ATA2'] !== 'Presente' ? 'X' : ' ' } ] Ausente
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-500 block">Cadastro no Nautilus</span>
                <span className="text-xs font-black block mt-1 uppercase text-black">
                  [ {selectedPescador['Nautilus'] === 'Cadastrado' ? 'X' : ' ' } ] Sim &nbsp;&nbsp;&nbsp; [ {selectedPescador['Nautilus'] !== 'Cadastrado' ? 'X' : ' ' } ] Não
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-500 block">Termo de Responsabilidade</span>
                <span className="text-xs font-black block mt-1 uppercase text-black">
                  [ {selectedPescador['Termo'] === 'Assinou' ? 'X' : ' ' } ] Assinou &nbsp;&nbsp;&nbsp; [ {selectedPescador['Termo'] !== 'Assinou' ? 'X' : ' ' } ] Não Assinou
                </span>
              </div>
            </div>

            <div className="border border-black p-4">
              <span className="text-[9px] uppercase font-bold text-gray-500 block">Situação Geral de Certificação:</span>
              <span className="text-sm font-black text-black uppercase mt-1 block">
                {selectedPescador['Situação'] === 'Concluído' ? '✓ CERTIFICADO CONCLUÍDO' : '⚠ CURSO PENDENTE / EM PROGRESSO'}
              </span>
            </div>
          </div>

          {/* Declaration Text */}
          <div className="mt-8 text-[11px] leading-relaxed text-gray-800 text-left">
            <p className="font-bold">Declaração de Autenticidade dos Dados:</p>
            <p className="mt-1">
              Declaro para os devidos fins de direito que a participação e controle de presença acima relacionados constam em nossos diários de classe oficiais e termos de responsabilidade devidamente assinados. Este comprovante é emitido pelo Sistema Sincronizado de Controle de Formação.
            </p>
          </div>

          {/* Footer Signature Blocks */}
          <div className="mt-16 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-1">
              <div className="border-t border-black w-48 mx-auto pt-1" />
              <p className="font-bold">{selectedPescador['Nome Pescador']}</p>
              <p className="text-gray-500 text-[9px] uppercase">Assinatura do Pescador / Requerente</p>
            </div>
            <div className="space-y-1">
              <div className="border-t border-black w-48 mx-auto pt-1" />
              <p className="font-bold">Coordenação do Curso de Formação</p>
              <p className="text-gray-500 text-[9px] uppercase">Emitido em {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          {/* Printable Close instruction helper (Only visible in browsers if iframe block prevents print dialogue) */}
          <button 
            onClick={() => setSelectedPescador(null)}
            className="mt-12 bg-black text-white px-5 py-2 hover:bg-gray-800 rounded mx-auto font-bold no-print text-xs block cursor-pointer"
          >
            Fechar Visualização de Impressão (Tela)
          </button>
        </div>
      )}
    </div>
  );
}
