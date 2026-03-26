const state = {
  startedAt: new Date().toISOString(),
  requestsTotal: 0,
  requestsByStatus: {},
  authFailuresByReason: {},
  requestDurationMs: []
};

const observeRequest = ({ statusCode, durationMs }) => {
  state.requestsTotal += 1;
  state.requestsByStatus[statusCode] = (state.requestsByStatus[statusCode] || 0) + 1;
  state.requestDurationMs.push(durationMs);

  if (state.requestDurationMs.length > 5000) {
    state.requestDurationMs.shift();
  }
};

const observeAuthFailure = (reason) => {
  state.authFailuresByReason[reason] = (state.authFailuresByReason[reason] || 0) + 1;
};

const percentile = (arr, p) => {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(idx, 0)];
};

const snapshot = () => ({
  ...state,
  requestDuration: {
    avgMs: state.requestDurationMs.length
      ? state.requestDurationMs.reduce((sum, item) => sum + item, 0) / state.requestDurationMs.length
      : 0,
    p95Ms: percentile(state.requestDurationMs, 95),
    sampleSize: state.requestDurationMs.length
  }
});

module.exports = {
  observeRequest,
  observeAuthFailure,
  snapshot
};
