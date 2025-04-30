import Config from './config';

export interface MetricFlowEvent {
  event_id: string;
  event_type: string;
  event_properties: Record<string, unknown>;
  user_properties: Record<string, unknown>;
  timestamp: string;
  [key: string]: unknown;
}

export interface StorageAdapter {
  getEvents(): MetricFlowEvent[];
  saveEvent(event: MetricFlowEvent | MetricFlowEvent[]): void;
  clearEvents(): void;
  getDeviceId(): string | null;
  setDeviceId(id: string): void;
  getSessionId(): string | null;
  setSessionId(id: string, timestamp?: number): void;
  getLastEventTime(): number | null;
  setLastEventTime(timestamp: number): void;
}

export default class MetricFlowStorage implements StorageAdapter {
  private prefix = 'metricflow_';
  private config: Config;
  private memoryStorage: {
    events: MetricFlowEvent[];
    deviceId: string | null;
    sessionId: string | null;
    lastEventTime: number | null;
  } = {
    events: [],
    deviceId: null,
    sessionId: null,
    lastEventTime: null
  };

  constructor(config: Config) {
    this.config = config;
  }

  private get storageAvailable(): boolean {
    return typeof window !== 'undefined' && 
           window.localStorage && 
           !this.config.get('disableCookies') && 
           this.config.get('storage') !== 'none';
  }

  getEvents(): MetricFlowEvent[] {
    if (this.storageAvailable) {
      const eventsJson = localStorage.getItem(`${this.prefix}events`);
      return eventsJson ? JSON.parse(eventsJson) : [];
    }
    return [...this.memoryStorage.events];
  }

  saveEvent(event: MetricFlowEvent | MetricFlowEvent[]): void {
    const events = this.getEvents();
    const newEvents = Array.isArray(event) ? [...events, ...event] : [...events, event];
    
    if (this.storageAvailable) {
      localStorage.setItem(`${this.prefix}events`, JSON.stringify(newEvents));
    } else {
      this.memoryStorage.events = newEvents;
    }
  }

  clearEvents(): void {
    if (this.storageAvailable) {
      localStorage.removeItem(`${this.prefix}events`);
    } else {
      this.memoryStorage.events = [];
    }
  }

  getDeviceId(): string | null {
    if (this.storageAvailable) {
      return localStorage.getItem(`${this.prefix}device_id`);
    }
    return this.memoryStorage.deviceId;
  }

  setDeviceId(id: string): void {
    if (this.storageAvailable) {
      localStorage.setItem(`${this.prefix}device_id`, id);
    } else {
      this.memoryStorage.deviceId = id;
    }
  }

  getSessionId(): string | null {
    if (this.storageAvailable) {
      return localStorage.getItem(`${this.prefix}session_id`);
    }
    return this.memoryStorage.sessionId;
  }

  setSessionId(id: string, timestamp?: number): void {
    if (this.storageAvailable) {
      localStorage.setItem(`${this.prefix}session_id`, id);
      if (timestamp) {
        this.setLastEventTime(timestamp);
      }
    } else {
      this.memoryStorage.sessionId = id;
      if (timestamp) {
        this.memoryStorage.lastEventTime = timestamp;
      }
    }
  }

  getLastEventTime(): number | null {
    if (this.storageAvailable) {
      const time = localStorage.getItem(`${this.prefix}last_event_time`);
      return time ? parseInt(time, 10) : null;
    }
    return this.memoryStorage.lastEventTime;
  }

  setLastEventTime(timestamp: number): void {
    if (this.storageAvailable) {
      localStorage.setItem(`${this.prefix}last_event_time`, timestamp.toString());
    } else {
      this.memoryStorage.lastEventTime = timestamp;
    }
  }
}