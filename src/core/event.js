import { generateUUID } from './utils';
import MetricFlowStorage from './storage';

export default class EventQueue {
  constructor(config, transport) {
    this.config = config;
    this.transport = transport;
    this.storage = new MetricFlowStorage(config);
    this.queue = [];
    this.flushTimer = null;
    this.retries = 0;
    this.isFlushing = false;

    this._loadSavedEvents();
    this._setupFlushTimer();
  }

  addEvent(eventType, eventProperties = {}, userProperties = {}) {
    if (this.config.get('optOut')) {
      return false;
    }

    const timestamp = new Date().getTime();
    const event = {
      event_id: generateUUID(),
      event_type: eventType,
      event_properties: this._cleanProperties(eventProperties),
      user_properties: this._cleanProperties(userProperties),
      timestamp,
      platform: this.config.getTrackingConfig().platform,
      ...this._getDeviceInfo(),
      ...this._getSessionInfo(timestamp)
    };

    this.queue.push(event);
    this._scheduleFlush();

    if (this.config.get('saveEvents')) {
      this.storage.saveEvent(event);
    }

    return event.event_id;
  }

  _cleanProperties(properties) {
    // Remove null/undefined values and enforce property limits
    const cleaned = {};
    Object.keys(properties).forEach(key => {
      if (properties[key] !== null && properties[key] !== undefined) {
        if (typeof properties[key] === 'object') {
          cleaned[key] = this._cleanProperties(properties[key]);
        } else {
          cleaned[key] = properties[key];
        }
      }
    });
    return cleaned;
  }

  _getDeviceInfo() {
    return {
      device_id: this.config.get('deviceId') || this.storage.getDeviceId(),
      ...(this.config.getTrackingConfig().ip_address && { ip: this._getIP() })
    };
  }

  _getIP() {
    // Would be implemented with actual IP detection
    return null;
  }

  _getSessionInfo(timestamp) {
    if (!this.config.get('trackingSessionEvents')) {
      return {};
    }

    const lastEventTime = this.storage.getLastEventTime();
    const sessionTimeout = this.config.get('sessionTimeout');
    
    let sessionId = this.storage.getSessionId();
    if (!sessionId || (lastEventTime && timestamp - lastEventTime > sessionTimeout)) {
      sessionId = generateUUID();
      this.storage.setSessionId(sessionId, timestamp);
    }

    this.storage.setLastEventTime(timestamp);
    return { session_id: sessionId };
  }

  _loadSavedEvents() {
    if (this.config.get('saveEvents')) {
      const savedEvents = this.storage.getEvents();
      if (savedEvents && savedEvents.length > 0) {
        this.queue.push(...savedEvents);
        this.storage.clearEvents();
      }
    }
  }

  _scheduleFlush() {
    const queueSize = this.queue.length;
    const flushQueueSize = this.config.get('flushQueueSize');

    if (queueSize >= flushQueueSize) {
      this.flush();
    } else if (!this.flushTimer) {
      this._setupFlushTimer();
    }
  }

  _setupFlushTimer() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.config.get('flushInterval'));
  }

  async flush() {
    if (this.isFlushing || this.queue.length === 0) {
      return;
    }

    this.isFlushing = true;
    const eventsToFlush = [...this.queue];
    this.queue = [];

    try {
      await this._sendEvents(eventsToFlush);
      this.retries = 0;
    } catch (error) {
      console.error('MetricFlow: Error flushing events', error);
      this.queue.unshift(...eventsToFlush); // Return failed events to queue

      if (this.retries < this.config.get('flushMaxRetries')) {
        this.retries++;
        setTimeout(() => this.flush(), this._getRetryDelay());
      } else {
        if (this.config.get('saveEvents')) {
          this.storage.saveEvents(eventsToFlush);
        }
      }
    } finally {
      this.isFlushing = false;
      this._setupFlushTimer();
    }
  }

  async _sendEvents(events) {
    const payload = {
      api_key: this.config.get('apiKey'),
      events: events,
      options: {
        min_id_length: 1
      }
    };

    if (this.config.get('useBatch')) {
      return this._sendBatch(payload);
    } else {
      return Promise.all(events.map(event => 
        this.transport.send({ ...payload, events: [event] })
      ));
    }
  }

  async _sendBatch(payload) {
    const batchSize = this.config.get('batchSize');
    if (payload.events.length <= batchSize) {
      return this.transport.send(payload);
    }

    // Split into chunks
    const batches = [];
    for (let i = 0; i < payload.events.length; i += batchSize) {
      batches.push(
        this.transport.send({
          ...payload,
          events: payload.events.slice(i, i + batchSize)
        })
      );
    }

    return Promise.all(batches);
  }

  _getRetryDelay() {
    // Exponential backoff with jitter
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, this.retries), maxDelay);
    return delay * (0.5 + Math.random());
  }
}