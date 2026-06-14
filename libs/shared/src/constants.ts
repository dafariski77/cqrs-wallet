// RabbitMQ Exchange / Queue names
export const RABBITMQ_EXCHANGE = 'coinsight.exchange';
export const WALLET_ADDED_ROUTING_KEY = 'wallet.added';
export const TRANSACTIONS_SYNCED_ROUTING_KEY = 'transactions.synced';

// NestJS microservice client injection tokens
export const USER_WALLET_SERVICE = 'USER_WALLET_SERVICE';
export const ANALYTICS_SERVICE = 'ANALYTICS_SERVICE';

// Message patterns (for TCP transport between gateway and services)
export const ADD_WALLET_CMD = 'add_wallet';
export const GET_PORTFOLIO_QUERY = 'get_portfolio';
export const GET_TRANSACTIONS_QUERY = 'get_transactions';
