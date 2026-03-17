export type ExtractionSource = 'json-ld' | 'open-graph' | 'dom-fallback';

export interface ProductData {
  title: string | null;
  url: string;
  source: ExtractionSource;
}

export interface ProductPayload {
  source_url: string;
  source_title: string;
}

export interface SavedProduct {
  id: string;
  source_title: string;
  source_url: string;
}
