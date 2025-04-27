import Client from './core/client';

// Create the client instance
const clientInstance = new Client();

// Public API methods
const publicMethods = {
  init: (apiKey, config) => {
    clientInstance.init(apiKey, config);
    // After initialization, bind methods
    publicMethods.track = clientInstance.track.bind(clientInstance);
    publicMethods.identify = clientInstance.identify.bind(clientInstance);
    // Bind other methods as needed
  },
  
  // Temporary placeholder methods that warn about initialization
  track: () => console.warn('MetricFlow: SDK not initialized. Call init() first'),
  identify: () => console.warn('MetricFlow: SDK not initialized. Call init() first')
};

// Browser global exposure
if (typeof window !== 'undefined') {
  window.metricflow = publicMethods;
}

// Module exports
export default publicMethods;