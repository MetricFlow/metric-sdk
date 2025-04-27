/**
 * MetricFlow SDK Utilities
 * Collection of helper functions used across the SDK
 */

// UUID v4 generator
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  
  // Simple hash function for generating short IDs
  export function hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  // Deep merge objects
  export function deepMerge(target, source) {
    const output = { ...target };
    if (typeof target !== 'object' || typeof source !== 'object') {
      return source;
    }
  
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null) {
          output[key] = deepMerge(target[key] || {}, source[key]);
        } else {
          output[key] = source[key];
        }
      }
    }
    return output;
  }
  
  // Safe JSON stringify
  export function safeStringify(obj) {
    try {
      return JSON.stringify(obj);
    } catch (e) {
      console.warn('MetricFlow: Failed to stringify object', e);
      return '{}';
    }
  }
  
  // Safe JSON parse
  export function safeParse(json) {
    try {
      return JSON.parse(json);
    } catch (e) {
      console.warn('MetricFlow: Failed to parse JSON', e);
      return null;
    }
  }
  
  // Get current timestamp in ISO format
  export function getISOTimestamp() {
    return new Date().toISOString();
  }
  
  // Get current high-resolution timestamp (if available)
  export function getHighResTimestamp() {
    try {
      return performance.now();
    } catch (e) {
      return Date.now();
    }
  }
  
  // Truncate string with ellipsis
  export function truncate(str, maxLength = 100) {
    if (typeof str !== 'string') return str;
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  }
  
  // Validate event name
  const EVENT_NAME_REGEX = /^[a-zA-Z0-9_\-\. ]+$/;
  export function isValidEventName(name) {
    return typeof name === 'string' && 
           name.length > 0 && 
           name.length <= 100 && 
           EVENT_NAME_REGEX.test(name);
  }
  
  // Validate property key
  const PROPERTY_KEY_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  export function isValidPropertyKey(key) {
    return typeof key === 'string' && 
           key.length > 0 && 
           key.length <= 100 && 
           PROPERTY_KEY_REGEX.test(key);
  }
  
  // Remove circular references from objects
  export function removeCircularReferences(obj, seen = new WeakSet()) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
  
    if (seen.has(obj)) {
      return '[Circular]';
    }
    seen.add(obj);
  
    const cleanObj = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cleanObj[key] = removeCircularReferences(obj[key], seen);
      }
    }
    return cleanObj;
  }
  
  // Throttle function execution
  export function throttle(fn, delay) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return fn.apply(this, args);
      }
    };
  }
  
  // Debounce function execution
  export function debounce(fn, delay) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  }
  
  // Get browser language
  export function getBrowserLanguage() {
    if (typeof navigator === 'undefined') return 'en-US';
    return (
      navigator.language ||
      navigator.userLanguage ||
      navigator.browserLanguage ||
      navigator.systemLanguage ||
      'en-US'
    );
  }
  
  // Get page URL without query parameters or fragments
  export function getCleanUrl() {
    if (typeof window === 'undefined') return '';
    return window.location.href.split(/[?#]/)[0];
  }
  
  // Get document referrer without query parameters
  export function getCleanReferrer() {
    if (typeof document === 'undefined') return '';
    return document.referrer.split(/[?#]/)[0];
  }
  
  // Detect if running in iframe
  export function isInIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }
  
  // Convert object to URL query string
  export function toQueryString(params) {
    return Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
  }
  
  // Check if value is empty (null, undefined, empty string/array/object)
  export function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }
  
  // Generate a short random ID (8 chars)
  export function shortId() {
    return Math.random().toString(36).substring(2, 10);
  }
  
  // Get screen dimensions
  export function getScreenDimensions() {
    if (typeof window === 'undefined') return { width: 0, height: 0 };
    return {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight
    };
  }
  
  // Get viewport dimensions
  export function getViewportDimensions() {
    if (typeof window === 'undefined') return { width: 0, height: 0 };
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight
    };
  }
  
  // Format bytes to human-readable format
  export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  // Capitalize first letter of string
  export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  // Check if running in a browser environment
  export function isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }
  
  // Check if running in Node.js environment
  export function isNode() {
    return typeof process !== 'undefined' && 
           process.versions != null && 
           process.versions.node != null;
  }
  
  // Check if value is a plain object
  export function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
  }
  
  // Sleep/pause execution
  export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }