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
  createTransaction: (data: any) => {
    return axios.post<IBackendRes<any>>('/hr-wallets/transaction', data);
  }
};
