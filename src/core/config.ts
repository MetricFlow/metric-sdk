export interface TrackingOptions {
  city?: boolean;
  country?: boolean;
  carrier?: boolean;
  device_manufacturer?: boolean;
  device_model?: boolean;
  dma?: boolean;
  ip_address?: boolean;
  language?: boolean;
  os_name?: boolean;
  os_version?: boolean;
  region?: boolean;
  version_name?: boolean;
  platform?: string;
}

export interface MetricFlowConfig {
  apiKey: string;
  apiEndpoint: string;
  flushInterval?: number;
  flushMaxRetries?: number;
  flushQueueSize?: number;
  flushTimeout?: number;
  logLevel?: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  optOut?: boolean;
  trackingOptions?: TrackingOptions;
  saveEvents?: boolean;
  sessionTimeout?: number;
  trackingSessionEvents?: boolean;
  userId?: string | null;
  deviceId?: string | null;
  useBatch?: boolean;
  batchSize?: number;
  transport?: 'fetch' | 'beacon' | 'xhr';
  cookieExpiration?: number;
  cookieSameSite?: 'Lax' | 'Strict' | 'None';
  cookieSecure?: boolean;
  disableCookies?: boolean;
  domain?: string;
  storage?: 'cookie' | 'localStorage' | 'none';
  unsetParamsReferrerOnNewSession?: boolean;
  debug?: boolean;
}

const DEFAULT_CONFIG: MetricFlowConfig = {
  apiKey: '',
  apiEndpoint: 'https://api.metricflow.com/2/httpapi',
  flushInterval: 10000,
  flushMaxRetries: 5,
  flushQueueSize: 30,
  flushTimeout: 10000,
  logLevel: 'WARN',
  optOut: false,
  trackingOptions: {
    city: true,
    country: true,
    carrier: true,
    device_manufacturer: true,
    device_model: true,
    dma: true,
    ip_address: true,
    language: true,
    os_name: true,
    os_version: true,
    platform: '',
    region: true,
    version_name: true,
  },
  saveEvents: true,
  sessionTimeout: 1800000,
  trackingSessionEvents: true,
  userId: null,
  deviceId: null,
  useBatch: false,
  batchSize: 100,
  transport: 'fetch',
  cookieExpiration: 365,
  cookieSameSite: 'Lax',
  cookieSecure: false,
  disableCookies: false,
  domain: '',
  storage: 'cookie',
  unsetParamsReferrerOnNewSession: false,
  debug: false
};

export default class Config {
  private options: MetricFlowConfig;

  constructor(options: Partial<MetricFlowConfig> = {}) {
    this.options = { ...DEFAULT_CONFIG, ...options };
    this.validate();
    this.initStorage();
  }

  get<T extends keyof MetricFlowConfig>(key: T): MetricFlowConfig[T] {
    return this.options[key];
  }

  set<T extends keyof MetricFlowConfig>(key: T, value: MetricFlowConfig[T]): void {
    this.options[key] = value;
    if (key === 'disableCookies') {
      this.initStorage();
    }
  }

  update(options: Partial<MetricFlowConfig>): void {
    this.options = { ...this.options, ...options };
    this.validate();
    this.initStorage();
  }

  getTrackingConfig(): TrackingOptions {
    return {
      ...this.options.trackingOptions,
      platform: this.getPlatform()
    };
  }

  private validate(): void {
    if (!this.options.apiKey) {
      console.error('MetricFlow: apiKey is required');
    }

    if (typeof this.options.flushInterval !== 'number' || this.options.flushInterval < 0) {
      console.warn('MetricFlow: flushInterval must be a positive number. Using default.');
      this.options.flushInterval = DEFAULT_CONFIG.flushInterval;
    }
  }

  private initStorage(): void {
    if (this.options.disableCookies) {
      this.options.storage = 'none';
    }

    switch (this.options.storage) {
      case 'localStorage':
        if (!this.isLocalStorageAvailable()) {
          console.warn('MetricFlow: localStorage is not available. Falling back to cookies.');
          this.options.storage = 'cookie';
        }
        break;
      case 'cookie':
        if (!this.areCookiesEnabled()) {
          console.warn('MetricFlow: Cookies are disabled. Events will not be persisted.');
          this.options.storage = 'none';
        }
        break;
      case 'none':
        break;
      default:
        console.warn(`MetricFlow: Invalid storage option "${this.options.storage}". Using default.`);
        this.options.storage = DEFAULT_CONFIG.storage;
    }
  }

  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__metricflow_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  private areCookiesEnabled(): boolean {
    try {
      document.cookie = '__metricflow_test=1; SameSite=Lax';
      return document.cookie.indexOf('__metricflow_test=') !== -1;
    } catch (e) {
      return false;
    }
  }

  private getPlatform(): string {
    if (typeof window === 'undefined') {
      return 'Node';
    }
    
    const userAgent = window.navigator.userAgent;
    if (/android/i.test(userAgent)) {
      return 'Android';
    } else if (/iPad|iPhone|iPod/.test(userAgent)) {
      return 'iOS';
    } else if (/Win/.test(userAgent)) {
      return 'Windows';
    } else if (/Mac/.test(userAgent)) {
      return 'Mac';
    } else if (/Linux/.test(userAgent)) {
      return 'Linux';
    }
    return 'Web';
  }
}