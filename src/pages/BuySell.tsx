import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRightLeft, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase';
import { encryptJSONWithPassword, sha256Hex } from '../lib/crypto';
import { getSymKey, setSymKey } from '../lib/symmetricSession';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UnlockTransactionModal from '../components/UnlockTransactionModal';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'USDT', symbol: 'USDT', name: 'Tether' },
];

const CRYPTOCURRENCIES = [
  { code: 'BTC', name: 'Bitcoin' },
  { code: 'ETH', name: 'Ethereum' },
  { code: 'USDT', name: 'Tether' },
  { code: 'BNB', name: 'Binance Coin' },
  { code: 'SOL', name: 'Solana' },
  { code: 'ADA', name: 'Cardano' },
];

const BuySell = () => {
  const { user, balance } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'sell'
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTOCURRENCIES[0]);
  const [selectedPrice, setSelectedPrice] = useState<number>(selectedCrypto.code === 'USDT' ? 1 : 0);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [amount, setAmount] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');

  // Calculate conversion
  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value && !isNaN(Number(value))) {
      const crypto = (parseFloat(value) / selectedPrice).toFixed(8);
      setCryptoAmount(crypto);
    } else {
      setCryptoAmount('');
    }
  };

  const handleCryptoAmountChange = (value: string) => {
    setCryptoAmount(value);
    if (value && !isNaN(Number(value))) {
      const fiat = (parseFloat(value) * selectedPrice).toFixed(2);
      setAmount(fiat);
    } else {
      setAmount('');
    }
  };

  // Fetch latest price from Binance (USDT pair) and convert to selected fiat via exchangerate.host if needed
  const fetchPrice = async (cryptoCode: string, fiatCode: string) => {
    try {
      setPriceLoading(true);
      setPriceError(null);
      if (cryptoCode === 'USDT') {
        setSelectedPrice(1);
        return;
      }
      // Binance provides many spot pairs but most commonly price against USDT (≈ USD). We'll:
      // 1) Try Binance price for <CRYPTO>USDT
      // 2) If fiat is USD/USDT use that value directly
      // 3) If fiat is different, try exchangerate.host to convert USD -> fiat
      // 4) Fallback: query CoinGecko for the direct price in the selected fiat

      const symbol = `${cryptoCode}USDT`;
      let priceUsdt: number | null = null;
      try {
        const binanceResp = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
        if (binanceResp.ok) {
          const binData = await binanceResp.json();
          priceUsdt = parseFloat(binData.price);
        }
      } catch (e) {
        // ignore and fallback to CoinGecko later
        console.warn('Binance fetch failed, will try fallback', e);
      }

      // If fiat is USD/USDT and we have a Binance price, return it
      if ((fiatCode === 'USD' || fiatCode === 'USDT') && priceUsdt !== null) {
        setSelectedPrice(priceUsdt);
        return;
      }

      // attempt to convert USD price -> fiat using exchangerate.host if we have a USD price
      if (priceUsdt !== null) {
        try {
          const fxResp = await fetch(`https://api.exchangerate.host/convert?from=USD&to=${fiatCode}&amount=1`);
          if (fxResp.ok) {
            const fxData = await fxResp.json();
            const rate = fxData && fxData.result ? fxData.result : null;
            if (rate) {
              setSelectedPrice(priceUsdt * rate);
              return;
            }
          }
        } catch (e) {
          console.warn('FX conversion failed, will try CoinGecko', e);
        }
      }

      // Fallback: ask CoinGecko for a direct price in the target fiat. Map common symbols to CoinGecko ids.
      try {
        const cgMap: Record<string, string> = {
          BTC: 'bitcoin',
          ETH: 'ethereum',
          USDT: 'tether',
          BNB: 'binancecoin',
          SOL: 'solana',
          ADA: 'cardano'
        };
        const id = cgMap[cryptoCode] || cryptoCode.toLowerCase();
        const fiatLower = fiatCode.toLowerCase();
        const cgResp = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=${encodeURIComponent(fiatLower)}`);
        if (cgResp.ok) {
          const cgData = await cgResp.json();
          const val = cgData && cgData[id] ? cgData[id][fiatLower] : null;
          if (val) {
            setSelectedPrice(Number(val));
            return;
          }
        }
      } catch (e) {
        console.warn('CoinGecko fallback failed', e);
      }

      throw new Error('Failed to fetch price for selected crypto/currency');
    } catch (e: any) {
      console.warn('price fetch failed', e);
      setPriceError(e?.message || 'Price fetch error');
    } finally {
      setPriceLoading(false);
    }
  };

  // Keep price in sync when selected crypto or currency changes
  useEffect(() => {
    fetchPrice(selectedCrypto.code, selectedCurrency.code).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCrypto, selectedCurrency]);

  // pending payload is used when we need to request an unlock key first
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any | null>(null);

  const proceedWithPayload = async (payload: any, password: string) => {
    // compute global previous_hash (across all users) so encryption can be chained globally
    let previous_hash: string | null = null;
    try {
      const { data: last, error: lastErr } = await supabase
        .from('blocks')
        .select('hash')
        .order('id', { ascending: false })
        .limit(1);
      if (!lastErr && last && (last as any).length > 0) previous_hash = (last as any)[0].hash;
    } catch (e) {
      console.warn('failed to query last block', e);
    }

    // Use previous_hash as the salt when encrypting (if available). This ties the ciphertext to the previous block.
    const encrypted = await encryptJSONWithPassword(payload, password, previous_hash || undefined);
    const hash = await sha256Hex(encrypted.ciphertext);

    const public_summary = {
      kind: payload.kind,
      crypto: payload.crypto,
      amountFiat: payload.amountFiat,
      amountCrypto: payload.amountCrypto,
      fiatCurrency: payload.fiatCurrency,
      timestamp: payload.timestamp,
    };

    const { error } = await supabase.from('blocks').insert([
      {
        data: { public_summary, encrypted_blob: encrypted, user_id: payload.user_id },
        previous_hash,
        hash,
        user_id: payload.user_id, // top-level user_id for easier server-side querying and RLS
      },
    ]);

    if (error) {
      console.error('failed to insert block', error);
      alert('Failed to persist transaction: ' + error.message);
      return;
    }
    // navigate within SPA to transactions (avoid full reload which can drop auth)
    navigate('/transactions');
  };

  const handleTransaction = async () => {
    if (!user) return alert('You must be signed in to create a transaction');

    // Try to fetch current user's profile thumbprint to include as from_thumbprint
    let fromThumb: string | null = null;
    try {
      const { data: profs } = await supabase.from('profiles').select('public_key').eq('id', user.id).limit(1);
      if (profs && (profs as any).length) fromThumb = (profs as any)[0]?.public_key?.thumbprint || null;
    } catch (e) {
      // ignore — optional
    }

    const payload = {
      kind: activeTab === 'buy' ? 'buy' : 'sell',
      crypto: selectedCrypto.code,
      fiatCurrency: selectedCurrency.code,
      fiatSymbol: selectedCurrency.symbol,
      amountFiat: parseFloat(amount),
      amountCrypto: parseFloat(cryptoAmount),
      timestamp: new Date().toISOString(),
      user_id: user.id,
      from_thumbprint: fromThumb,
    };

    const currentKey = getSymKey();
    if (currentKey) {
      // we have an unlocked wallet-derived key in memory — use it
      proceedWithPayload(payload, currentKey).catch((e) => {
        console.error('persist error', e);
        alert('Transaction failed: ' + (e?.message || e));
      });
    } else {
      // ask user to unlock (provide wallet-derived key)
      setPendingPayload(payload);
      setUnlockOpen(true);
    }
  };

  const handleUnlocked = async (password: string) => {
    // store in-memory
    setSymKey(password);
    setUnlockOpen(false);
    if (pendingPayload) {
      await proceedWithPayload(pendingPayload, password);
      setPendingPayload(null);
    }
  };


  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Buy & Sell Crypto</h1>
        <p className="text-slate-600 mt-2">Trade cryptocurrencies with ease</p>
      </div>

      {/* Security Warning for Selling */}
      {activeTab === 'sell' && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-semibold mb-1">Important Security Notice</p>
                <p>Selling cryptocurrency requires identity verification and withdrawal limits apply. Transactions are monitored for security. You can only sell to your verified bank account or exchange wallet to prevent fraud and money laundering.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Trading Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeTab === 'buy' ? 'default' : 'outline'}
                onClick={() => setActiveTab('buy')}
                className="flex-1"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Buy Crypto
              </Button>
              <Button
                variant={activeTab === 'sell' ? 'default' : 'outline'}
                onClick={() => setActiveTab('sell')}
                className="flex-1"
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Sell Crypto
              </Button>
            </div>
            <CardTitle>
              {activeTab === 'buy' ? 'Buy' : 'Sell'} Cryptocurrency
            </CardTitle>
            <CardDescription>
              {activeTab === 'buy' ? 'Purchase crypto with your preferred currency' : 'Sell crypto to your verified account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cryptocurrency Selection */}
            <div className="space-y-2">
              <Label>Select Cryptocurrency</Label>
              <div className="grid grid-cols-3 gap-2">
                {CRYPTOCURRENCIES.map((crypto) => (
                  <Button
                    key={crypto.code}
                    variant={selectedCrypto.code === crypto.code ? 'default' : 'outline'}
                    onClick={() => setSelectedCrypto(crypto)}
                    className="h-auto py-3 flex flex-col items-center"
                  >
                    <span className="font-bold">{crypto.code}</span>
                    <span className="text-xs opacity-70">{crypto.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Currency Selection */}
            <div className="space-y-2">
              <Label>{activeTab === 'buy' ? 'Pay With' : 'Receive In'}</Label>
              <div className="grid grid-cols-4 gap-2">
                {CURRENCIES.map((currency) => (
                  <Button
                    key={currency.code}
                    variant={selectedCurrency.code === currency.code ? 'default' : 'outline'}
                    onClick={() => setSelectedCurrency(currency)}
                    className="h-auto py-2"
                  >
                    <span className="font-semibold">{currency.code}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fiat-amount">{activeTab === 'buy' ? 'You Pay' : 'You Receive'}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{selectedCurrency.symbol}</span>
                  <Input id="fiat-amount" type="number" placeholder="0.00" value={amount} onChange={(e) => handleAmountChange(e.target.value)} className="pl-12 text-lg h-12" />
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRightLeft className="h-6 w-6 text-slate-400" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crypto-amount">{activeTab === 'buy' ? 'You Get' : 'You Sell'}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{selectedCrypto.code}</span>
                  <Input id="crypto-amount" type="number" placeholder="0.00000000" value={cryptoAmount} onChange={(e) => handleCryptoAmountChange(e.target.value)} className="pl-16 text-lg h-12" />
                </div>
              </div>
            </div>

            {/* Transaction Summary */}
            {amount && cryptoAmount && (
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-600">Exchange Rate</span>
                  <div className="text-right">
                    {priceLoading ? (
                      <span className="text-sm text-slate-500">Fetching price...</span>
                    ) : priceError ? (
                      <span className="text-sm text-red-600">{priceError}</span>
                    ) : (
                      <span className="font-medium">1 {selectedCrypto.code} = {selectedCurrency.symbol}{selectedPrice.toLocaleString(undefined, { maximumFractionDigits: 8 })}</span>
                    )}
                    <div className="text-xs text-slate-400">Source: Binance</div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Transaction Fee (1%)</span>
                  <span className="font-medium">{selectedCurrency.symbol}{(parseFloat(amount) * 0.01).toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">{selectedCurrency.symbol}{(parseFloat(amount) * 1.01).toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button onClick={handleTransaction} disabled={!amount || !cryptoAmount} className="w-full h-12 text-lg">
              {activeTab === 'buy' ? 'Buy Now' : 'Sell Now'}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">YOUR BALANCE</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{balance ? `$${balance.toFixed(2)}` : '$0.00'}</p>
              <p className="text-sm text-slate-500 mt-1">Available to trade</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top Cryptos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {CRYPTOCURRENCIES.slice(0, 4).map((crypto) => (
                <div key={crypto.code} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{crypto.code}</p>
                    <p className="text-xs text-slate-500">{crypto.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{crypto.code === selectedCrypto.code ? `${selectedCurrency.symbol}${selectedPrice.toLocaleString()}` : '—'}</p>
                    <p className="text-xs text-green-600">+2.5%</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {activeTab === 'sell' && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-sm text-blue-800"><strong>KYC Required:</strong> To sell cryptocurrency, you must complete identity verification and link a verified bank account.</p>
                <Button variant="outline" className="w-full mt-4">Verify Account</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <UnlockTransactionModal isOpen={unlockOpen} onClose={() => setUnlockOpen(false)} onUnlocked={handleUnlocked} />
    </div>
  );
};

export default BuySell;