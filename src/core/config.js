const DEFAULT_CONFIG = {
    apiKey: null,
    apiEndpoint: 'https://api.metric-flow.com/api',
    flushInterval: 10000, // 10 seconds
    flushMaxRetries: 5,
    flushQueueSize: 30,
    flushTimeout: 10000, // 10 seconds
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
      platform: true,
      region: true,
      version_name: true,
    },
    saveEvents: true,
    sessionTimeout: 1800000, // 30 minutes
    trackingSessionEvents: true,
    userId: null,
    deviceId: null,
    useBatch: false,
    batchSize: 100,
    transport: 'fetch', // 'fetch', 'beacon', or 'xhr'
    cookieExpiration: 365, // days
    cookieSameSite: 'Lax',
    cookieSecure: false,
    disableCookies: false,
    domain: '',
    storage: 'cookie', // 'cookie', 'localStorage', or 'none'
    unsetParamsReferrerOnNewSession: false,
  };
  
  class Config {
    constructor(options = {}) {
      this.options = { ...DEFAULT_CONFIG, ...options };
      this._validate();
      this._initStorage();
    }
  
    _validate() {
      if (!this.options.apiKey) {
        console.error('metric-flow SDK: apiKey is required');
      }
  
      if (typeof this.options.flushInterval !== 'number' || this.options.flushInterval < 0) {
        console.warn('metric-flow SDK: flushInterval must be a positive number. Using default.');
        this.options.flushInterval = DEFAULT_CONFIG.flushInterval;
      }
  
      // Add more validations as needed
    }
  
    _initStorage() {
      if (this.options.disableCookies) {
        this.options.storage = 'none';
      }
  
      switch (this.options.storage) {
        case 'localStorage':
          if (!this._isLocalStorageAvailable()) {
            console.warn('metric-flow SDK: localStorage is not available. Falling back to cookies.');
            this.options.storage = 'cookie';
          }
          break;
        case 'cookie':
          if (!this._areCookiesEnabled()) {
            console.warn('metric-flow SDK: Cookies are disabled. Events will not be persisted.');
            this.options.storage = 'none';
          }
          break;
        case 'none':
          // No storage
          break;
        default:
          console.warn(`metric-flow SDK: Invalid storage option "${this.options.storage}". Using default.`);
          this.options.storage = DEFAULT_CONFIG.storage;
      }
    }
  
    _isLocalStorageAvailable() {
      try {
        const testKey = '__metric-flow_test__';
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
        return true;
      } catch (e) {
        return false;
      }
    }
  
    _areCookiesEnabled() {
      try {
        document.cookie = '__metric-flow_test=1; SameSite=Lax';
        return document.cookie.indexOf('__metric-flow_test=') !== -1;
      } catch (e) {
        return false;
      }
    }
  
    get(key) {
      return this.options[key];
    }
  
    set(key, value) {
      this.options[key] = value;
      // Special handling for certain keys
      if (key === 'disableCookies') {
        this._initStorage();
      }
    }
  
    update(options = {}) {
      this.options = { ...this.options, ...options };
      this._validate();
      this._initStorage();
    }
  
    getTrackingConfig() {
      return {
        ...this.options.trackingOptions,
        platform: this._getPlatform(),
      };
    }
  
    _getPlatform() {
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
  
  export default Config;