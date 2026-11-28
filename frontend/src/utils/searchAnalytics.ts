import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseClient';

export type SearchResolutionType =
  | 'idle_settle'
  | 'suggestion_click'
  | 'card_click'
  | 'cart_add'
  | 'submit'
  | 'abandon'
  | 'zero_results';

export interface SearchFilterContext {
  gameFilter?: string;
  tab?: 'marketplace' | 'catalog';
  rarityFilter?: string;
  typeFilter?: string;
  setFilter?: string;
}

export interface SearchIntentPayload extends SearchFilterContext {
  query: string;
  resultsCount?: number;
  resolutionType: SearchResolutionType;
  resolvedCardId?: string;
  resolvedName?: string;
}

const IDLE_SETTLE_MS = 1500;

const generateSessionId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

class SearchIntentTracker {
  private sessionId: string | null = null;
  private lastQuery = '';
  private lastResolvedName: string | null = null;
  private lastGameFilter: string | undefined;
  private lastRarityFilter: string | undefined;
  private lastTypeFilter: string | undefined;
  private lastSetFilter: string | undefined;
  private lastTab: 'marketplace' | 'catalog' = 'marketplace';
  private lastResultsCount = 0;
  private hasResultsLoaded = false;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private resolvedInSession = false;

  private applyContext(context?: SearchFilterContext) {
    if (!context) return;
    if (context.gameFilter !== undefined) this.lastGameFilter = context.gameFilter;
    if (context.tab !== undefined) this.lastTab = context.tab;
    if (context.rarityFilter !== undefined) this.lastRarityFilter = context.rarityFilter;
    if (context.typeFilter !== undefined) this.lastTypeFilter = context.typeFilter;
    if (context.setFilter !== undefined) this.lastSetFilter = context.setFilter;
  }

  public onQueryInput(query: string, context?: SearchFilterContext) {
    const trimmed = query.trim();
    this.applyContext(context);

    if (trimmed.length < 2 || trimmed === '{search_term_string}') {
      if (this.sessionId && this.lastQuery.trim().length >= 2 && !this.resolvedInSession) {
        this.flushNow({
          query: this.lastQuery,
          gameFilter: this.lastGameFilter,
          rarityFilter: this.lastRarityFilter,
          typeFilter: this.lastTypeFilter,
          setFilter: this.lastSetFilter,
          tab: this.lastTab,
          resultsCount: this.lastResultsCount,
          resolutionType: 'abandon',
        });
      }
      this.resetSession();
      return;
    }

    // Preserve the original partial query if this update came from clicking an autocomplete suggestion
    if (this.resolvedInSession && this.lastResolvedName && trimmed === this.lastResolvedName) {
      return;
    }

    if (this.resolvedInSession && this.lastResolvedName && trimmed !== this.lastResolvedName) {
      // User started a brand-new query after resolving a prior one
      this.resetSession();
    }

    if (!this.sessionId) {
      this.sessionId = generateSessionId();
      this.resolvedInSession = false;
      this.lastResolvedName = null;
    }

    this.lastQuery = trimmed;
    this.hasResultsLoaded = false;

    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (!this.sessionId || this.lastQuery.length < 2 || this.resolvedInSession) return;
      this.flushNow({
        query: this.lastQuery,
        gameFilter: this.lastGameFilter,
        rarityFilter: this.lastRarityFilter,
        typeFilter: this.lastTypeFilter,
        setFilter: this.lastSetFilter,
        tab: this.lastTab,
        resultsCount: this.lastResultsCount,
        resolutionType: this.hasResultsLoaded && this.lastResultsCount === 0 ? 'zero_results' : 'idle_settle',
      });
    }, IDLE_SETTLE_MS);
  }

  public onResultsLoaded(query: string, resultsCount: number, context?: SearchFilterContext) {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    if (!this.sessionId) {
      this.sessionId = generateSessionId();
    }
    if (!(this.resolvedInSession && this.lastResolvedName && trimmed === this.lastResolvedName)) {
      this.lastQuery = trimmed;
    }
    this.lastResultsCount = Math.max(0, resultsCount);
    this.hasResultsLoaded = true;
    this.applyContext(context);

    if (this.lastResultsCount === 0 && !this.resolvedInSession) {
      if (this.idleTimer) clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => {
        if (!this.sessionId || this.lastQuery.length < 2 || this.resolvedInSession) return;
        this.flushNow({
          query: this.lastQuery,
          gameFilter: this.lastGameFilter,
          rarityFilter: this.lastRarityFilter,
          typeFilter: this.lastTypeFilter,
          setFilter: this.lastSetFilter,
          tab: this.lastTab,
          resultsCount: 0,
          resolutionType: 'zero_results',
        });
      }, 900);
    }
  }

  public recordResolution(
    resolutionType: Exclude<SearchResolutionType, 'idle_settle' | 'abandon' | 'zero_results'>,
    details?: SearchFilterContext & {
      query?: string;
      resolvedCardId?: string;
      resolvedName?: string;
      resultsCount?: number;
    }
  ) {
    const rawFromDetails = details?.query?.trim();
    const activeQuery = (
      this.resolvedInSession && this.lastQuery.length >= 2
        ? this.lastQuery
        : rawFromDetails || this.lastQuery
    ).trim();

    if (activeQuery.length < 2) return;

    if (!this.sessionId) {
      this.sessionId = generateSessionId();
    }
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    this.lastQuery = activeQuery;
    if (details?.resultsCount !== undefined) this.lastResultsCount = details.resultsCount;
    this.applyContext(details);
    if (details?.resolvedName) this.lastResolvedName = details.resolvedName.trim();
    if (resolutionType === 'card_click' || resolutionType === 'cart_add' || resolutionType === 'suggestion_click') {
      this.resolvedInSession = true;
    }

    this.flushNow({
      query: activeQuery,
      gameFilter: this.lastGameFilter,
      rarityFilter: this.lastRarityFilter,
      typeFilter: this.lastTypeFilter,
      setFilter: this.lastSetFilter,
      tab: this.lastTab,
      resultsCount: this.lastResultsCount,
      resolutionType,
      resolvedCardId: details?.resolvedCardId,
      resolvedName: details?.resolvedName,
    });
  }

  public flushOnPageHide() {
    if (!this.sessionId || this.lastQuery.trim().length < 2 || this.resolvedInSession) return;
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    const supabaseUrl = SUPABASE_URL;
    const anonKey = SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) return;

    const payload = {
      p_search_session_id: this.sessionId,
      p_query: this.lastQuery.trim(),
      p_game_filter: this.lastGameFilter || null,
      p_tab: this.lastTab,
      p_results_count: this.lastResultsCount,
      p_resolution_type: this.hasResultsLoaded && this.lastResultsCount === 0 ? 'zero_results' : 'abandon',
      p_resolved_card_id: null,
      p_resolved_name: null,
      p_rarity_filter: this.lastRarityFilter || null,
      p_type_filter: this.lastTypeFilter || null,
      p_set_filter: this.lastSetFilter || null,
    };

    try {
      fetch(`${supabaseUrl}/rest/v1/rpc/log_search_intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Non-blocking telemetry
    }
  }

  private async flushNow(payload: SearchIntentPayload) {
    if (!this.sessionId || payload.query.trim().length < 2) return;
    try {
      await supabase.rpc('log_search_intent', {
        p_search_session_id: this.sessionId,
        p_query: payload.query.trim(),
        p_game_filter: payload.gameFilter || null,
        p_tab: payload.tab || 'marketplace',
        p_results_count: payload.resultsCount ?? 0,
        p_resolution_type: payload.resolutionType,
        p_resolved_card_id: payload.resolvedCardId || null,
        p_resolved_name: payload.resolvedName || null,
        p_rarity_filter: payload.rarityFilter || null,
        p_type_filter: payload.typeFilter || null,
        p_set_filter: payload.setFilter || null,
      });
    } catch {
      // Non-blocking telemetry
    }
  }

  private resetSession() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    this.sessionId = null;
    this.lastQuery = '';
    this.lastResolvedName = null;
    this.lastResultsCount = 0;
    this.hasResultsLoaded = false;
    this.resolvedInSession = false;
  }
}

export const searchIntentTracker = new SearchIntentTracker();

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    searchIntentTracker.flushOnPageHide();
  });
}
