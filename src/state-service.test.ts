import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startPolling, stopPolling, clearStates, handleVisibilityChange } from './state-service';

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  in: vi.fn().mockResolvedValue({ data: [], error: null }),
};

vi.mock('./supabase', () => ({
  getSupabaseClient: vi.fn(() => mockSupabase)
}));

describe('state-service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearStates();
    stopPolling();
    vi.clearAllMocks();
    mockSupabase.in.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches on start and uses the low-traffic interval while idle', async () => {
    const cb = vi.fn();
    startPolling(cb);

    await Promise.resolve();
    await Promise.resolve();

    expect(mockSupabase.from).toHaveBeenCalledWith('teams_state');
    expect(cb).toHaveBeenCalled();

    const states = cb.mock.calls[0][0];
    expect(states.length).toBe(3);
    expect(states[0].team_id).toBe('TEAM_01');

    vi.advanceTimersByTime(15000);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockSupabase.from).toHaveBeenCalledTimes(2);
  });

  it('uses the responsive interval while any team is in operation', async () => {
    mockSupabase.in.mockResolvedValue({
      data: [{ team_id: 'TEAM_01', current_phase: 'EXAM_IN_PROGRESS', revision: 1 }],
      error: null,
    });

    startPolling(vi.fn());
    await Promise.resolve();
    await Promise.resolve();

    vi.advanceTimersByTime(2000);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockSupabase.from).toHaveBeenCalledTimes(2);
  });

  it('handles visibility change: pauses on hidden, resumes on visible', async () => {
    const cb = vi.fn();
    startPolling(cb);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockSupabase.from).toHaveBeenCalledTimes(1);

    handleVisibilityChange(true);

    vi.advanceTimersByTime(30000);
    expect(mockSupabase.from).toHaveBeenCalledTimes(1);

    handleVisibilityChange(false);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockSupabase.from).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(15000);
    await Promise.resolve();
    await Promise.resolve();
    expect(mockSupabase.from).toHaveBeenCalledTimes(3);
  });

  it('does not resume polling after stopPolling (logout)', async () => {
    const cb = vi.fn();
    startPolling(cb);
    await Promise.resolve();

    stopPolling(); // Equivalent to logout

    handleVisibilityChange(false); // Simulate bringing tab back
    await Promise.resolve();
    await Promise.resolve();

    vi.advanceTimersByTime(4000);
    expect(mockSupabase.from).toHaveBeenCalledTimes(1); // Should not have fetched again
  });

  it('ignores old fetch results if polling was stopped (pollId check)', async () => {
    let resolveFetch: (value: any) => void;
    (mockSupabase.from as any).mockReturnValueOnce({
      select: () => ({
        in: () => new Promise(resolve => {
          resolveFetch = resolve;
        })
      })
    });

    const cb = vi.fn();
    startPolling(cb);

    expect(mockSupabase.from).toHaveBeenCalledTimes(1);

    stopPolling();

    resolveFetch!({ data: [{ team_id: 'TEAM_01' }], error: null });
    await Promise.resolve();
    await Promise.resolve();

    expect(cb).not.toHaveBeenCalled();
  });
});
