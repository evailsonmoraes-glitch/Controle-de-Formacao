import React, { useState, useRef } from 'react';
import { RefreshCw, FileSpreadsheet, Upload, HelpCircle, Loader2, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { SpreadsheetData } from '../types';
import { getSheetsCsvUrl, processRawSpreadsheetData } from '../utils/csvParser';
import MOCK_SHEET_DATA from '../utils/mockData';

interface SyncPanelProps {
  currentData: SpreadsheetData;
  onSyncData: (data: SpreadsheetData) => void;
}

export default function SyncPanel({ currentData, onSyncData }: SyncPanelProps) {
  const [sheetUrl, setSheetUrl] = useState(currentData.url || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSyncSheets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const csvUrl = getSheetsCsvUrl(sheetUrl);
    
    if (!csvUrl) {
      setLoading(false);
      setErrorMsg('A URL informada não parece ser um link válido do Google Planilhas. Certifique-se de que o link contém "/spreadsheets/d/ID/".');
      return;
    }

    try {
      // Try to fetch spreadsheet as CSV
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          throw new Error('Acesso negado (401/403). A planilha pode estar configurada como Privada no Google Sheets.');
        }
        throw new Error(`Erro na sincronização automática. Status HTTP: ${response.status}`);
      }

      const csvText = await response.text();
      
      if (!csvText || csvText.includes('Sign in - Google Accounts') || csvText.includes('<!DOCTYPE html>')) {
        // Redirected to login page because spreadsheet is private
        throw new Error('A planilha está de fato PRIVADA. O Google solicitou autenticação para exportação.');
      }

      const parsedData = processRawSpreadsheetData(csvText, sheetUrl);
      onSyncData(parsedData);
      setSuccessMsg('Sua planilha foi sincronizada e mapeada com sucesso em tempo real!');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message || 
        'Erro na conexão. Isso ocorre quando a planilha do Google está em modo privado ou bloqueada por políticas de CORS.'
      );
    } finally {
      setLoading(false);
    }
  };

  const parseFileAndLoad = (file: File) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error('Não foi possível ler o conteúdo do arquivo.');

        const fileName = file.name.replace(/\.[^/.]+$/, "");
        const parsedData = processRawSpreadsheetData(text, `file://${file.name}`);
        parsedData.title = `Tabela: ${fileName}`;
        
        onSyncData(parsedData);
        setSuccessMsg(`Arquivo de dados "${file.name}" carregado e estruturado localmente!`);
      } catch (err: any) {
        setErrorMsg(`Falha ao converter arquivo: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Erro na leitura física do arquivo selecionado.');
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        parseFileAndLoad(file);
      } else {
        setErrorMsg('Por favor, faça upload de arquivos no formato .CSV para mapeamento correto.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseFileAndLoad(e.target.files[0]);
    }
  };

  const loadExample = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    onSyncData(MOCK_SHEET_DATA);
    setSheetUrl(MOCK_SHEET_DATA.url);
    setSuccessMsg('Base de demonstração recarregada com sucesso!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      
      {/* Cloud Integration Setup Form */}
      <div 
        id="sync-cloud-gspreadsheets"
        className="lg:col-span-7 bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-xl flex flex-col justify-between text-white"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/15 border border-indigo-500/25 rounded-2xl text-indigo-455">
              <FileSpreadsheet className="w-6 h-6 shrink-0 text-indigo-400" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-lg uppercase tracking-tight">
                Integração com Google Planilhas
              </h4>
              <p className="text-slate-400 text-xs">Mapeie dados corporativos remotamente na nuvem em tempo real</p>
            </div>
          </div>

          <form onSubmit={handleSyncSheets} className="space-y-3 pt-2">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Link de Compartilhamento da Planilha (URL)
              </label>
              <input 
                type="text"
                id="sync-sheet-url-input"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full bg-slate-950/40 border border-white/10 focus:border-indigo-500 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium min-h-[48px] placeholder-slate-500 transition-colors"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
              />
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-500/10 backdrop-blur-md border border-rose-500/20 text-rose-300 rounded-xl text-xs flex gap-2.5 items-start">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-450" />
                <div className="space-y-1">
                  <p className="font-extrabold text-rose-250">Aviso de Sincronização:</p>
                  <p>{errorMsg}</p>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex gap-2.5 items-center">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <span className="font-bold text-emerald-250">{successMsg}</span>
              </div>
            )}

            {/* Giant Sync Button */}
            <button 
              id="sync-sheets-action-btn"
              type="submit"
              disabled={loading || !sheetUrl.trim()}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-750 disabled:opacity-50 text-white font-extrabold text-base px-6 py-4 rounded-xl transition-all shadow-md min-h-[56px] hover:scale-[1.01] cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" /> Conectando e lendo tabela...
                </>
              ) : (
                <>
                  <RefreshCw className="w-6 h-6" /> Sincronizar Informações da Nuvem
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between text-xs text-slate-400">
          <div>
            <span>Status atual: </span>
            <span className="font-bold text-indigo-400 uppercase tracking-wider">
              {currentData.rows.length} registros ativos
            </span>
          </div>
          <button 
            id="sync-load-example-btn"
            onClick={loadExample}
            className="text-indigo-400 font-extrabold hover:text-indigo-300 py-1 cursor-pointer"
          >
            Carregar Dados de Demonstração (Mock)
          </button>
        </div>
      </div>

      {/* Manual File Uploader Selector (Drag & Drop) */}
      <div 
        id="sync-file-uploader"
        className="lg:col-span-5 bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-xl flex flex-col justify-between text-white"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/15 border border-indigo-500/25 rounded-2xl text-indigo-400 font-extrabold">
              <Upload className="w-6 h-6 shrink-0" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-lg uppercase tracking-tight">
                Lançador Manual CSV
              </h4>
              <p className="text-slate-400 text-xs">Arraste arquivos locais para análise off-line</p>
            </div>
          </div>

          <div 
            id="dropzone-box"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[2rem] p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all min-h-[170px] text-center ${
              dragActive 
                ? 'border-indigo-400 bg-indigo-500/10' 
                : 'border-white/10 hover:border-indigo-500/30 bg-slate-900/40 hover:bg-slate-900/50'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden" 
            />
            <FileText className="w-10 h-10 text-slate-500 group-hover:text-indigo-400 mb-1" />
            <p className="text-white font-bold text-xs tracking-tight">
              Arraste seu arquivo .CSV aqui
            </p>
            <p className="text-slate-400 text-[10px]">Ou clique para navegar no seu dispositivo</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-950/40 rounded-2xl border border-white/5 text-[11px] text-slate-300 flex items-start gap-2.5 leading-relaxed">
          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p>
            <strong>Privacidade Garantida:</strong> Seus dados lidos por arquivo CSV nunca saem do seu computador, garantindo relatórios seguros e em isolamento total de rede.
          </p>
        </div>
      </div>

      {/* Illustrated diagnostic setup tutorials / Guide Card */}
      <div 
        id="sync-diagnostic-tutorials"
        className="lg:col-span-12 bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-xl"
      >
        <h5 className="font-extrabold text-white text-base mb-5 flex items-center gap-2">
          <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">💡</span> Guia de Liberação: Como habilitar sincronização automática ?
        </h5>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
          <div className="p-5 bg-slate-950/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
            <span className="text-2xl font-black text-indigo-400 mb-2.5 block">01</span>
            <h6 className="font-bold text-white text-sm mb-1.5">Abrir Opção "Compartilhar"</h6>
            <p className="leading-relaxed text-slate-400">Abra sua planilha do Google, clique no botão azul <strong>"Compartilhar"</strong> no canto superior direito.</p>
          </div>

          <div className="p-5 bg-slate-950/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
            <span className="text-2xl font-black text-indigo-400 mb-2.5 block">02</span>
            <h6 className="font-bold text-white text-sm mb-1.5">Alterar Liberação Geral</h6>
            <p className="leading-relaxed text-slate-400">Sob "Acesso Geral", mude o parâmetro de <strong>"Restrito"</strong> para <strong>"Qualquer pessoa com o link"</strong> em modo de Leitura.</p>
          </div>

          <div className="p-5 bg-slate-950/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
            <span className="text-2xl font-black text-indigo-400 mb-2.5 block">03</span>
            <h6 className="font-bold text-white text-sm mb-1.5">Copiar, Colar e Sincronizar!</h6>
            <p className="leading-relaxed text-slate-400">Copie o link gerado, insira-o no campo do ManagerCloud e clique em <strong>Sincronizar</strong> para obter todo o fluxo de trabalho.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
