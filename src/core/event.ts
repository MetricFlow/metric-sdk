import Config from './config';
import HttpTransport from '../transport/http';
import MetricFlowStorage, { MetricFlowEvent } from './storage';
import { generateUUID } from './utils';

export default class EventQueue {
  private config: Config;
  private transport: HttpTransport;
  private storage: MetricFlowStorage;
  private queue: MetricFlowEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private retries = 0;
  private isFlushing = false;

  constructor(config: Config, transport: HttpTransport) {
    this.config = config;
    this.transport = transport;
    this.storage = new MetricFlowStorage(config);
    this.loadSavedEvents();
    this.setupFlushTimer();
  }

  addEvent(eventType: string, eventProperties: Record<string, unknown> = {}): string {
    if (this.config.get('optOut')) {
      throw new Error('MetricFlow: Tracking is opted out');
    }

    const timestamp = new Date().toISOString();
    const event: MetricFlowEvent = {
      event_id: generateUUID(),
      event_type: eventType,
      event_properties: this.cleanProperties(eventProperties),
      user_properties: {},
      timestamp,
      platform: this.config.getTrackingConfig().platform,
      ...this.getDeviceInfo(),
      ...this.getSessionInfo(Date.now())
    };

    this.queue.push(event);
    this.scheduleFlush();

    if (this.config.get('saveEvents')) {
      this.storage.saveEvent(event);
    }

    return event.event_id;
  }

  async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) {
      return;
    }

    this.isFlushing = true;
    const eventsToFlush = [...this.queue];
    this.queue = [];

    try {
      if (this.config.get('useBatch')) {
        await this.transport.sendBatch(eventsToFlush, this.config.get('batchSize'));
      } else {
        await Promise.all(eventsToFlush.map(event => this.transport.send(event)));
      }
      this.retries = 0;
    } catch (error) {
      console.error('MetricFlow: Error flushing events', error);
      this.queue.unshift(...eventsToFlush);
      const flushMaxRetries = this.config.get('flushMaxRetries') ?? 0;
      if (this.retries < flushMaxRetries) {
        this.retries++;
        setTimeout(() => this.flush(), this.getRetryDelay());
      } else if (this.config.get('saveEvents')) {
        this.storage.saveEvent(eventsToFlush);
      }
    } finally {
      this.isFlushing = false;
      this.setupFlushTimer();
    }
  }

  private loadSavedEvents(): void {
    if (!this.config.get('saveEvents')) return;

    const savedEvents = this.storage.getEvents();
    if (savedEvents && savedEvents.length > 0) {
      this.queue.push(...savedEvents);
      this.storage.clearEvents();
    }
  }

  private setupFlushTimer(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.config.get('flushInterval'));
  }

  private scheduleFlush(): void {
    const flushQueueSize = this.config.get('flushQueueSize') ?? 0;
    if (this.queue.length >= flushQueueSize) {
      this.flush();
    } else if (!this.flushTimer) {
      this.setupFlushTimer();
    }
  }

  private getDeviceInfo(): { device_id?: string; ip?: string | null } {
    return {
      device_id: this.config.get('deviceId') || this.storage.getDeviceId() || undefined,
      ...(this.config.getTrackingConfig().ip_address && { ip: this.getIP() })
    };
  }

  private getSessionInfo(timestamp: number): { session_id?: string } {
    if (!this.config.get('trackingSessionEvents')) {
      return {};
    }

    const lastEventTime = this.storage.getLastEventTime();
    const sessionTimeout = this.config.get('sessionTimeout')?? 0;
    
    let sessionId = this.storage.getSessionId();
    if (!sessionId || (lastEventTime && timestamp - lastEventTime > sessionTimeout)) {
      sessionId = generateUUID();
      this.storage.setSessionId(sessionId, timestamp);
    }

    return { session_id: sessionId || undefined };
  }

  private getIP(): string | null {
    // Implement actual IP detection if needed
    return null;
  }

  private cleanProperties(properties: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    Object.keys(properties).forEach(key => {
      if (properties[key] !== null && properties[key] !== undefined) {
        if (typeof properties[key] === 'object' && !Array.isArray(properties[key])) {
          cleaned[key] = this.cleanProperties(properties[key] as Record<string, unknown>);
        } else {
          cleaned[key] = properties[key];
        }
      }
    });
    return cleaned;
  }

  private getRetryDelay(): number {
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, this.retries), maxDelay);
    return delay * (0.5 + Math.random());
  }

  // Public API extensions
  getEvents(): MetricFlowEvent[] {
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
    this.storage.clearEvents();
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }
}