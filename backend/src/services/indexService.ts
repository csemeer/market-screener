import { StockData } from '../types';

/**
 * Market Index structure
 */
export interface MarketIndex {
  id: string;
  name: string;
  symbol: string;
  exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ';
  description: string;
  constituents: string[]; // Stock symbols that are part of this index
  totalStocks: number;
  category?: string;
}

/**
 * Service for managing market indexes and their constituents
 * Supports NSE, NYSE, NASDAQ indexes
 */
class IndexService {
  private indexes: Map<string, MarketIndex> = new Map();

  initialize() {
    this.loadIndexes();
    console.log('📊 Index Service initialized');
    console.log(`   Total indexes: ${this.indexes.size}`);
    console.log(`   NSE indexes: ${this.getIndexesByExchange('NSE').length}`);
    console.log(`   NYSE indexes: ${this.getIndexesByExchange('NYSE').length}`);
    console.log(`   NASDAQ indexes: ${this.getIndexesByExchange('NASDAQ').length}`);
  }

  /**
   * Load all market indexes with their constituents
   */
  private loadIndexes() {
    // ========== NSE INDEXES ==========

    // NIFTY 50 - Top 50 companies on NSE
    this.indexes.set('nifty50', {
      id: 'nifty50',
      name: 'NIFTY 50',
      symbol: '^NSEI',
      exchange: 'NSE',
      description: 'Top 50 companies by market capitalization on NSE',
      category: 'Broad Market',
      constituents: [
        'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK',
        'KOTAKBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'ASIANPAINT', 'AXISBANK',
        'LT', 'DMART', 'TITAN', 'ULTRACEMCO', 'NESTLEIND', 'BAJFINANCE',
        'HCLTECH', 'WIPRO', 'MARUTI', 'SUNPHARMA', 'ONGC', 'TATAMOTORS',
        'TATASTEEL', 'POWERGRID', 'NTPC', 'JSWSTEEL', 'M&M', 'TECHM',
        'INDUSINDBK', 'ADANIENT', 'ADANIPORTS', 'COALINDIA', 'DIVISLAB',
        'GRASIM', 'BAJAJFINSV', 'TATACONSUM', 'SHREECEM', 'HINDALCO',
        'BRITANNIA', 'CIPLA', 'DRREDDY', 'EICHERMOT', 'APOLLOHOSP',
        'HEROMOTOCO', 'BAJAJ-AUTO', 'BPCL', 'UPL', 'LTIM'
      ],
      totalStocks: 50
    });

    // NIFTY BANK - Banking sector index
    this.indexes.set('niftybank', {
      id: 'niftybank',
      name: 'NIFTY BANK',
      symbol: '^NSEBANK',
      exchange: 'NSE',
      description: 'Top banking and financial services companies',
      category: 'Sector',
      constituents: [
        'HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'SBIN', 'AXISBANK',
        'INDUSINDBK', 'BANDHANBNK', 'FEDERALBNK', 'IDFCFIRSTB', 'PNB',
        'BANKBARODA', 'AUBANK'
      ],
      totalStocks: 12
    });

    // NIFTY IT - Information Technology sector
    this.indexes.set('niftyit', {
      id: 'niftyit',
      name: 'NIFTY IT',
      symbol: '^CNXIT',
      exchange: 'NSE',
      description: 'Information Technology and Software companies',
      category: 'Sector',
      constituents: [
        'TCS', 'INFY', 'HCLTECH', 'WIPRO', 'TECHM', 'LTIM',
        'PERSISTENT', 'COFORGE', 'MPHASIS', 'LTTS'
      ],
      totalStocks: 10
    });

    // NIFTY AUTO - Automobile sector
    this.indexes.set('niftyauto', {
      id: 'niftyauto',
      name: 'NIFTY AUTO',
      symbol: '^CNXAUTO',
      exchange: 'NSE',
      description: 'Automobile and Auto Components companies',
      category: 'Sector',
      constituents: [
        'MARUTI', 'TATAMOTORS', 'M&M', 'EICHERMOT', 'HEROMOTOCO',
        'BAJAJ-AUTO', 'TVSMOTOR', 'ASHOKLEY', 'BHARATFORG', 'MOTHERSON',
        'APOLLOTYRE', 'MRF', 'BALKRISIND', 'BOSCHLTD', 'EXIDEIND'
      ],
      totalStocks: 15
    });

    // NIFTY PHARMA - Pharmaceutical sector
    this.indexes.set('niftypharma', {
      id: 'niftypharma',
      name: 'NIFTY PHARMA',
      symbol: '^CNXPHARMA',
      exchange: 'NSE',
      description: 'Pharmaceutical and Healthcare companies',
      category: 'Sector',
      constituents: [
        'SUNPHARMA', 'DIVISLAB', 'CIPLA', 'DRREDDY', 'APOLLOHOSP',
        'LUPIN', 'BIOCON', 'TORNTPHARM', 'ALKEM', 'LAURUSLABS',
        'AUROPHARMA', 'ABBOTINDIA', 'GLENMARK', 'IPCALAB', 'NATCOPHARM'
      ],
      totalStocks: 15
    });

    // NIFTY FMCG - Fast Moving Consumer Goods
    this.indexes.set('niftyfmcg', {
      id: 'niftyfmcg',
      name: 'NIFTY FMCG',
      symbol: '^CNXFMCG',
      exchange: 'NSE',
      description: 'Fast Moving Consumer Goods companies',
      category: 'Sector',
      constituents: [
        'HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'TATACONSUM',
        'DABUR', 'MARICO', 'GODREJCP', 'COLPAL', 'PIDILITIND',
        'MCDOWELL-N', 'EMAMILTD', 'VBL', 'RADICO', 'BAJAJHLDNG'
      ],
      totalStocks: 15
    });

    // NIFTY METAL - Metals and Mining
    this.indexes.set('niftymetal', {
      id: 'niftymetal',
      name: 'NIFTY METAL',
      symbol: '^CNXMETAL',
      exchange: 'NSE',
      description: 'Metals and Mining companies',
      category: 'Sector',
      constituents: [
        'TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'COALINDIA', 'VEDL',
        'JINDALSTEL', 'SAIL', 'NMDC', 'NATIONALUM', 'HINDZINC',
        'MOIL', 'WELCORP', 'RATNAMANI', 'APARINDS', 'WELSPUNIND'
      ],
      totalStocks: 15
    });

    // NIFTY ENERGY - Energy sector
    this.indexes.set('niftyenergy', {
      id: 'niftyenergy',
      name: 'NIFTY ENERGY',
      symbol: '^CNXENERGY',
      exchange: 'NSE',
      description: 'Oil, Gas and Energy companies',
      category: 'Sector',
      constituents: [
        'RELIANCE', 'ONGC', 'POWERGRID', 'NTPC', 'BPCL', 'IOC',
        'COALINDIA', 'ADANIGREEN', 'ADANIPOWER', 'TATAPOWER',
        'GAIL', 'HINDPETRO', 'OIL', 'PETRONET', 'ATGL'
      ],
      totalStocks: 15
    });

    // NIFTY MIDCAP 100
    this.indexes.set('niftymidcap100', {
      id: 'niftymidcap100',
      name: 'NIFTY MIDCAP 100',
      symbol: '^NSEMDCP100',
      exchange: 'NSE',
      description: 'Top 100 mid-cap companies',
      category: 'Market Cap',
      constituents: [
        'ADANIPORTS', 'ADANIENT', 'COLPAL', 'DLF', 'GODREJCP',
        'LUPIN', 'GAIL', 'SIEMENS', 'PIDILITIND', 'SBICARD',
        'BANKBARODA', 'INDIGO', 'BOSCHLTD', 'AMBUJACEM', 'ACC',
        'ALKEM', 'BERGEPAINT', 'BANDHANBNK', 'BIOCON', 'CADILAHC',
        // ... truncating for brevity - in production, include all 100
      ],
      totalStocks: 100
    });

    // NIFTY SMALLCAP 100
    this.indexes.set('niftysmallcap100', {
      id: 'niftysmallcap100',
      name: 'NIFTY SMALLCAP 100',
      symbol: '^NSESMCP100',
      exchange: 'NSE',
      description: 'Top 100 small-cap companies',
      category: 'Market Cap',
      constituents: [
        'KAJARIACER', 'RELAXO', 'FINEORG', 'HONAUT', 'CROMPTON',
        'SCHAEFFLER', 'SYMPHONY', 'VGUARD', 'WHIRLPOOL', 'BLUEDART',
        // ... truncating for brevity - in production, include all 100
      ],
      totalStocks: 100
    });

    // ========== US INDEXES - NYSE & NASDAQ ==========

    // S&P 500 - Top 500 US companies
    this.indexes.set('sp500', {
      id: 'sp500',
      name: 'S&P 500',
      symbol: '^GSPC',
      exchange: 'NYSE',
      description: 'Top 500 large-cap US companies',
      category: 'Broad Market',
      constituents: [
        // Technology
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
        // Financial
        'JPM', 'V', 'MA', 'BAC', 'WFC', 'MS', 'GS', 'C', 'AXP',
        // Healthcare
        'JNJ', 'UNH', 'PFE', 'ABBV', 'MRK', 'TMO', 'LLY', 'ABT', 'DHR',
        // Consumer
        'PG', 'KO', 'PEP', 'WMT', 'HD', 'MCD', 'COST', 'NKE', 'DIS',
        // Industrial
        'BA', 'HON', 'UPS', 'CAT', 'GE', 'MMM', 'RTX', 'LMT',
        // Energy
        'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PSX', 'MPC',
        // Telecom
        'T', 'VZ', 'TMUS',
        // More tech
        'AVGO', 'CSCO', 'ACN', 'ORCL', 'CRM', 'ADBE', 'INTC', 'AMD', 'QCOM',
        // More healthcare
        'CVS', 'BMY', 'GILD', 'AMGN', 'ISRG', 'CI', 'MDT',
        // More consumer
        'TGT', 'SBUX', 'LOW', 'TJX', 'CMG', 'MAR',
        // Utilities
        'NEE', 'DUK', 'SO', 'D', 'AEP',
        // Real Estate
        'AMT', 'PLD', 'CCI', 'EQIX', 'SPG',
        // Materials
        'LIN', 'APD', 'ECL', 'SHW', 'FCX', 'NEM',
        // Additional major companies
        'BRK.B', 'TSM', 'NFLX', 'PYPL', 'IBM', 'TXN', 'NOW', 'INTU',
        'PM', 'MO', 'UNP', 'DE', 'ADP', 'SPGI', 'BLK', 'CB', 'MMC',
        // ... (in production, include all 500 constituents)
      ],
      totalStocks: 500
    });

    // DOW JONES INDUSTRIAL AVERAGE
    this.indexes.set('dowjones', {
      id: 'dowjones',
      name: 'DOW JONES',
      symbol: '^DJI',
      exchange: 'NYSE',
      description: '30 prominent companies in the US',
      category: 'Broad Market',
      constituents: [
        'AAPL', 'MSFT', 'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD',
        'CVX', 'MRK', 'WMT', 'MCD', 'DIS', 'CSCO', 'NKE', 'CRM',
        'IBM', 'HON', 'AMGN', 'CAT', 'BA', 'TRV', 'AXP', 'GS',
        'DOW', 'VZ', 'MMM', 'INTC', 'KO', 'WBA'
      ],
      totalStocks: 30
    });

    // NASDAQ 100 - Top 100 non-financial companies on NASDAQ
    this.indexes.set('nasdaq100', {
      id: 'nasdaq100',
      name: 'NASDAQ 100',
      symbol: '^NDX',
      exchange: 'NASDAQ',
      description: 'Top 100 non-financial companies on NASDAQ',
      category: 'Technology Heavy',
      constituents: [
        // Mega-cap tech
        'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA',
        // Tech leaders
        'AVGO', 'CSCO', 'ADBE', 'NFLX', 'CRM', 'INTC', 'AMD', 'QCOM',
        'TXN', 'ORCL', 'INTU', 'NOW', 'AMAT', 'LRCX', 'KLAC', 'SNPS',
        'CDNS', 'MRVL', 'FTNT', 'PANW', 'CRWD', 'DDOG', 'NET', 'ZS',
        // E-commerce & consumer
        'PYPL', 'ABNB', 'BKNG', 'EBAY', 'JD', 'PDD', 'MELI',
        // Biotech & healthcare
        'AMGN', 'GILD', 'REGN', 'VRTX', 'BIIB', 'ILMN', 'MRNA', 'ISRG',
        // Consumer & retail
        'COST', 'SBUX', 'MNST', 'KDP', 'KHC', 'MDLZ', 'PEP',
        // Semiconductor
        'MU', 'ADI', 'NXPI', 'MCHP', 'ON', 'SWKS', 'ENPH',
        // Software & cloud
        'TEAM', 'WDAY', 'OKTA', 'DOCU', 'ZM', 'TWLO', 'SNOW',
        // Auto & EV
        'LCID', 'RIVN', 'NIO', 'XPEV',
        // Communication
        'TMUS', 'CMCSA', 'CHTR',
        // Other
        'AZN', 'ASML', 'HON', 'ADP', 'PAYX', 'ATVI', 'EA', 'TTWO',
        // ... (in production, include all 100)
      ],
      totalStocks: 100
    });

    // NASDAQ Composite (broader than NASDAQ 100)
    this.indexes.set('nasdaqcomp', {
      id: 'nasdaqcomp',
      name: 'NASDAQ COMPOSITE',
      symbol: '^IXIC',
      exchange: 'NASDAQ',
      description: 'All stocks listed on NASDAQ',
      category: 'Broad Market',
      constituents: [
        // Includes all NASDAQ 100 constituents plus many more
        ...this.indexes.get('nasdaq100')!.constituents,
        // Additional NASDAQ stocks
        'ROKU', 'SQ', 'SHOP', 'SPOT', 'SNAP', 'PINS', 'LYFT', 'UBER',
        'ZI', 'BILL', 'COUP', 'PTON', 'W', 'CVNA', 'DASH', 'COIN',
        // ... (in production, include all NASDAQ listed stocks)
      ],
      totalStocks: 3000 // Approximate
    });

    // RUSSELL 2000 - Small-cap index
    this.indexes.set('russell2000', {
      id: 'russell2000',
      name: 'RUSSELL 2000',
      symbol: '^RUT',
      exchange: 'NYSE',
      description: 'Small-cap US companies index',
      category: 'Small Cap',
      constituents: [
        // Small-cap companies
        'WOOF', 'FOUR', 'WOLF', 'BGFV', 'ASO', 'HIBB', 'DKS',
        'PLAY', 'TXRH', 'DNUT', 'WING', 'CAKE', 'BLMN',
        // Regional banks
        'PACW', 'WAL', 'WTFC', 'CADE', 'SFNC', 'ONB', 'UMBF',
        // Healthcare
        'TNDM', 'PODD', 'NVST', 'OMCL', 'NEOG', 'HOLX',
        // Technology
        'FRSH', 'QTWO', 'BLKB', 'PRGS', 'ALRM', 'ASAN', 'DOCN',
        // ... (in production, include all 2000)
      ],
      totalStocks: 2000
    });

    // TECHNOLOGY SELECT SECTOR
    this.indexes.set('techsector', {
      id: 'techsector',
      name: 'Technology Select Sector',
      symbol: 'XLK',
      exchange: 'NYSE',
      description: 'Technology sector companies from S&P 500',
      category: 'Sector',
      constituents: [
        'AAPL', 'MSFT', 'NVDA', 'AVGO', 'CSCO', 'ACN', 'ORCL', 'CRM',
        'ADBE', 'INTC', 'AMD', 'QCOM', 'TXN', 'IBM', 'NOW', 'INTU',
        'AMAT', 'LRCX', 'KLAC', 'SNPS', 'CDNS', 'MRVL', 'FTNT', 'PANW',
        'ADI', 'NXPI', 'MU', 'MCHP', 'ON', 'SWKS', 'ENPH', 'MPWR'
      ],
      totalStocks: 65
    });

    // HEALTHCARE SELECT SECTOR
    this.indexes.set('healthcaresector', {
      id: 'healthcaresector',
      name: 'Healthcare Select Sector',
      symbol: 'XLV',
      exchange: 'NYSE',
      description: 'Healthcare sector companies from S&P 500',
      category: 'Sector',
      constituents: [
        'UNH', 'JNJ', 'LLY', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'PFE',
        'BMY', 'AMGN', 'CVS', 'GILD', 'ISRG', 'CI', 'MDT', 'REGN', 'VRTX',
        'HUM', 'ELV', 'BSX', 'ZTS', 'SYK', 'MCK', 'BDX', 'CVS', 'EW'
      ],
      totalStocks: 63
    });

    // FINANCIAL SELECT SECTOR
    this.indexes.set('financialsector', {
      id: 'financialsector',
      name: 'Financial Select Sector',
      symbol: 'XLF',
      exchange: 'NYSE',
      description: 'Financial sector companies from S&P 500',
      category: 'Sector',
      constituents: [
        'JPM', 'V', 'MA', 'BAC', 'WFC', 'MS', 'GS', 'C', 'AXP', 'BLK',
        'SPGI', 'CB', 'MMC', 'PGR', 'CME', 'ICE', 'USB', 'TFC', 'PNC',
        'SCHW', 'AON', 'BK', 'AIG', 'MET', 'PRU', 'AFL', 'ALL', 'TRV'
      ],
      totalStocks: 68
    });

    // ENERGY SELECT SECTOR
    this.indexes.set('energysector', {
      id: 'energysector',
      name: 'Energy Select Sector',
      symbol: 'XLE',
      exchange: 'NYSE',
      description: 'Energy sector companies from S&P 500',
      category: 'Sector',
      constituents: [
        'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PSX', 'MPC', 'VLO',
        'OXY', 'WMB', 'KMI', 'HES', 'HAL', 'BKR', 'FANG', 'DVN',
        'MRO', 'APA', 'CTRA', 'OVV', 'EQT', 'TRGP'
      ],
      totalStocks: 23
    });
  }

  /**
   * Get all indexes
   */
  getAllIndexes(): MarketIndex[] {
    return Array.from(this.indexes.values());
  }

  /**
   * Get indexes by exchange
   */
  getIndexesByExchange(exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'): MarketIndex[] {
    return Array.from(this.indexes.values()).filter(idx => idx.exchange === exchange);
  }

  /**
   * Get index by ID
   */
  getIndexById(id: string): MarketIndex | null {
    return this.indexes.get(id) || null;
  }

  /**
   * Get constituents of an index
   */
  getIndexConstituents(indexId: string): string[] {
    const index = this.indexes.get(indexId);
    return index ? index.constituents : [];
  }

  /**
   * Get all unique stocks across all indexes for an exchange
   */
  getAllStocksByExchange(exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'): string[] {
    const indexes = this.getIndexesByExchange(exchange);
    const stocksSet = new Set<string>();

    indexes.forEach(index => {
      index.constituents.forEach(stock => stocksSet.add(stock));
    });

    return Array.from(stocksSet).sort();
  }

  /**
   * Search indexes by name or category
   */
  searchIndexes(query: string): MarketIndex[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.indexes.values()).filter(idx =>
      idx.name.toLowerCase().includes(lowerQuery) ||
      idx.description.toLowerCase().includes(lowerQuery) ||
      idx.category?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get indexes by category
   */
  getIndexesByCategory(category: string): MarketIndex[] {
    return Array.from(this.indexes.values()).filter(
      idx => idx.category?.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Get stock count by exchange
   */
  getStockCountByExchange(exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'): number {
    return this.getAllStocksByExchange(exchange).length;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalIndexes: this.indexes.size,
      byExchange: {
        NSE: this.getIndexesByExchange('NSE').length,
        NYSE: this.getIndexesByExchange('NYSE').length,
        NASDAQ: this.getIndexesByExchange('NASDAQ').length
      },
      stocksByExchange: {
        NSE: this.getStockCountByExchange('NSE'),
        NYSE: this.getStockCountByExchange('NYSE'),
        NASDAQ: this.getStockCountByExchange('NASDAQ')
      },
      byCategory: {
        'Broad Market': this.getIndexesByCategory('Broad Market').length,
        'Sector': this.getIndexesByCategory('Sector').length,
        'Market Cap': this.getIndexesByCategory('Market Cap').length
      }
    };
  }
}

export const indexService = new IndexService();
