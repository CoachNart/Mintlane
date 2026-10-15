export type LiveToken = {
  name: string;
  ticker: string;
  symbol: string;
  price: string;
  change: string;
  cap: string;
  volume: string;
  liquidity: number;
  stage: string;
  color: string;
  initials: string;
  curve: number;
  address: string;
  image?: string;
  url: string;
  createdAt: number;
};

type Profile = {
  chainId?: string;
  tokenAddress?: string;
  icon?: string | null;
  url?: string;
};

type Pair = {
  chainId?: string;
  url?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  priceUsd?: string | null;
  priceChange?: { h24?: number } | null;
  volume?: { h24?: number } | null;
  liquidity?: { usd?: number } | null;
  marketCap?: number | null;
  fdv?: number | null;
  pairCreatedAt?: number | null;
  info?: { imageUrl?: string | null };
  boosts?: { active?: number } | null;
};

const API = "https://api.dexscreener.com";
const COLORS = ["brand", "orange", "green", "blue", "pink", "teal"];

function formatUsd(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "—";
  if (value >= 1_000_000_000) return "$" + (value / 1_000_000_000).toFixed(2) + "B";
  if (value >= 1_000_000) return "$" + (value / 1_000_000).toFixed(value >= 10_000_000 ? 1 : 2) + "M";
  if (value >= 1_000) return "$" + (value / 1_000).toFixed(value >= 100_000 ? 1 : 2) + "K";
  return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

function formatPrice(value: string | null | undefined): string {
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) return "—";
  if (price >= 1) return "$" + price.toLocaleString("en-US", { maximumFractionDigits: 4 });
  if (price >= 0.01) return "$" + price.toFixed(4);
  if (price >= 0.0001) return "$" + price.toFixed(6);
  return "$" + price.toExponential(2);
}

function profileImage(profile: Profile | undefined, pair: Pair): string | undefined {
  const image = pair.info?.imageUrl || profile?.icon;
  if (!image) return undefined;
  try {
    const url = new URL(image);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error("Market data provider returned " + response.status);
  return response.json() as Promise<T>;
}

/**
 * Loads real Solana token market data from the public DexScreener API.
 * Discovery candidates come from latest token profiles and recent boosts;
 * prices, liquidity, market cap and volume are taken from indexed live pairs.
 */
export async function fetchLiveSolanaTokens(): Promise<LiveToken[]> {
  const sources = await Promise.allSettled([
    fetchJson<Profile[]>(API + "/token-profiles/latest/v1"),
    fetchJson<Profile[]>(API + "/token-boosts/latest/v1"),
    fetchJson<Profile[]>(API + "/token-boosts/top/v1"),
  ]);

  const candidates = new Map<string, Profile>();
  for (const source of sources) {
    if (source.status !== "fulfilled" || !Array.isArray(source.value)) continue;
    for (const item of source.value) {
      if (item?.chainId?.toLowerCase() !== "solana" || !item.tokenAddress) continue;
      const address = item.tokenAddress.trim();
      if (address) candidates.set(address, item);
    }
  }

  if (candidates.size === 0) {
    throw new Error("Live Solana token discovery is temporarily unavailable.");
  }

  const addresses = [...candidates.keys()].slice(0, 30);
  const pairs = await fetchJson<Pair[]>(
    API + "/tokens/v1/solana/" + addresses.map(encodeURIComponent).join(",")
  );

  if (!Array.isArray(pairs)) throw new Error("The market data response was not valid.");
  const bestPairs = new Map<string, Pair>();
  for (const pair of pairs) {
    if (pair?.chainId?.toLowerCase() !== "solana") continue;
    const address = pair.baseToken?.address;
    const price = Number(pair.priceUsd);
    if (!address || !candidates.has(address) || !Number.isFinite(price) || price < 0) continue;
    const previous = bestPairs.get(address);
    if (!previous || (pair.liquidity?.usd || 0) > (previous.liquidity?.usd || 0)) {
      bestPairs.set(address, pair);
    }
  }

  const results: LiveToken[] = [];
  for (const [address, pair] of bestPairs) {
    const base = pair.baseToken;
    if (!base?.name || !base.symbol) continue;
    const change = Number(pair.priceChange?.h24);
    const liquidity = Number(pair.liquidity?.usd) || 0;
    const createdAt = Number(pair.pairCreatedAt) || 0;
    const profile = candidates.get(address);
    const age = createdAt ? Date.now() - createdAt : Number.POSITIVE_INFINITY;
    const pct = Number.isFinite(change) ? change : null;
    results.push({
      name: base.name,
      ticker: base.symbol,
      symbol: "◎",
      price: formatPrice(pair.priceUsd),
      change: pct === null ? "—" : (pct > 0 ? "+" : "") + pct.toFixed(2) + "%",
      cap: formatUsd(pair.marketCap ?? pair.fdv),
      volume: formatUsd(Number(pair.volume?.h24) || 0),
      liquidity,
      stage: age < 24 * 60 * 60 * 1000 ? "New launch" : "Live",
      color: COLORS[results.length % COLORS.length],
      initials: base.symbol.slice(0, 1).toUpperCase(),
      curve: 0,
      address,
      image: profileImage(profile, pair),
      url: pair.url || profile?.url || "https://dexscreener.com/solana/" + address,
      createdAt,
    });
  }

  return results.sort((a, b) => b.liquidity - a.liquidity);
}
