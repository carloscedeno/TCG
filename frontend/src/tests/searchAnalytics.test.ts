const mockRpc = jest.fn().mockResolvedValue({ data: null, error: null });

jest.mock('../utils/supabaseClient', () => ({
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

import { searchIntentTracker } from '../utils/searchAnalytics';

describe('SearchIntentTracker (Search Intent Folding)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockRpc.mockClear();
    // Reset tracker state cleanly between tests
    searchIntentTracker.onQueryInput('');
    mockRpc.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('folds rapid typing bursts into a single idle_settle RPC call', () => {
    searchIntentTracker.onQueryInput('li', { gameFilter: 'MTG', tab: 'marketplace' });
    jest.advanceTimersByTime(250);
    searchIntentTracker.onQueryInput('ligh', { gameFilter: 'MTG', tab: 'marketplace' });
    jest.advanceTimersByTime(250);
    searchIntentTracker.onQueryInput('lightning', { gameFilter: 'MTG', tab: 'marketplace' });

    expect(mockRpc).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1500);

    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith(
      'log_search_intent',
      expect.objectContaining({
        p_query: 'lightning',
        p_game_filter: 'MTG',
        p_tab: 'marketplace',
        p_resolution_type: 'idle_settle',
      })
    );
  });

  test('preserves partial typed query when autocomplete suggestion is selected', () => {
    searchIntentTracker.onQueryInput('sheoldr', { gameFilter: 'MTG', tab: 'marketplace' });
    searchIntentTracker.recordResolution('suggestion_click', {
      query: 'sheoldr',
      resolvedName: 'Sheoldred, the Apocalypse',
    });

    // Simulate SearchBar setting input value to the full suggestion
    searchIntentTracker.onQueryInput('Sheoldred, the Apocalypse', { gameFilter: 'MTG', tab: 'marketplace' });

    jest.advanceTimersByTime(2000);

    // Must not overwrite with idle_settle or replace 'sheoldr'
    expect(mockRpc).toHaveBeenCalledTimes(1);
    const [, params] = mockRpc.mock.calls[0];
    expect(params.p_query).toBe('sheoldr');
    expect(params.p_resolved_name).toBe('Sheoldred, the Apocalypse');
    expect(params.p_resolution_type).toBe('suggestion_click');

    // Subsequent card_click keeps the same sessionId and partial query
    searchIntentTracker.recordResolution('card_click', {
      query: 'Sheoldred, the Apocalypse',
      resolvedCardId: 'abc-nonfoil',
      resolvedName: 'Sheoldred, the Apocalypse',
      resultsCount: 2,
    });

    expect(mockRpc).toHaveBeenCalledTimes(2);
    const [, clickParams] = mockRpc.mock.calls[1];
    expect(clickParams.p_search_session_id).toBe(params.p_search_session_id);
    expect(clickParams.p_query).toBe('sheoldr');
    expect(clickParams.p_resolution_type).toBe('card_click');
    expect(clickParams.p_resolved_card_id).toBe('abc-nonfoil');
  });

  test('records zero_results when backend returns 0 matches', () => {
    searchIntentTracker.onQueryInput('black lotus alpha', { gameFilter: 'MTG', tab: 'marketplace' });
    searchIntentTracker.onResultsLoaded('black lotus alpha', 0, { gameFilter: 'MTG', tab: 'marketplace' });

    jest.advanceTimersByTime(950);

    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith(
      'log_search_intent',
      expect.objectContaining({
        p_query: 'black lotus alpha',
        p_results_count: 0,
        p_resolution_type: 'zero_results',
      })
    );
  });

  test('starts a new session when typing a new query after resolving previous one', () => {
    searchIntentTracker.onQueryInput('sol r');
    searchIntentTracker.recordResolution('suggestion_click', {
      query: 'sol r',
      resolvedName: 'Sol Ring',
    });

    searchIntentTracker.onQueryInput('rhystic');
    jest.advanceTimersByTime(1500);

    expect(mockRpc).toHaveBeenCalledTimes(2);
    const firstSession = mockRpc.mock.calls[0][1].p_search_session_id;
    const secondSession = mockRpc.mock.calls[1][1].p_search_session_id;
    expect(firstSession).not.toBe(secondSession);
    expect(mockRpc.mock.calls[1][1].p_query).toBe('rhystic');
  });
});
