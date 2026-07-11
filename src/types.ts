export interface Stock {
  id: string;
  name: string;
  ticker: string;
  price: number;
  prevPrice: number;
  history: number[]; // Array of last N prices
  volatility: number; // 0.01 to 0.1
  drift: number; // -0.01 to 0.02
  minPrice: number;
  maxPrice: number;
  description: string;
  category: 'Tech' | 'Bio' | 'Energy' | 'Consumer' | 'Crypto' | 'Meme';
}

export interface ChartDataPoint {
  time: string;
  price: number;
}

export interface PortfolioItem {
  stockId: string;
  shares: number;
  avgBuyPrice: number;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  time: string; // "14:20" etc.
  impactStockId: string | null;
  impactPercent: number; // e.g. +10 or -15
  type: 'positive' | 'negative' | 'neutral';
  read: boolean;
}

export interface Transaction {
  id: string;
  timestamp: string;
  stockId: string;
  ticker: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  total: number;
}

export interface GameStats {
  totalTrades: number;
  winningTrades: number;
  highestPortfolioValue: number;
  biggestGainPercent: number;
}
