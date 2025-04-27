export default class HttpTransport {
    constructor(config) {
      console.log(config)
      this.config = config.options;
      this.endpoint = this.config.apiEndpoint;
    }
  
    send(payload) {
      console.log(this.endpoint)
      return fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // ... other headers
        },
        body: JSON.stringify(payload)
      });
    }
  }