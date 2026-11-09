import { isSinglesPurchaseDisabled, SINGLES_CLOSED_MESSAGE } from '../utils/singlesConfig';

describe('singlesConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    process.env = originalEnv;
    localStorage.clear();
  });

  it('exports correct closed message', () => {
    expect(SINGLES_CLOSED_MESSAGE).toBe('Cerrado Hasta Nuevo Aviso');
  });

  it('respects localStorage override when set to true', () => {
    localStorage.setItem('singles_purchase_disabled', 'true');
    expect(isSinglesPurchaseDisabled()).toBe(true);
  });

  it('respects localStorage override when set to false', () => {
    localStorage.setItem('singles_purchase_disabled', 'false');
    expect(isSinglesPurchaseDisabled()).toBe(false);
  });
});
