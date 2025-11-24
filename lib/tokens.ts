import tokenListRaw from '../data/token-list.json'

export type Token = {
  id: string
  symbol: string
  name: string
  dexscreenerNetwork?: string
  dexscreenerPair?: string
}

// Yardımcı: Adres Temizleyici (Sadece 0x... alır)
function cleanAddress(input?: string): string | undefined {
  if (!input) return undefined;
  const match = input.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0].toLowerCase() : undefined;
}

export function parseDexscreenerLink(input?: string) {
  if (!input) return {}
  try {
    const url = new URL(input)
    const parts = url.pathname.split('/')
    if (parts.length >= 3) {
      return { 
        network: parts[1].toLowerCase(), 
        pair: cleanAddress(parts[2]) 
      }
    }
  } catch {}
  return {}
}

type RawRow = { [key: string]: any }

// Token ID güvenli hale getirilir (Ticker kullanılır)
function sanitizeId(input: string): string {
  const base = (input || '').toLowerCase().replace(/^\$+/, '')
  return base.replace(/[^a-z0-9]+/g, '') || 'token'
}

function rowToToken(row: RawRow): Token {
  const name = String(row['CARD NAME / TOKEN NAME'] || row['name'] || '').trim()
  const symbol = String(row['TICKER'] || row['symbol'] || '').replace(/\$/g, '').trim().toUpperCase()
  
  // Link temizliği
  const rawLink = String(row['GECKO TERMINAL POOL LINK'] || row['dexscreenerPair'] || '').trim()
  const cleanPair = cleanAddress(rawLink)
  const network = 'base' 

  const derivedId = sanitizeId(symbol) || sanitizeId(name)

  return {
    id: derivedId,
    symbol: symbol || derivedId.toUpperCase(),
    name: name,
    dexscreenerNetwork: network,
    dexscreenerPair: cleanPair,
  }
}

const jsonRows: RawRow[] = Array.isArray((tokenListRaw as any)?.Sayfa1)
  ? (tokenListRaw as any).Sayfa1
  : []

export const jsonTokens: Token[] = jsonRows.map(rowToToken)

// Virtual Token Seed (Eğer listede yoksa ekle)
const seedTokens: Token[] = [
  {
    id: 'virtual',
    symbol: 'VIRTUAL',
    name: 'Virtual Protocol',
    dexscreenerNetwork: 'base',
    dexscreenerPair: '0x0b3e328455c4059eeb9e3743215830db5a980191' // Virtual Contract/Pool
  },
]

const existingIds = new Set(jsonTokens.map(t => t.id))

export const TOKENS: Token[] = [
  ...jsonTokens,
  ...seedTokens.filter(t => !existingIds.has(t.id)),
]

export const TOKEN_MAP: Record<string, Token> = Object.fromEntries(
  TOKENS.map(t => [t.id, t])
)
