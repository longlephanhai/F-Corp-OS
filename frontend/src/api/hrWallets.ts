import axios from '../config/interceptor';

export interface WalletItem {
  id: string;
  balance: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    fullName: string;
    email: string;
    title: string;
  };
}

export interface TransactionHistoryItem {
  id: string;
  amount: number;
  type: string;
  reason: string;
  referenceId?: string;
  createdAt: string;
}

export interface WalletTransactionEmployee {
  id: string;
  fullName?: string;
  email?: string;
  title?: string;
}

export interface WalletTransactionWallet {
  id: string;
  employee?: WalletTransactionEmployee;
}

export interface WalletTransactionListItem
  extends TransactionHistoryItem {
  wallet?: WalletTransactionWallet;
}

export interface GetWalletTransactionsParams {
  page?: number;
  limit?: number;
  employeeId?: string;
  type?: WalletTransactionType;
}

export interface WalletTransactionListResponse {
  meta: {
    currentPage: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  result: WalletTransactionListItem[];
}

export type WalletTransactionType =
  | 'REWARD'
  | 'PENALTY'
  | 'TRANSFER';

export interface CreateWalletTransactionPayload {
  employeeId: string;
  amount: number;
  type: WalletTransactionType;
  reason: string;
  referenceId?: string;
}

export interface WalletsResponse {
  meta: {
    currentPage: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  result: WalletItem[];
}

export interface TransactionsResponse {
  meta: {
    currentPage: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  result: TransactionHistoryItem[];
}

export const hrWalletsApi = {
  getMyWallet: () => {
    return axios.get<IBackendRes<WalletItem>>('/hr-wallets/my-wallet');
  },
  getMyTransactions: (params?: any) => {
    return axios.get<IBackendRes<TransactionsResponse>>('/hr-wallets/my-transactions', { params });
  },
  getAllWallets: (params?: any) => {
    return axios.get<IBackendRes<WalletsResponse>>('/hr-wallets', { params });
  },
  createTransaction: (
    data: CreateWalletTransactionPayload,
  ) => {
    return axios.post<IBackendRes<TransactionHistoryItem>>(
      '/hr-wallets/transaction',
      data,
    );
  },
  getAllTransactions: (
    params?: GetWalletTransactionsParams,
  ) => {
    return axios.get<
      IBackendRes<WalletTransactionListResponse>
    >('/hr-wallets/transactions', {
      params,
    });
  },

};
