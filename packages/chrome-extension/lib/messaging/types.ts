import type { ProductData, ProductPayload, SavedProduct } from '../product/types';

export type ExtensionMessage =
  | { type: 'EXTRACT_PRODUCT' }
  | { type: 'SAVE_PRODUCT'; payload: ProductPayload }
  | { type: 'CHECK_AUTH' }
  | { type: 'LOGIN'; payload: LoginPayload }
  | { type: 'LOGOUT' };

export type ExtensionResponse =
  | { type: 'EXTRACT_PRODUCT'; data: ProductData }
  | { type: 'SAVE_PRODUCT'; data: SavedProduct | null; error?: string }
  | { type: 'CHECK_AUTH'; authenticated: boolean }
  | { type: 'LOGIN'; success: boolean; error?: string }
  | { type: 'LOGOUT'; success: boolean };

export interface LoginPayload {
  email: string;
  password: string;
}
