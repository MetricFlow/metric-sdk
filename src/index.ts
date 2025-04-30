import Client from './core/client';

const metricflow = new Client();

// Browser global exposure
if (typeof window !== 'undefined') {
  (window as any).metricflow = metricflow;
}

export default metricflow;