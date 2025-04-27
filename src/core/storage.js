const PREFIX = 'metricflow_';
const DEVICE_ID_KEY = `${PREFIX}device_id`;
const SESSION_ID_KEY = `${PREFIX}session_id`;
const LAST_EVENT_TIME_KEY = `${PREFIX}last_event_time`;
const EVENTS_KEY = `${PREFIX}events`;

export default class MetricFlowStorage {
  constructor(config) {
    this.config = config;
    this.storageType = this._determineStorageType();
  }

  _determineStorageType() {
    if (this.config.get('disableCookies')) {
      return 'none';
    }

    const storage = this.config.get('storage');
    
    if (storage === 'localStorage' && this._isLocalStorageAvailable()) {
      return 'localStorage';
    }

    if (storage === 'cookie' || this._areCookiesEnabled()) {
      return 'cookie';
    }

    return 'none';
  }

  _isLocalStorageAvailable() {
    try {
      const testKey = `${PREFIX}test`;
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  _areCookiesEnabled() {
    try {
      const testCookie = `${PREFIX}test=1; SameSite=Lax`;
      document.cookie = testCookie;
      return document.cookie.indexOf(`${PREFIX}test=`) !== -1;
    } catch (e) {
      return false;
    }
  }

  // Device ID Management
  getDeviceId() {
    let deviceId = this._get(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = this._generateDeviceId();
      this.setDeviceId(deviceId);
    }
    return deviceId;
  }

  setDeviceId(deviceId) {
    this._set(DEVICE_ID_KEY, deviceId, this.config.get('cookieExpiration'));
  }

  _generateDeviceId() {
    return `${Date.now()}${Math.floor(Math.random() * 1000000)}`;
  }

  // Session Management
  getSessionId() {
    return this._get(SESSION_ID_KEY);
  }

  setSessionId(sessionId, timestamp) {
    this._set(SESSION_ID_KEY, sessionId);
    this.setLastEventTime(timestamp);
  }

  getLastEventTime() {
    const time = this._get(LAST_EVENT_TIME_KEY);
    return time ? parseInt(time, 10) : null;
  }

  setLastEventTime(timestamp) {
    this._set(LAST_EVENT_TIME_KEY, timestamp.toString());
  }

  // Event Storage
  saveEvent(event) {
    const events = this.getEvents();
    events.push(event);
    this._set(EVENTS_KEY, JSON.stringify(events));
  }

  saveEvents(events) {
    const existingEvents = this.getEvents();
    this._set(EVENTS_KEY, JSON.stringify([...existingEvents, ...events]));
  }

  getEvents() {
    const events = this._get(EVENTS_KEY);
    return events ? JSON.parse(events) : [];
  }

  clearEvents() {
    this._remove(EVENTS_KEY);
  }

  // Generic Storage Methods
  _get(key) {
    switch (this.storageType) {
      case 'localStorage':
        return localStorage.getItem(key);
      case 'cookie':
        return this._getCookie(key);
      default:
        return null;
    }
  }

  _set(key, value, expirationDays) {
    switch (this.storageType) {
      case 'localStorage':
        localStorage.setItem(key, value);
        break;
      case 'cookie':
        this._setCookie(key, value, expirationDays);
        break;
    }
  }

  _remove(key) {
    switch (this.storageType) {
      case 'localStorage':
        localStorage.removeItem(key);
        break;
      case 'cookie':
        this._setCookie(key, '', -1); // Expire immediately
        break;
    }
  }

  // Cookie-specific Methods
  _getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(`${name}=`)) {
        return decodeURIComponent(cookie.substring(name.length + 1));
      }
    }
    return null;
  }

  _setCookie(name, value, expirationDays) {
    let cookie = `${name}=${encodeURIComponent(value)}`;
    
    if (expirationDays) {
      const date = new Date();
      date.setTime(date.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
      cookie += `; expires=${date.toUTCString()}`;
    }
    
    cookie += `; path=/`;
    cookie += `; SameSite=${this.config.get('cookieSameSite')}`;
    
    if (this.config.get('cookieSecure')) {
      cookie += '; Secure';
    }
    
    if (this.config.get('domain')) {
      cookie += `; domain=${this.config.get('domain')}`;
    }
    
    document.cookie = cookie;
  }

  // Maintenance Methods
  clear() {
    this._remove(DEVICE_ID_KEY);
    this._remove(SESSION_ID_KEY);
    this._remove(LAST_EVENT_TIME_KEY);
    this._remove(EVENTS_KEY);
  }

}