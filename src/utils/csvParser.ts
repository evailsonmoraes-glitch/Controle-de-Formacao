import { DataRecord, ColumnSchema, SpreadsheetData } from '../types';

/**
 * Parses raw CSV string into records.
 * Supports comma (,) and semicolon (;) separators, and correctly handles quoted strings.
 */
export function parseCSV(csvText: string): DataRecord[] {
  if (!csvText || !csvText.trim()) return [];

  // Detect separator: comma or semicolon
  const firstLine = csvText.split('\n')[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const separator = semicolonCount > commaCount ? ';' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          // Closing quote
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === separator) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip LF
        }
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.length > 0 && currentRow.some(field => field !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  // Handle last field/row if any
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field !== '')) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];

  // Extract headers
  const headers = rows[0].map(h => h.replace(/^"|"$/g, '').trim()).filter(Boolean);
  const dataRows = rows.slice(1);

  return dataRows.map(row => {
    const record: DataRecord = {};
    headers.forEach((header, index) => {
      let val = row[index] !== undefined ? row[index] : '';
      // Remove surrounding quotes if any
      val = val.replace(/^"|"$/g, '').trim();
      record[header] = val;
    });
    return record;
  });
}

/**
 * Attempts to parse a string string into a clean number.
 * Handles Brazilian number formats (e.g., 1.500,00 or R$ 1.500,00) and US formats (e.g., $1,500.00).
 */
export function cleanNumber(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  if (typeof val !== 'string') return null;

  let cleaned = val.trim();
  if (!cleaned) return null;

  // Remove currency symbols, currency codes and whitespace
  cleaned = cleaned.replace(/R\$\s*|\$\s*|€\s*|¥\s*|%\s*/gi, '');

  // Detect which format is used
  // e.g., 1.234,56 vs 1,234.56
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    // Determine which comes last to identify decimal separator
    if (cleaned.indexOf(',') > cleaned.indexOf('.')) {
      // 1.234,56 (BR format)
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,234.56 (US format)
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    // If there is only a comma: check if it's likely a decimal separator
    // e.g., "12,5" (decimal) vs "12,500" (thousand)? 
    // Usually in spreadsheets, single comma separated digits are decimals if they are short (e.g. 1 or 2 digits after)
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Analyzes parsed rows to extract schema metadata.
 */
export function analyzeSchema(rows: DataRecord[]): ColumnSchema[] {
  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  
  return headers.map(colName => {
    let numericCount = 0;
    let nonEmptyCount = 0;
    const valuesSet = new Set<string>();

    rows.forEach(row => {
      const origVal = row[colName];
      if (origVal !== undefined && origVal !== null && String(origVal).trim() !== '') {
        nonEmptyCount++;
        const parsedNum = cleanNumber(origVal);
        if (parsedNum !== null) {
          numericCount++;
        }
        valuesSet.add(String(origVal).trim());
      }
    });

    const distinctValues = Array.from(valuesSet);
    
    // Auto-detect type
    let type: 'numeric' | 'categorical' | 'date' | 'text' = 'text';

    const numericRatio = nonEmptyCount > 0 ? numericCount / nonEmptyCount : 0;
    
    // If columns contains date / data / data_cadastro and has date-like text
    const lowerCol = colName.toLowerCase();
    const isDateHeader = lowerCol.includes('data') || lowerCol.includes('date') || lowerCol.includes('vencimento') || lowerCol.includes('criado');

    if (numericRatio > 0.7) {
      type = 'numeric';
    } else if (isDateHeader && distinctValues.some(v => isDateString(v))) {
      type = 'date';
    } else if (distinctValues.length <= 15 && distinctValues.length > 0 && nonEmptyCount > 3) {
      type = 'categorical';
    }

    return {
      name: colName,
      type,
      distinctValues: distinctValues.slice(0, 100) // limit for safety
    };
  });
}

function isDateString(val: string): boolean {
  // Checks simple date patterns like dd/mm/yyyy or yyyy-mm-dd or dd-mm-yyyy
  const regex = /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/;
  return regex.test(val);
}

/**
 * Transforms CSV content into full SpreadsheetData structure.
 * Normalizes columns and rows to the structured schema requested by the user.
 */
export function processRawSpreadsheetData(csvText: string, url: string = ''): SpreadsheetData {
  const rawRows = parseCSV(csvText);
  
  // Normalized Schema Definition
  const columns: ColumnSchema[] = [
    { name: 'Matrícula', type: 'text', distinctValues: [] },
    { name: 'Nome Pescador', type: 'text', distinctValues: [] },
    { name: 'CPF', type: 'text', distinctValues: [] },
    { name: 'ATA1', type: 'categorical', distinctValues: ['Presente', 'Ausente'] },
    { name: 'ATA2', type: 'categorical', distinctValues: ['Presente', 'Ausente'] },
    { name: 'Nautilus', type: 'categorical', distinctValues: ['Cadastrado', 'Não Cadastrado'] },
    { name: 'Termo', type: 'categorical', distinctValues: ['Assinou', 'Não Assinou'] },
    { name: 'Entidade', type: 'categorical', distinctValues: [] },
    { name: 'Local de Formação', type: 'categorical', distinctValues: [] },
    { name: 'Situação', type: 'categorical', distinctValues: ['Pendente', 'Concluído'] }
  ];

  const entidadesSet = new Set<string>(['Colônia Z-10 Niterói', 'Colônia Z-12 Angra', 'Colônia Z-13 Copacabana']);
  const locaisSet = new Set<string>(['Niterói', 'Angra dos Reis', 'Rio de Janeiro', 'Maricá']);

  const rows: DataRecord[] = rawRows.map((raw, idx) => {
    // Determine Matricula
    const rawMatri = raw['Matrícula'] || raw['Matricula'] || raw['Código'] || raw['Codigo'] || raw['ID'] || raw['Id'];
    const matricula = rawMatri ? String(rawMatri).trim() : `PESC-2026-${String(idx + 1).padStart(3, '0')}`;

    // Determine Nome Pescador
    const rawNome = raw['Nome Pescador'] || raw['Pescador / Aluno'] || raw['Nome'] || raw['Aluno'] || raw['Cliente'];
    const nomePescador = rawNome ? String(rawNome).trim() : 'Pescador Sem Nome';

    // Determine CPF
    const rawCPF = raw['CPF'] || raw['Cpf'] || raw['Documento'] || '';
    const cpf = rawCPF ? String(rawCPF).trim() : `---`;

    // Determine ATA1 with options 'Presente', 'Ausente'
    let ata1 = String(raw['ATA1'] || '').trim();
    if (ata1 !== 'Presente' && ata1 !== 'Ausente') {
      const rawStatus = String(raw['Status'] || raw['Situação'] || '').toLowerCase();
      ata1 = (rawStatus.includes('aprov') || rawStatus.includes('concl') || rawStatus.includes('pres')) ? 'Presente' : 'Ausente';
    }

    // Determine ATA2
    let ata2 = String(raw['ATA2'] || '').trim();
    if (ata2 !== 'Presente' && ata2 !== 'Ausente') {
      const rawStatus = String(raw['Status'] || raw['Situação'] || '').toLowerCase();
      ata2 = (rawStatus.includes('aprov') || rawStatus.includes('concl')) ? 'Presente' : 'Ausente';
    }

    // Determine Nautilus
    let nautilus = String(raw['Nautilus'] || '').trim();
    nautilus = (nautilus === 'Cadastrado' || nautilus === 'Não Cadastrado') ? nautilus : 'Não Cadastrado';

    // Determine Termo
    let termo = String(raw['Termo'] || '').trim();
    termo = (termo === 'Assinou' || termo === 'Não Assinou') ? termo : 'Não Assinou';

    // Determine Entidade
    const rawEnt = raw['Entidade'] || raw['Comunidade / Colônia'] || raw['Colônia'] || raw['Colonia'] || raw['Curso'] || 'Colônia Z-10 Niterói';
    const entidade = String(rawEnt).trim();
    if (entidade) entidadesSet.add(entidade);

    // Determine Local de Formação
    const rawLoc = raw['Local de Formação'] || raw['Local de Formacao'] || raw['Comunidade / Colônia'] || raw['Local'] || 'Niterói';
    const localFormacao = String(rawLoc).trim();
    if (localFormacao) locaisSet.add(localFormacao);

    // Determine Situação
    let situacao = String(raw['Situação'] || raw['Situacao'] || raw['Status'] || 'Pendente').trim();
    if (situacao.toLowerCase().includes('concl') || situacao.toLowerCase().includes('aprov') || situacao.toLowerCase().includes('suc')) {
      situacao = 'Concluído';
    } else {
      situacao = 'Pendente';
    }

    return {
      'Matrícula': matricula,
      'Nome Pescador': nomePescador,
      'CPF': cpf,
      'ATA1': ata1,
      'ATA2': ata2,
      'Nautilus': nautilus,
      'Termo': termo,
      'Entidade': entidade,
      'Local de Formação': localFormacao,
      'Situação': situacao
    };
  });

  // Assign distinctValues to dynamic collections
  const matCol = columns.find(c => c.name === 'Matrícula');
  if (matCol) matCol.distinctValues = [];
  
  const nomeCol = columns.find(c => c.name === 'Nome Pescador');
  if (nomeCol) nomeCol.distinctValues = [];

  const cpfCol = columns.find(c => c.name === 'CPF');
  if (cpfCol) cpfCol.distinctValues = [];

  const entCol = columns.find(c => c.name === 'Entidade');
  if (entCol) entCol.distinctValues = Array.from(entidadesSet);

  const locCol = columns.find(c => c.name === 'Local de Formação');
  if (locCol) locCol.distinctValues = Array.from(locaisSet);

  // Extract spreadsheet title from URL if possible
  let title = 'Planilha Conectada';
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    title = `Planilha (ID: ${match[1].slice(0, 6)}...)`;
  }

  return {
    title,
    url,
    columns,
    rows,
    lastSynced: new Date().toISOString()
  };
}

/**
 * Extracts Google Spreadsheet ID from URL and converts it to a clean CSV export URL.
 */
export function getSheetsCsvUrl(url: string): string | null {
  if (!url) return null;
  
  // Look for spreadsheet ID pattern
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return null;
  
  const sheetId = match[1];
  
  // Check if a specific sheet (grid ID) is targeted in the URL (e.g. gid=123)
  const gidMatch = url.match(/[?#&]gid=([0-9]+)/);
  let gid = gidMatch ? gidMatch[1] : '0';

  // Force actual fisherman training tab if the target sheet ID matches and no custom gid or gid=0 is used
  if (sheetId === '1YCniwIBOIsE6-kujz32YsTGj4ByNJUShcQ96i51sDZI' && (!gidMatch || gid === '0')) {
    gid = '721147271';
  }

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}
