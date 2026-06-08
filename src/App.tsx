import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Kanban, 
  Table2, 
  RefreshCw, 
  LayoutDashboard, 
  HelpCircle, 
  Smartphone, 
  Sparkles,
  Layers,
  UserPlus,
  ArrowLeft,
  Clock,
  Database,
  Home,
  Search
} from 'lucide-react';
import { SpreadsheetData, DataRecord } from './types';
import ChartSection from './components/ChartSection';
import KanbanBoard from './components/KanbanBoard';
import DataTable from './components/DataTable';
import SyncPanel from './components/SyncPanel';
import DedicatedForm from './components/DedicatedForm';
import SearchPage from './components/SearchPage';
import MOCK_SHEET_DATA from './utils/mockData';
import { getSheetsCsvUrl, processRawSpreadsheetData } from './utils/csvParser';

export default function App() {
  // Always use the requested sheet by default, loading from localStorage if customized
  const [targetSheetUrl, setTargetSheetUrl] = useState<string>(() => {
    const savedUrl = localStorage.getItem('formacao_pescadores_target_sheet_url');
    return savedUrl || 'https://docs.google.com/spreadsheets/d/1YCniwIBOIsE6-kujz32YsTGj4ByNJUShcQ96i51sDZI/edit?usp=drive_link';
  });

  const [isLocalDatabaseMode, setIsLocalDatabaseMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('formacao_pescadores_is_local_db_mode');
    return saved === 'true';
  });

  // Load initially from local storage if existing, otherwise fall back to MOCK_SHEET_DATA
  const [dataState, setDataState] = useState<SpreadsheetData>(() => {
    const isLocal = localStorage.getItem('formacao_pescadores_is_local_db_mode') === 'true';
    const key = isLocal ? 'formacao_pescadores_local_db_state' : 'formacao_pescadores_state';
    const saved = localStorage.getItem(key);
    
    // Get current targetSheetUrl (we do it manually here before state is constructed)
    const currentUrl = localStorage.getItem('formacao_pescadores_target_sheet_url') || 'https://docs.google.com/spreadsheets/d/1YCniwIBOIsE6-kujz32YsTGj4ByNJUShcQ96i51sDZI/edit?usp=drive_link';
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Force URL to target
        parsed.url = currentUrl;
        return parsed;
      } catch (e) {
        console.error("Erro ao ler cache do localStorage:", e);
      }
    }
    const fallback = { ...MOCK_SHEET_DATA, url: currentUrl };
    return fallback;
  });

  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'cadastro' | 'consulta'>('home');
  const [dashboardSubTab, setDashboardSubTab] = useState<'graficos' | 'kanban' | 'tabela'>('graficos');
  const [showMobileTip, setShowMobileTip] = useState(true);

  // Sync state variables
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'success' | 'error' | 'loading' | 'cached'>(() => {
    const isLocal = localStorage.getItem('formacao_pescadores_is_local_db_mode') === 'true';
    return isLocal ? 'cached' : 'cached';
  });
  const [showSharingGuide, setShowSharingGuide] = useState(false);

  // Keep localStorage in sync with current state
  useEffect(() => {
    if (dataState) {
      const key = isLocalDatabaseMode ? 'formacao_pescadores_local_db_state' : 'formacao_pescadores_state';
      localStorage.setItem(key, JSON.stringify(dataState));
    }
  }, [dataState, isLocalDatabaseMode]);

  const handleToggleLocalMode = (isLocal: boolean) => {
    // 1. Save current state to the prior mode key before switching
    const currentKey = isLocalDatabaseMode ? 'formacao_pescadores_local_db_state' : 'formacao_pescadores_state';
    localStorage.setItem(currentKey, JSON.stringify(dataState));

    // 2. Switch mode
    setIsLocalDatabaseMode(isLocal);
    localStorage.setItem('formacao_pescadores_is_local_db_mode', String(isLocal));

    // 3. Load or copy state for the new mode
    const newKey = isLocal ? 'formacao_pescadores_local_db_state' : 'formacao_pescadores_state';
    const savedNew = localStorage.getItem(newKey);
    
    let nextState: SpreadsheetData;
    if (savedNew) {
      try {
        nextState = JSON.parse(savedNew);
      } catch (e) {
        nextState = { ...dataState };
      }
    } else {
      // If no local db exists yet, clone the current spreadsheet data state as baseline
      nextState = { ...dataState };
    }

    nextState.url = targetSheetUrl;
    setDataState(nextState);

    // Notice toast feedback
    setSyncSuccess(isLocal ? "Modo Banco de Dados Local Ativado!" : "Sincronização Online Ativada!");
    setSyncError(null);
    setSyncStatus(isLocal ? 'cached' : 'success');
    setTimeout(() => setSyncSuccess(null), 3500);
  };

  const handleClearLocalDatabase = () => {
    const confirmation = window.confirm("Deseja realmente apagar todos os registros do seu Banco de Dados Interno? Esta ação é permanente.");
    if (!confirmation) return;

    setDataState(prev => ({
      ...prev,
      rows: [],
      lastSynced: new Date().toISOString()
    }));
    
    setSyncSuccess("Banco de Dados interno zerado com sucesso!");
    setTimeout(() => setSyncSuccess(null), 3000);
  };

  const handleSeedLocalDatabase = () => {
    const confirmation = window.confirm("Deseja realmente substituir as linhas atuais pelo conjunto oficial de demonstração?");
    if (!confirmation) return;

    setDataState(prev => ({
      ...prev,
      rows: JSON.parse(JSON.stringify(MOCK_SHEET_DATA.rows)),
      lastSynced: new Date().toISOString()
    }));

    setSyncSuccess("Dados de exemplo carregados no Banco de Dados Interno!");
    setTimeout(() => setSyncSuccess(null), 3000);
  };

  const handleExportLocalDatabase = () => {
    try {
      const dataStr = JSON.stringify(dataState, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `backup-banco-pescadores-${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err: any) {
      alert("Erro ao exportar arquivo: " + err.message);
    }
  };

  // Force fetch direct spreadsheet function
  const handleForceSync = async (isManual: boolean = false) => {
    if (isLocalDatabaseMode) {
      if (isManual) {
        setSyncError("⚠️ Você está operando no Modo Banco de Dados Local! Se deseja atualizar os dados a partir do Google Planilhas, alterne para o 'Modo Planilha' no seletor do cabeçalho.");
        setSyncStatus('error');
      }
      return;
    }

    setSyncLoading(true);
    setSyncSuccess(null);
    if (isManual) {
      setSyncError(null);
    }
    setSyncStatus('loading');
    
    const csvUrl = getSheetsCsvUrl(targetSheetUrl);
    if (!csvUrl) {
      setSyncLoading(false);
      if (isManual) {
        setSyncError("Link da planilha inválido");
        setSyncStatus('error');
      } else {
        setSyncStatus('cached');
      }
      return;
    }

    try {
      const proxyUrl = `/api/proxy-sheet?url=${encodeURIComponent(csvUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        let errMsg = `Código de status: ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson && errJson.error) {
            errMsg = errJson.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }
      const csvText = await response.text();
      
      if (!csvText || csvText.includes('Sign in - Google Accounts') || csvText.includes('<!DOCTYPE html>')) {
        throw new Error('Certifique-se de que a planilha está em modo Público ("Qualquer pessoa com o link" como Leitor)!');
      }

      const parsedData = processRawSpreadsheetData(csvText, targetSheetUrl);
      parsedData.title = "Formação de Pescadores";
      setDataState(parsedData);
      setSyncSuccess("Sincronizado!");
      setSyncStatus('success');
      setTimeout(() => setSyncSuccess(null), 3500);
    } catch (err: any) {
      console.warn("[BackgroundSync]", err.message || err);
      if (isManual) {
        setSyncError(err.message || "Erro de rede ao conectar à planilha.");
        setSyncStatus('error');
      } else {
        setSyncStatus('cached');
      }
    } finally {
      setSyncLoading(false);
    }
  };

  // Auto-fetch spreadsheet on boot to have instantly fresh data (only if not using offline local database)
  useEffect(() => {
    if (!isLocalDatabaseMode) {
      handleForceSync(false);
    }
  }, []);

  // Update dynamic filter callbacks
  const handleFilterChange = (colName: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [colName]: value
    }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
  };

  // State manipulation triggers for client records
  const handleAddRow = (newRow: DataRecord) => {
    setDataState(prev => {
      const updatedRows = [newRow, ...prev.rows];
      
      // Update possible values for categorical filters
      const updatedColumns = prev.columns.map(col => {
        const newVal = String(newRow[col.name] || '').trim();
        if (col.type === 'categorical' && newVal && !col.distinctValues.includes(newVal)) {
          return {
            ...col,
            distinctValues: [...col.distinctValues, newVal]
          };
        }
        return col;
      });

      return {
        ...prev,
        columns: updatedColumns,
        rows: updatedRows,
        lastSynced: new Date().toISOString()
      };
    });
  };

  const handleDeleteRow = (index: number) => {
    setDataState(prev => {
      const updatedRows = prev.rows.filter((_, idx) => idx !== index);
      return {
        ...prev,
        rows: updatedRows,
        lastSynced: new Date().toISOString()
      };
    });
  };

  const handleUpdateRow = (index: number, updatedFields: Partial<DataRecord>) => {
    setDataState(prev => {
      const updatedRows = prev.rows.map((row, idx) => {
        if (idx === index) {
          return { ...row, ...updatedFields };
        }
        return row;
      });

      // Scan and update unique categorical list if statuses changed
      const updatedColumns = prev.columns.map(col => {
        if (col.type === 'categorical') {
          const vals = new Set<string>();
          updatedRows.forEach(r => {
            const v = String(r[col.name] || '').trim();
            if (v) vals.add(v);
          });
          return {
            ...col,
            distinctValues: Array.from(vals)
          };
        }
        return col;
      });

      return {
        ...prev,
        columns: updatedColumns,
        rows: updatedRows,
        lastSynced: new Date().toISOString()
      };
    });
  };

  const handleRenameOption = (colName: string, oldValue: string, newValue: string) => {
    setDataState(prev => {
      // 1. Rename other row values
      const updatedRows = prev.rows.map(row => {
        if (String(row[colName] || '').trim() === oldValue.trim()) {
          return { ...row, [colName]: newValue };
        }
        return row;
      });

      // 2. Rename in columns/distinctValues
      const updatedColumns = prev.columns.map(col => {
        if (col.name === colName) {
          const updatedValues = col.distinctValues.map(v => 
            v.trim() === oldValue.trim() ? newValue : v
          );
          return {
            ...col,
            distinctValues: updatedValues
          };
        }
        return col;
      });

      return {
        ...prev,
        columns: updatedColumns,
        rows: updatedRows,
        lastSynced: new Date().toISOString()
      };
    });
  };

  const handleAddCustomOption = (colName: string, newValue: string) => {
    setDataState(prev => {
      const trimmedValue = newValue.trim();
      const updatedColumns = prev.columns.map(col => {
        if (col.name === colName) {
          if (!col.distinctValues.includes(trimmedValue)) {
            return {
              ...col,
              distinctValues: [...col.distinctValues, trimmedValue]
            };
          }
        }
        return col;
      });

      return {
        ...prev,
        columns: updatedColumns,
        lastSynced: new Date().toISOString()
      };
    });
  };

  const handleSyncComplete = (newData: SpreadsheetData) => {
    setDataState(newData);
    setActiveFilters({}); // Reset local active filters
    
    // Save custom URL to state and localStorage if it is a google sheets URL
    if (newData.url && newData.url.includes("docs.google.com/spreadsheets")) {
      setTargetSheetUrl(newData.url);
      localStorage.setItem('formacao_pescadores_target_sheet_url', newData.url);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-900 font-sans antialiased text-white">
      
      {/* Top Main Status Bar & Header Layout */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          {/* Logo and info */}
          <button 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity cursor-pointer focus:outline-none bg-transparent border-none p-0"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/40">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-black text-lg sm:text-xl text-white tracking-tight uppercase">
                  Controle de Formação
                </h1>
                {isLocalDatabaseMode ? (
                  <span className="bg-cyan-500/20 border border-cyan-500/35 text-[9px] uppercase font-black text-cyan-300 px-2 py-0.5 rounded-lg tracking-wider flex items-center gap-1 shrink-0">
                    💾 Banco de Dados local
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 border border-emerald-500/35 text-[9px] uppercase font-black text-emerald-300 px-2 py-0.5 rounded-lg tracking-wider flex items-center gap-1 shrink-0">
                    🌐 Sincronizado Sheets
                  </span>
                )}
              </div>
              <p className="text-indigo-200 text-xs truncate max-w-[280px] sm:max-w-md font-medium mt-0.5">
                {isLocalDatabaseMode ? "Armazenamento off-line e isolado no navegador" : "FormacaoPescadores • Drive Link"}
              </p>
            </div>
          </button>

          {/* Unified Controls: Database switch & Sincronização */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            
            {/* Elegant Mode Switcher */}
            <div className="flex bg-slate-950/60 p-1 rounded-2xl border border-white/10 items-center gap-0.5 text-[10px] font-black uppercase shadow-inner">
              <button
                type="button"
                onClick={() => handleToggleLocalMode(false)}
                className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                  !isLocalDatabaseMode 
                    ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-md font-black' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title="Sincronizar dados em tempo real com a planilha do Google Sheets"
              >
                🌐 Planilha Nuvem
              </button>
              <button
                type="button"
                onClick={() => handleToggleLocalMode(true)}
                className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                  isLocalDatabaseMode 
                    ? 'bg-gradient-to-br from-indigo-500 to-cyan-600 text-white shadow-md font-black' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title="Usar banco de dados local off-line (sem sincronizar e sem sobrescrever)"
              >
                💾 Banco Interno
              </button>
            </div>

            {/* Sync Trigger / Indicator */}
            <div className="flex items-center gap-2 text-xs">
              {dataState.lastSynced && (
                <span className="bg-white/5 border border-white/15 text-slate-350 px-3.5 py-2 rounded-full font-bold">
                  {isLocalDatabaseMode ? 'Atualizado às: ' : 'Lida em: '}{new Date(dataState.lastSynced).toLocaleTimeString('pt-BR')}
                </span>
              )}
              
              {!isLocalDatabaseMode && (
                <button 
                  id="header-tab-sync-shortcut"
                  onClick={() => handleForceSync(true)}
                  disabled={syncLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold px-5 py-2.5 rounded-full flex items-center gap-1.5 transition-all shadow-lg hover:shadow-indigo-600/30 border border-indigo-500/30 cursor-pointer text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : 'animate-pulse'}`} /> 
                  {syncLoading ? 'Buscando...' : 'Ler Planilha'}
                </button>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Main Container Wrapper */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        
        {/* Sync Status Notifications */}
        {syncSuccess && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl flex items-center gap-2.5 animate-fade-in text-sm font-bold">
            <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 font-black">✓</span>
            <span>Planilha carregada do Google Planilhas em tempo real!</span>
          </div>
        )}

        {syncError && (
          <div className="mb-6 p-6 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-[2rem] relative animate-fade-in text-xs font-semibold leading-relaxed shadow-lg">
            {/* Close button top right */}
            <button 
              onClick={() => setSyncError(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-sm"
              title="Fechar Alerta"
            >
              ×
            </button>

            <div className="flex items-start gap-3.5 pr-6">
              <div className="p-2 rounded-2xl bg-rose-500/20 text-rose-450 mt-0.5 font-bold shrink-0">
                ⚠️
              </div>
              <div className="space-y-2">
                <div>
                  <p className="font-black text-rose-200 text-sm md:text-base">Problema ao Sincronizar com o Google Planilhas</p>
                  <p className="text-slate-300 mt-1 font-medium text-xs md:text-sm">{syncError}</p>
                </div>
                
                <p className="text-slate-400 font-medium">
                  Por padrão, planilhas criadas no Google Drive são privadas. Para que este aplicativo consiga ler os dados atualizados em tempo real, você só precisa compartilhá-la publicamente para leitura.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => setShowSharingGuide(!showSharingGuide)}
                    className="bg-white/10 hover:bg-white/15 text-white font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs border border-white/10"
                  >
                    {showSharingGuide ? "Ocultar Passo a Passo" : "Ver Passo a Passo (Fácil)"}
                  </button>

                  <a 
                    href={targetSheetUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 text-xs shadow-md"
                  >
                    Abrir Planilha Atual ↗
                  </a>

                  <button
                    onClick={() => {
                      handleToggleLocalMode(true);
                      setSyncError(null);
                    }}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 text-xs"
                  >
                    💾 Ativar Banco Interno (Isolado e Offline)
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('integracao');
                      setSyncError(null);
                    }}
                    className="bg-indigo-650 hover:bg-indigo-550 text-white font-extrabold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 text-xs border border-indigo-500/20"
                  >
                    🔗 Configurar Meu Link Customizado
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible Stepper Visual Sharing Guide */}
            {showSharingGuide && (
              <div className="mt-6 pt-6 border-t border-white/10 space-y-4 animate-fade-in">
                <p className="text-white text-xs font-black uppercase tracking-wider">Como liberar o acesso à sua Planilha:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Step 1 */}
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-left space-y-1">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-[10px] font-black">1</span>
                    <p className="text-white font-bold text-xs">Abrir Links</p>
                    <p className="text-slate-400 text-[10.5px] leading-snug">
                      Abra a planilha pelo botão acima ou no seu Google Drive.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-left space-y-1">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-[10px] font-black">2</span>
                    <p className="text-white font-bold text-xs">Compartilhar</p>
                    <p className="text-slate-400 text-[10.5px] leading-snug">
                      No canto superior direito, clique no botão azul <b>"Compartilhar"</b>.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-left space-y-1">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-[10px] font-black">3</span>
                    <p className="text-white font-bold text-xs">Acesso Geral</p>
                    <p className="text-slate-400 text-[10.5px] leading-snug">
                      Sob "Acesso geral", altere de "Restrito" para <b>"Qualquer pessoa com o link"</b>.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-left space-y-1">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-[10px] font-black">4</span>
                    <p className="text-white font-bold text-xs">Função Leitor</p>
                    <p className="text-slate-400 text-[10.5px] leading-snug">
                      Garanta que a permissão à direita está em <b>"Leitor"</b> (viewer).
                    </p>
                  </div>

                  {/* Step 5 */}
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-left space-y-1">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-[10px] font-black">5</span>
                    <p className="text-emerald-300 font-bold text-xs">Concluir</p>
                    <p className="text-slate-400 text-[10.5px] leading-snug">
                      Clique em "Concluído" e depois clique em <b>"Atualizar Planilha"</b> no topo desta página!
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-200">
                  💡 <b>Por que isso é seguro?</b> O modo "Leitor" permite que o aplicativo exiba os gráficos e dados sem risco de pessoas não autorizadas modificarem ou apagarem o conteúdo da sua planilha original.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile touch guidance banner */}
        {showMobileTip && (
          <div className="mb-6 p-5 bg-white/5 backdrop-blur-md border border-white/15 rounded-3xl flex justify-between items-center text-xs text-slate-300">
            <div className="flex gap-3.5 items-center">
              <Smartphone className="w-6 h-6 text-indigo-400 shrink-0" />
              <div>
                <p className="font-bold text-white text-sm">Layout Adaptado para Touch</p>
                <p className="mt-0.5 text-slate-400">Navegue pelas abas usando os botões extra grandes e atualize os dados com apenas 1 clique.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowMobileTip(false)}
              className="text-slate-400 hover:text-white font-black px-2 py-1 text-base shrink-0 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Navigation Breadcrumbs & Voltar Button (Only shown when inside dynamic pages) */}
        {activeTab !== 'home' && (
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('home')}
                className="bg-white/10 hover:bg-white/15 text-white py-2 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-white/5 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Voltar ao Portal</span>
              </button>
              
              <div className="h-5 w-[1px] bg-white/15 hidden sm:block" />
              
              <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-indigo-200">
                <span className="text-slate-400 hover:text-white cursor-pointer" onClick={() => setActiveTab('home')}>Início</span>
                <span className="text-slate-500">›</span>
                <span className="text-white">
                  {activeTab === 'dashboard' ? 'Dashboard Geral' : activeTab === 'cadastro' ? 'Ficha de Cadastro' : activeTab === 'consulta' ? 'Consulta de Pescadores' : 'Sincronizar Planilha'}
                </span>
              </div>
            </div>

            {/* Practical Quick page-switcher at the top-right */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600 border-indigo-500/40 text-white shadow-md'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Dashboard
              </button>
              
              <button
                onClick={() => setActiveTab('cadastro')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'cadastro'
                    ? 'bg-emerald-600 border-emerald-500/40 text-white shadow-md'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Cadastro
              </button>

              <button
                onClick={() => setActiveTab('consulta')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'consulta'
                    ? 'bg-indigo-600 border-indigo-500/40 text-white shadow-md'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                }`}
              >
                <Search className="w-3.5 h-3.5" /> Consultar
              </button>

              <button
                onClick={() => setActiveTab('integracao')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'integracao'
                    ? 'bg-indigo-600 border-indigo-500/40 text-white shadow-md animate-pulse'
                    : 'bg-gradient-to-r from-indigo-500/10 to-blue-550/10 hover:from-indigo-500/20 hover:to-blue-550/20 border-indigo-500/20 text-indigo-300 hover:text-white'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Planilha
              </button>
            </div>
          </div>
        )}

        {/* PAGE 1: PORTAL HOME HUB */}
        {activeTab === 'home' && (
          <div className="animate-fade-in space-y-8">
            {/* Glowing system banner portal */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 p-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[10px] text-indigo-300 font-extrabold mb-4 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> SISTEMA DE CONTROLE ATIVO
                </div>
                <h2 className="text-2xl sm:text-3.5xl font-black text-white tracking-tight leading-tight">
                  Controle de Formação de Pescadores
                </h2>
                <p className="mt-2 text-indigo-100 text-sm md:text-base leading-relaxed">
                  Sistema inteligente e dinâmico de gestão para capacitação profissional, integrado em tempo real com o banco de dados oficial do Google Sheets. Escolha uma das operações do menu abaixo para começar.
                </p>
              </div>
            </div>

            {/* EXPLICIT USER REQUIREMENT: Menu interativo e com botões */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* BOTÃO GRANDE E COLORIDO: DASHBOARD */}
              <button
                id="portal-dashboard-btn"
                onClick={() => setActiveTab('dashboard')}
                className="flex flex-col items-start gap-5 p-6 md:p-8 rounded-[2.5rem] border transition-all text-left relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/15 hover:-translate-y-1 active:translate-y-0 cursor-pointer bg-gradient-to-br from-slate-900/40 via-blue-950/40 to-indigo-900/50 border-white/10 hover:border-indigo-400/40 text-slate-300 animate-fade-in"
              >
                <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all pointer-events-none" />
                
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-gradient-to-tr group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white shadow-lg">
                  <BarChart3 className="w-8 h-8" />
                </div>
                
                <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full tracking-wider inline-block">
                      Módulo Estatístico
                    </span>
                    <h2 className="font-extrabold text-xl tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                      Dashboard Geral ›
                    </h2>
                    <p className="text-[12.5px] font-medium text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                      Acesse estatísticas, gráficos dinâmicos de escolaridade, quadros Kanban e a tabela de matrículas.
                    </p>
                  </div>
                </div>
              </button>
 
              {/* BOTÃO GRANDE E COLORIDO: CADASTRO */}
              <button
                id="portal-cadastro-btn"
                onClick={() => setActiveTab('cadastro')}
                className="flex flex-col items-start gap-5 p-6 md:p-8 rounded-[2.5rem] border transition-all text-left relative overflow-hidden group hover:shadow-2xl hover:shadow-emerald-500/15 hover:-translate-y-1 active:translate-y-0 cursor-pointer bg-gradient-to-br from-slate-900/40 via-teal-950/40 to-emerald-900/50 border-white/10 hover:border-emerald-400/40 text-slate-300 animate-fade-in"
              >
                <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all pointer-events-none" />
                
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-gradient-to-tr group-hover:from-emerald-500 group-hover:to-teal-600 group-hover:text-white shadow-lg">
                  <UserPlus className="w-8 h-8" />
                </div>
                
                <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full tracking-wider inline-block">
                      Formulário e Ficha
                    </span>
                    <h2 className="font-extrabold text-xl tracking-tight text-white group-hover:text-emerald-200 transition-colors">
                      Ficha de Cadastro ›
                    </h2>
                    <p className="text-[12.5px] font-medium text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                      Abre a Ficha do pescador para preenchimento dinâmico e registro inteligente de novos alunos.
                    </p>
                  </div>
                </div>
              </button>

              {/* BOTÃO GRANDE E COLORIDO: CONSULTA */}
              <button
                id="portal-consulta-btn"
                onClick={() => setActiveTab('consulta')}
                className="flex flex-col items-start gap-5 p-6 md:p-8 rounded-[2.5rem] border transition-all text-left relative overflow-hidden group hover:shadow-2xl hover:shadow-violet-500/15 hover:-translate-y-1 active:translate-y-0 cursor-pointer bg-gradient-to-br from-slate-900/40 via-violet-950/40 to-purple-900/50 border-white/10 hover:border-violet-400/40 text-slate-300 animate-fade-in"
              >
                <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/15 transition-all pointer-events-none" />
                
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300 bg-violet-500/10 text-violet-400 border border-violet-500/20 group-hover:bg-gradient-to-tr group-hover:from-violet-500 group-hover:to-fuchsia-600 group-hover:text-white shadow-lg">
                  <Search className="w-8 h-8" />
                </div>
                
                <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="bg-violet-500/20 text-violet-350 border border-violet-500/30 text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full tracking-wider inline-block">
                      Pesquisa por Nome/CPF
                    </span>
                    <h2 className="font-extrabold text-xl tracking-tight text-white group-hover:text-violet-200 transition-colors">
                      Consultar Cadastro ›
                    </h2>
                    <p className="text-[12.5px] font-medium text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                      Busque pescadores por nome ou CPF, altere presença, confira situações e imprima comprovantes oficiais.
                    </p>
                  </div>
                </div>
              </button>

              {/* BOTÃO GRANDE E COLORIDO: SINCRONIZAÇÃO */}
              <button
                id="portal-sync-settings-btn"
                onClick={() => setActiveTab('integracao')}
                className="flex flex-col items-start gap-5 p-6 md:p-8 rounded-[2.5rem] border transition-all text-left relative overflow-hidden group hover:shadow-2xl hover:shadow-amber-500/15 hover:-translate-y-1 active:translate-y-0 cursor-pointer bg-gradient-to-br from-slate-900/40 via-amber-950/20 to-indigo-950/40 border-white/10 hover:border-amber-400/40 text-slate-300 animate-fade-in"
              >
                <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-300/10 transition-all pointer-events-none" />
                
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300 bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-gradient-to-tr group-hover:from-amber-500 group-hover:to-orange-600 group-hover:text-white shadow-lg">
                  <RefreshCw className="w-8 h-8" />
                </div>
                
                <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full tracking-wider inline-block">
                      Planilha e Banco
                    </span>
                    <h2 className="font-extrabold text-xl tracking-tight text-white group-hover:text-amber-200 transition-colors">
                      Conectar Planilha ›
                    </h2>
                    <p className="text-[12.5px] font-medium text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                      Configure o link do Google Sheets, lance arquivos CSV locais ou mude para o Banco de Dados Interno.
                    </p>
                  </div>
                </div>
              </button>
 
            </div>
 
            {/* Elegant database status indicator row */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total de Registros carregados</p>
                  <p className="text-xl font-black text-white mt-0.5">
                    {dataState.rows.length} {dataState.rows.length === 1 ? 'Pesca' : 'Pescadores'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{isLocalDatabaseMode ? 'Última modificação' : 'Última leitura realizada'}</p>
                  <p className="text-sm font-extrabold text-white mt-1">
                    {dataState.lastSynced ? new Date(dataState.lastSynced).toLocaleTimeString('pt-BR') : 'Sem leitura'}
                  </p>
                </div>
              </div>
              {isLocalDatabaseMode ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
                    <span className="text-sm">🔋</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Status de Sincronia</p>
                    <span className="text-[10px] font-black bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-md inline-block mt-1 uppercase">
                      Banco Interno (Offline)
                    </span>
                  </div>
                </div>
              ) : syncStatus === 'success' ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Status de Sincronia</p>
                    <span className="text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md inline-block mt-1 uppercase">
                      Planilha Pública (Acesso OK)
                    </span>
                  </div>
                </div>
              ) : syncStatus === 'loading' ? (
                <div className="flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Status de Sincronia</p>
                    <span className="text-[10px] font-black bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md inline-block mt-1 uppercase">
                      Carregando Dados...
                    </span>
                  </div>
                </div>
              ) : syncStatus === 'error' ? (
                <button 
                  onClick={() => {
                    setShowSharingGuide(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="flex items-center gap-4 text-left hover:bg-white/5 p-2 rounded-2xl transition-all cursor-pointer w-full focus:outline-none border-none bg-transparent"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
                     <RefreshCw className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Status de Sincronia</p>
                    <span className="text-[10px] font-black bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md inline-block mt-1 uppercase">
                      Privada / Bloqueada ⚠️
                    </span>
                    <span className="block text-[9px] text-slate-400 mt-0.5 underline">Clique para ver como liberar</span>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Status de Sincronia</p>
                    <span className="text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md inline-block mt-1 uppercase">
                      Dados Locais Offline (Modo Cache)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Local Database Master Control Dashboard Panel */}
            {isLocalDatabaseMode && (
              <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950 border border-cyan-500/25 rounded-[2.5rem] p-6 backdrop-blur-md space-y-6 relative overflow-hidden animate-fade-in shadow-2xl shadow-cyan-950/20">
                <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-2xl flex items-center justify-center shrink-0 animate-pulse">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                        Painel do Banco de Dados Interno
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Gestão off-line de registros. Suas modificações estão salvas de forma persistente e isolada de sincronizações externas.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      onClick={handleExportLocalDatabase}
                      className="bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md flex-1 md:flex-initial justify-center"
                    >
                      📤 Exportar Backup JSON
                    </button>
                    <button
                      onClick={handleSeedLocalDatabase}
                      className="bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-200 border border-cyan-500/20 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md flex-1 md:flex-initial justify-center"
                    >
                      🧪 Dados Demonstrativos
                    </button>
                    <button
                      onClick={handleClearLocalDatabase}
                      className="bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 text-rose-300 hover:text-rose-250 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md flex-1 md:flex-initial justify-center"
                    >
                      🗑️ Limpar Banco
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-[11px] text-slate-350">
                  <div className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl flex items-start gap-2.5">
                    <span className="text-cyan-400">🛡️</span>
                    <div>
                      <p className="font-extrabold text-white text-xs">Isolamento Seguro</p>
                      <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed text-slate-300">Seus dados não sofrem interferência da planilha remota, ideal para cadastrar rascunhos ou usar totalmente em campo.</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl flex items-start gap-2.5">
                    <span className="text-cyan-400">⚡</span>
                    <div>
                      <p className="font-extrabold text-white text-xs">Alta Performance</p>
                      <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed text-slate-300">Sem carregar redes externas, a inicialização e gravação dos dados são instantâneas.</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl flex items-start gap-2.5">
                    <span className="text-cyan-400">📁</span>
                    <div>
                      <p className="font-extrabold text-white text-xs">Portabilidade Garantida</p>
                      <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed text-slate-300">Você pode exportar o arquivo de backup a qualquer momento e migrar para outros computadores.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* PAGE 2: DASHBOARD PAGE */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in space-y-6">
            
            {/* Page Header Info block */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <p className="text-xs font-black uppercase text-slate-450 tracking-wider">Módulos Estatísticos e Métricas Ativas</p>
            </div>
            
            {/* Dashboard Sub-visualizers Tabs Header switcher */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                <p className="text-xs uppercase font-extrabold tracking-wider text-slate-350">
                  Visualização Ativa:
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setDashboardSubTab('graficos')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    dashboardSubTab === 'graficos'
                      ? 'bg-indigo-600 border border-indigo-500/40 text-white shadow-md'
                      : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" /> Estatísticas e Gráficos
                </button>
                
                <button
                  onClick={() => setDashboardSubTab('kanban')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    dashboardSubTab === 'kanban'
                      ? 'bg-indigo-600 border border-indigo-500/40 text-white shadow-md'
                      : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Kanban className="w-4 h-4" /> Quadro Kanban
                </button>
                
                <button
                  onClick={() => setDashboardSubTab('tabela')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    dashboardSubTab === 'tabela'
                      ? 'bg-indigo-600 border border-indigo-500/40 text-white shadow-md'
                      : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Table2 className="w-4 h-4" /> Tabela Completa
                </button>
              </div>
            </div>

            {/* View renders */}
            <div className="transition-all duration-300 mt-4">
              {dashboardSubTab === 'graficos' && (
                <div className="animate-fade-in">
                  <ChartSection data={dataState} activeFilters={activeFilters} />
                </div>
              )}

              {dashboardSubTab === 'kanban' && (
                <div className="animate-fade-in">
                  <KanbanBoard 
                    data={dataState} 
                    activeFilters={activeFilters} 
                    onUpdateRow={handleUpdateRow} 
                  />
                </div>
              )}

              {dashboardSubTab === 'tabela' && (
                <div className="animate-fade-in">
                  <DataTable 
                    data={dataState}
                    activeFilters={activeFilters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                    onAddRow={handleAddRow}
                    onDeleteRow={handleDeleteRow}
                  />
                </div>
              )}
            </div>

          </div>
        )}

        {/* PAGE 3: CADASTRO PAGE */}
        {activeTab === 'cadastro' && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <p className="text-xs font-black uppercase text-slate-450 tracking-wider">Ficha inteligente e formulário dinâmico do aluno</p>
            </div>
            
            <DedicatedForm 
              data={dataState}
              onAddRow={handleAddRow}
              onDeleteRow={handleDeleteRow}
              onRenameOption={handleRenameOption}
              onAddCustomOption={handleAddCustomOption}
            />
          </div>
        )}

        {/* PAGE 4: CONSULTA PAGE */}
        {activeTab === 'consulta' && (
          <div className="animate-fade-in space-y-6">
            <SearchPage 
              data={dataState}
              onDeleteRow={handleDeleteRow}
              onUpdateRow={handleUpdateRow}
            />
          </div>
        )}

        {/* PAGE 5: INTEGRACAO / PLANILHA PAGE */}
        {activeTab === 'integracao' && (
          <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isLocalDatabaseMode ? 'bg-cyan-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                  <p className="text-xs font-black uppercase text-slate-300 tracking-wider">
                    Origem de Dados: {isLocalDatabaseMode ? 'Banco de Dados Interno (Isolado/Offline)' : 'Planilha Remota (Sincronizada)'}
                  </p>
                </div>
                <p className="text-slate-400 text-xs mt-1 leading-snug">
                  Mude a planilha do Google vinculada, carregue planilhas em formato CSV local ou alterne para o Banco de Dados Interno.
                </p>
              </div>

              <button
                onClick={() => handleToggleLocalMode(!isLocalDatabaseMode)}
                className={`text-xs px-5 py-2.5 rounded-2xl border font-black transition-all cursor-pointer ${
                  isLocalDatabaseMode
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                }`}
              >
                {isLocalDatabaseMode ? '🔄 Utilizar Planilha do Google (Online)' : '💾 Utilizar Banco Interno (Isolado e Seguido)'}
              </button>
            </div>

            <SyncPanel 
              currentData={dataState} 
              onSyncData={handleSyncComplete} 
            />
          </div>
        )}

      </main>

      {/* Humble Footer */}
      <footer className="bg-white/5 border-t border-white/10 py-8 mt-16 text-center text-xs text-slate-350 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-extrabold text-slate-250">
            Controle de Formação — Gestão para Formação de Pescadores
          </p>
          <p className="mt-1.5 text-slate-400">
            Plataforma interativa sincronizada em tempo real com o Google Sheets. Frosted Glass theme ativo.
          </p>
        </div>
      </footer>

    </div>
  );
}
