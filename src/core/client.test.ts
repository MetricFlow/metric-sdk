import MetricFlow from '../index';

describe('MetricFlow SDK', () => {
  let metricflow: typeof MetricFlow;

  beforeEach(() => {
    // Reset the SDK before each test
    metricflow = MetricFlow;
    (window as any).metricflow = metricflow;
  });

  describe('init()', () => {
    test('should initialize with API key', () => {
      const result = metricflow.init('test-api-key');
      expect(result).toBeTruthy();
    });

    test('should reject empty API key', () => {
      expect(() => metricflow.init('')).toThrow('API key is required');
    });
  });

  describe('track()', () => {
    test('should track events with properties', () => {
      const spy = jest.spyOn(console, 'log');
      metricflow.track('page_view', { url: '/test' });
      expect(spy).toHaveBeenCalledWith('Tracking:', 'page_view', { url: '/test' });
    });

    test('should return event ID', () => {
      const eventId = metricflow.track('button_click');
      expect(eventId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}$/);
    });
  });
});