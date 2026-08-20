/**
 * Enum định nghĩa trạng thái của Wallet.
 */
export enum WalletStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  INACTIVE = 'INACTIVE',
}

/**
 * Enum định nghĩa loại giao dịch trong TransactionHistory.
 */
export enum TransactionType {
  REWARD = 'REWARD',
  PENALTY = 'PENALTY',
  TRANSFER = 'TRANSFER',
}
