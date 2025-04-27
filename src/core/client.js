import Config from './config';
import EventQueue from './event';
import HttpTransport from '../transport/http';

export default class Client {
  constructor() {
    this.config = null;
    this.transport = null;
    this.eventQueue = null;
    this.isInitialized = false;
  }

  init(apiKey, userConfig = {}) {
    if (this.isInitialized) {
      console.warn('MetricFlow: Already initialized');
      return;
    }

    this.config = new Config({ apiKey, ...userConfig });
    this.transport = new HttpTransport(this.config);
    this.eventQueue = new EventQueue(this.config, this.transport);
    this.isInitialized = true;

    if (this.config.get('debug')) {
      console.log('MetricFlow: Initialized with config', this.config);
    }
  }

  track(eventType, eventProperties = {}) {
    if (!this.isInitialized) {
      console.error('MetricFlow: Not initialized. Call init() first');
      return null;
    }
    return this.eventQueue.addEvent({
      event_type: eventType,
      event_properties: eventProperties,
      timestamp: new Date().toISOString(),
      // ... other default event fields
    });
  }

  identify(userId, userProperties = {}) {
    if (!this.isInitialized) {
      console.error('MetricFlow: Not initialized. Call init() first');
      return;
    }
    // Your identify implementation
  }
}