import Config from '../core/config';

export default class HttpTransport {
  private config: Config;
  private endpoint: string;

  constructor(config: Config) {
    this.config = config;
    this.endpoint = config.get('apiEndpoint');
  }

  async send(payload: unknown): Promise<Response> {
    const init: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    };

    if (this.config.get('debug')) {
      console.log('MetricFlow: Sending payload', payload);
    }

    try {
      const response = await fetch(this.endpoint, init);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (this.config.get('debug')) {
        console.error('MetricFlow: Transport error', error);
      }
      throw error;
    }
  }

  async sendBatch(payload: unknown, batchSize: number = 5): Promise<Response[]> {
    if (!Array.isArray(payload)) {
      return [await this.send(payload)];
    }

    const batches = [];
    for (let i = 0; i < payload.length; i += batchSize) {
      const batch = payload.slice(i, i + batchSize);
      batches.push(this.send(batch));
    }

    return Promise.all(batches);
  }
}