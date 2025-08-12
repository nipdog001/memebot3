class CCXTIntegration {
    constructor() {
        this.isInitialized = false;
    }
    async initializeAllExchanges() {
        return { connectedCount: 0, totalExchanges: 5, exchanges: {} };
    }
    getAvailableSymbols() { return []; }
    getAllAvailableSymbols() { return []; }
    getConnectionStatus() { return { isInitialized: this.isInitialized }; }
}
export default new CCXTIntegration();
