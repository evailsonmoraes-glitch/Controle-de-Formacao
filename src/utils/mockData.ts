import { SpreadsheetData } from '../types';

export const MOCK_SHEET_DATA: SpreadsheetData = {
  title: 'Controle de Formação de Pescadores',
  url: 'https://docs.google.com/spreadsheets/d/1YCniwIBOIsE6-kujz32YsTGj4ByNJUShcQ96i51sDZI/edit?gid=721147271#gid=721147271',
  columns: [
    { name: 'Matrícula', type: 'text', distinctValues: [] },
    { name: 'Nome Pescador', type: 'text', distinctValues: [] },
    { name: 'CPF', type: 'text', distinctValues: [] },
    { name: 'ATA1', type: 'categorical', distinctValues: ['Presente', 'Ausente'] },
    { name: 'ATA2', type: 'categorical', distinctValues: ['Presente', 'Ausente'] },
    { name: 'Nautilus', type: 'categorical', distinctValues: ['Cadastrado', 'Não Cadastrado'] },
    { name: 'Termo', type: 'categorical', distinctValues: ['Assinou', 'Não Assinou'] },
    { name: 'Entidade', type: 'categorical', distinctValues: ['Colônia Z-10 Niterói', 'Colônia Z-12 Angra', 'Colônia Z-13 Copacabana'] },
    { name: 'Local de Formação', type: 'categorical', distinctValues: ['Niterói', 'Angra dos Reis', 'Rio de Janeiro', 'Maricá'] },
    { name: 'Situação', type: 'categorical', distinctValues: ['Pendente', 'Concluído'] }
  ],
  rows: [
    { 'Matrícula': 'PESC-2026-001', 'Nome Pescador': 'Manuel dos Santos Neto', 'CPF': '123.456.789-01', 'ATA1': 'Presente', 'ATA2': 'Presente', 'Nautilus': 'Cadastrado', 'Termo': 'Assinou', 'Entidade': 'Colônia Z-10 Niterói', 'Local de Formação': 'Niterói', 'Situação': 'Concluído' },
    { 'Matrícula': 'PESC-2026-002', 'Nome Pescador': 'Antônio Moacyr Pereira', 'CPF': '234.567.890-12', 'ATA1': 'Presente', 'ATA2': 'Ausente', 'Nautilus': 'Não Cadastrado', 'Termo': 'Assinou', 'Entidade': 'Colônia Z-12 Angra', 'Local de Formação': 'Angra dos Reis', 'Situação': 'Pendente' },
    { 'Matrícula': 'PESC-2026-003', 'Nome Pescador': 'Sebastião Jorge Souza', 'CPF': '345.678.901-23', 'ATA1': 'Presente', 'ATA2': 'Presente', 'Nautilus': 'Cadastrado', 'Termo': 'Não Assinou', 'Entidade': 'Colônia Z-10 Niterói', 'Local de Formação': 'Niterói', 'Situação': 'Pendente' },
    { 'Matrícula': 'PESC-2026-004', 'Nome Pescador': 'Maria Conceição das Neves', 'CPF': '456.789.012-34', 'ATA1': 'Ausente', 'ATA2': 'Ausente', 'Nautilus': 'Não Cadastrado', 'Termo': 'Não Assinou', 'Entidade': 'Colônia Z-13 Copacabana', 'Local de Formação': 'Rio de Janeiro', 'Situação': 'Pendente' },
    { 'Matrícula': 'PESC-2026-005', 'Nome Pescador': 'Clarice Pinheiro Melo', 'CPF': '567.890.123-45', 'ATA1': 'Presente', 'ATA2': 'Presente', 'Nautilus': 'Cadastrado', 'Termo': 'Assinou', 'Entidade': 'Colônia Z-12 Angra', 'Local de Formação': 'Angra dos Reis', 'Situação': 'Concluído' },
    { 'Matrícula': 'PESC-2026-006', 'Nome Pescador': 'Benedito Alvarenga Filho', 'CPF': '678.901.234-56', 'ATA1': 'Presente', 'ATA2': 'Presente', 'Nautilus': 'Não Cadastrado', 'Termo': 'Não Assinou', 'Entidade': 'Colônia Z-10 Niterói', 'Local de Formação': 'Niterói', 'Situação': 'Concluído' },
    { 'Matrícula': 'PESC-2026-007', 'Nome Pescador': 'Francisco Assis Silva', 'CPF': '789.012.345-67', 'ATA1': 'Ausente', 'ATA2': 'Ausente', 'Nautilus': 'Não Cadastrado', 'Termo': 'Não Assinou', 'Entidade': 'Colônia Z-12 Angra', 'Local de Formação': 'Angra dos Reis', 'Situação': 'Pendente' }
  ],
  lastSynced: '2026-06-06T12:00:00.000Z'
};

export default MOCK_SHEET_DATA;
