import Config from './config';
import EventQueue from './event';
import HttpTransport from '../transport/http';

interface MetricFlowConfig {
  apiKey: string;
  debug?: boolean;
  flushInterval?: number;
  // Add other config options
}

export default class Client {
  private config: Config | null = null;
  private transport: HttpTransport | null = null;
  private eventQueue: EventQueue | null = null;
  private isInitialized = false;

  init(apiKey: string, userConfig: Omit<MetricFlowConfig, 'apiKey'> = {}): void {
    if (this.isInitialized) {
      console.warn('MetricFlow: Already initialized');
      return;
    }

    const fullConfig: MetricFlowConfig = {
      apiKey,
      ...userConfig
    };

    this.config = new Config(fullConfig);
    this.transport = new HttpTransport(this.config);
    this.eventQueue = new EventQueue(this.config, this.transport);
    this.isInitialized = true;

    if (this.config.get('debug')) {
      console.log('MetricFlow: SDK initialized', this.config);
    }
  }

  track(eventType: string, eventProperties: Record<string, unknown> = {}): string | null {
    if (!this.isInitialized || !this.eventQueue) {
      console.error('MetricFlow: Not initialized. Call init() first');
      return null;
    }

    return this.eventQueue.addEvent(eventType, {
      event_properties: eventProperties,
      timestamp: new Date().toISOString()
    });
  }

  identify(userId: string, traits: Record<string, unknown> = {}): void {
    if (!this.isInitialized) {
      console.error('MetricFlow: Not initialized. Call init() first');
      return;
    }
    // Implementation
  }
}