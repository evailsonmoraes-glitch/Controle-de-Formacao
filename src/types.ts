export interface DataRecord {
  [key: string]: any;
}

export interface MetricSummary {
  name: string;
  total: number;
  average: number;
  min: number;
  max: number;
}

export interface ColumnSchema {
  name: string;
  type: 'numeric' | 'categorical' | 'date' | 'text';
  distinctValues: string[];
}

export interface SpreadsheetData {
  title: string;
  url: string;
  columns: ColumnSchema[];
  rows: DataRecord[];
  lastSynced: string | null;
}
