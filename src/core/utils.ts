/**
 * MetricFlow SDK Utilities - TypeScript Version
 * Collection of strongly-typed helper functions
 */

// UUID v4 generator with TypeScript return type
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: string): string => {
    const r: number = (Math.random() * 16) | 0;
    const v: number = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// String hashing function with type annotations
export function hashString(str: string): string {
  let hash: number = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char: number = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Safe JSON parse with generic return type
export function safeParse<T = unknown>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    const error = e as Error;
    console.warn('MetricFlow: Failed to parse JSON', error.message);
    return null;
  }
}

// Timestamp utilities
export function getISOTimestamp(): string {
  return new Date().toISOString();
}

export function getHighResTimestamp(): number {
  try {
    return performance.now();
  } catch (e) {
    return Date.now();
  }
}

// String truncation with length validation
export function truncate(str: string, maxLength: number = 100): string {
  if (typeof str !== 'string') return str;
  return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
}

// Validation utilities
const EVENT_NAME_REGEX = /^[a-zA-Z0-9_\-\. ]+$/;
export function isValidEventName(name: string): boolean {
  return typeof name === 'string' && 
         name.length > 0 && 
         name.length <= 100 && 
         EVENT_NAME_REGEX.test(name);
}

const PROPERTY_KEY_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
export function isValidPropertyKey(key: string): boolean {
  return typeof key === 'string' && 
         key.length > 0 && 
         key.length <= 100 && 
         PROPERTY_KEY_REGEX.test(key);
}

// Circular reference detection and handling
export function removeCircularReferences<T>(obj: T, seen = new WeakSet()): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (seen.has(obj)) {
    return '[Circular]' as unknown as T;
  }
  seen.add(obj);

  const cleanObj: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cleanObj[key] = removeCircularReferences(obj[key], seen);
    }
  }
  return cleanObj;
}

// Throttle function with TypeScript parameters
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => ReturnType<T> | void {
  let lastCall = 0;
  return (...args: Parameters<T>): ReturnType<T> | void => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn(...args);
    }
  };
}

// Debounce function with TypeScript parameters
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// Browser environment utilities
export function getBrowserLanguage(): string {
  if (typeof navigator === 'undefined') return 'en-US';
  return (
    navigator.language ||
    'en-US'
  );
}

export function getCleanUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.href.split(/[?#]/)[0];
}

export function getCleanReferrer(): string {
  if (typeof document === 'undefined') return '';
  return document.referrer.split(/[?#]/)[0];
}

export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

// URL parameter serialization
export function toQueryString(params: Record<string, string | number | boolean>): string {
  return Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key].toString())}`)
    .join('&');
}

// Empty check with type narrowing
export function isEmpty(value: unknown): value is null | undefined | '' | [] | {} {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// Short ID generator
export function shortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Screen dimension utilities
export interface ScreenDimensions {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
}

export function getScreenDimensions(): ScreenDimensions {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0, availWidth: 0, availHeight: 0 };
  }
  return {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight
  };
}

// Viewport dimension utilities
export interface ViewportDimensions {
  width: number;
  height: number;
}

export function getViewportDimensions(): ViewportDimensions {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight
  };
}

// Byte formatting utility
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// String capitalization
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Environment detection
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function isNode(): boolean {
  return typeof process !== 'undefined' && 
         process.versions != null && 
         process.versions.node != null;
}

// Type guard for plain objects
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

// Async sleep/pause function
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Type guard for Error objects
export function isError(error: unknown): error is Error {
  return error instanceof Error || 
         (typeof error === 'object' && 
          error !== null && 
          'message' in error && 
          'stack' in error);
}