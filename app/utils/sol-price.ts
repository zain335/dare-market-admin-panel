/**
 * SOL Price Utility
 * Fetches and caches SOL price from CoinGecko API
 */

const REQUEST_TIMEOUT = 5000; // 5 seconds
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const LAMPORTS_PER_SOL = 1_000_000_000;

interface PriceCache {
  price: number;
  timestamp: number;
}

// In-memory cache for SOL price
let priceCache: PriceCache | null = null;

/**
 * Fetch SOL price from CoinGecko API
 * @returns {Promise<number>} SOL price in USD
 */
export const fetchSolPriceFromCoinGecko = async (): Promise<number> => {
  try {
    console.log("[SOL Price] Fetching SOL price from CoinGecko API...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`CoinGecko API error! status: ${response.status}`);
    }

    const data = await response.json();
    const price = parseFloat(data?.solana?.usd);

    if (isNaN(price) || price <= 0) {
      throw new Error("Invalid price from CoinGecko API");
    }

    console.log("[SOL Price] SOL price fetched from CoinGecko:", price);
    return price;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[SOL Price] CoinGecko API request timeout");
    } else {
      console.error("[SOL Price] Error fetching SOL price from CoinGecko:", error);
    }
    throw error;
  }
};

/**
 * Get cached SOL price or fetch new one if cache is expired
 * @returns {Promise<number | null>} SOL price in USD or null if fetch fails
 */
export const getCachedSolPrice = async (): Promise<number | null> => {
  const now = Date.now();

  // Check if cache is valid
  if (priceCache && now - priceCache.timestamp < CACHE_DURATION) {
    console.log("[SOL Price] Using cached price:", priceCache.price);
    return priceCache.price;
  }

  // Cache is expired or doesn't exist, fetch new price
  try {
    const price = await fetchSolPriceFromCoinGecko();
    priceCache = {
      price,
      timestamp: now,
    };
    return price;
  } catch (error) {
    console.error("[SOL Price] Failed to fetch SOL price, returning null");
    return null;
  }
};

/**
 * Convert lamports to SOL
 * @param lamports - Amount in lamports (string or number)
 * @returns SOL amount as number
 */
export const lamportsToSol = (lamports: string | number): number => {
  const lamportsNum = typeof lamports === "string" ? parseFloat(lamports) : lamports;
  return lamportsNum / LAMPORTS_PER_SOL;
};

/**
 * Format USD value with abbreviated notation (K, M, B)
 * Examples: $1.2K, $15.5M, $2.3B
 * @param usdAmount - Amount in USD
 * @returns Formatted string with "$" prefix, abbreviated value, and "USD" suffix
 */
export const formatUsdValue = (usdAmount: number): string => {
  const absAmount = Math.abs(usdAmount);

  if (absAmount >= 1_000_000_000) {
    // Billions
    return `$${(usdAmount / 1_000_000_000).toFixed(1)}B`;
  } else if (absAmount >= 1_000_000) {
    // Millions
    return `$${(usdAmount / 1_000_000).toFixed(1)}M`;
  } else if (absAmount >= 1_000) {
    // Thousands
    return `$${(usdAmount / 1_000).toFixed(1)}K`;
  } else {
    // Less than 1000
    return `$${usdAmount.toFixed(2)}`;
  }
};

/**
 * Convert lamports to formatted USD string
 * @param lamports - Amount in lamports
 * @param solPrice - Current SOL price in USD (null if unavailable)
 * @returns Formatted USD string or null if price unavailable
 */
export const lamportsToUsd = (
  lamports: string | number,
  solPrice: number | null
): string | null => {
  if (solPrice === null) {
    return null;
  }

  const solAmount = lamportsToSol(lamports);
  const usdAmount = solAmount * solPrice;

  return formatUsdValue(usdAmount);
};

/**
 * Format SOL amount with decimal places
 * @param sol - SOL amount
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted SOL string
 */
export const formatSolAmount = (sol: number, decimals: number = 2): string => {
  return sol.toFixed(decimals);
};
