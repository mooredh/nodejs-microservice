const axios = require('axios');

class CircuitBreaker {
  constructor() {
    this.states = {};
    this.failureThreshold = 5;
    this.cooldownPeriod = 10;
    this.requestTimeout = 2;
  }

  async callService(requestOptions) {
    const endpoint = `${requestOptions.method}:${requestOptions.url}`;
    const timeout = this.requestTimeout * 1000;

    if (!this.canRequest(endpoint)) return false;

    try {
      const response = await axios({ ...requestOptions, timeout });
      this.onSuccess(endpoint);
      return response.data;
    } catch (error) {
      this.onFailure(endpoint);
      return false;
    }
  }

  onSuccess(endpoint) {
    this.initState(endpoint);
  }

  onFailure(endpoint) {
    const state = this.states[endpoint];
    state.failures += 1;
    if (state.failures > this.failureThreshold) {
      state.isClosed = false;
      state.nextTry = new Date() / 1000 + this.cooldownPeriod;
    }
  }

  canRequest(endpoint) {
    if (!this.states[endpoint]) this.initState(endpoint);
    const state = this.states[endpoint];
    const now = new Date() / 1000;
    if (!state.isClosed && now >= state.nextTry) return true;
    return state.isClosed;
  }

  initState(endpoint) {
    this.states[endpoint] = {
      failures: 0,
      cooldownPeriod: this.cooldownPeriod,
      isClosed: true,
      nextTry: 0,
    };
  }
}

module.exports = CircuitBreaker;
