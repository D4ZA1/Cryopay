import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRightLeft, TrendingUp, TrendingDown, AlertCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { getBlocks, getProfile, createBlock, recordTransaction } from '../lib/api';
import { encryptJSONWithPassword } from '../lib/crypto';
import { getSymKey, setSymKey } from '../lib/symmetricSession';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEthereum } from '../context/EthereumContext';
import { useSendEth } from '../hooks/useSendTransaction';
import UnlockTransactionModal from '../components/UnlockTransactionModal';
import { getErrorMessage } from '@/lib/utils';

// Minimum transaction amounts
const MIN_FIAT_AMOUNT = 1; // $1 minimum
const MIN_CRYPTO_AMOUNT = 0.00000001; // Smallest crypto unit

// Exchange address (Hardhat Account #1) - in production, this would be a real exchange/contract address
const EXCHANGE_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

// Transaction status states
type TransactionStatus = 'idle' | 'connecting' | 'sending' | 'confirming' | 'saving' | 'success' | 'error';

interface TransactionPayload {
  kind: 'buy' | 'sell';
  crypto: string;
  fiatCurrency: string;
  fiatSymbol: string;
  amountFiat: number;
  amountCrypto: number;
  timestamp: string;
  user_id: string;
  from_user_id: string;
  from_thumbprint: string | null;
  to_user_id: string | null;
  to_thumbprint: string | null;
  tx_hash?: string; // Blockchain transaction hash
  blockchain_confirmed?: boolean;
}

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
  const { 
    balance: ethBalance, 
    isConnected: walletConnected, 
    address: walletAddress,
    connect: connectWallet,
    isConnecting: walletConnecting 
  } = useEthereum();
  const { sendEthAndWait } = useSendEth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'sell'
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTOCURRENCIES[0]);
  const [selectedPrice, setSelectedPrice] = useState<number>(selectedCrypto.code === 'USDT' ? 1 : 0);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [amount, setAmount] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  
  // Transaction status
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txError, setTxError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Calculate conversion
  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value && !isNaN(Number(value)) && selectedPrice > 0) {
      const crypto = (parseFloat(value) / selectedPrice).toFixed(8);
      setCryptoAmount(crypto);
    } else {
      setCryptoAmount('');
    }
  };

  const handleCryptoAmountChange = (value: string) => {
    setCryptoAmount(value);
    if (value && !isNaN(Number(value)) && parseFloat(value) > 0) {
      const fiat = (parseFloat(value) * selectedPrice).toFixed(2);
      setAmount(fiat);
    } else {
      setAmount('');
    }
  };

  // Keep price in sync when selected crypto or currency changes
  useEffect(() => {
    const doFetch = async () => {
      try {
        setPriceLoading(true);
        setPriceError(null);
        const cryptoCode = selectedCrypto.code;
        const fiatCode = selectedCurrency.code;
        
        if (cryptoCode === 'USDT') {
          setSelectedPrice(1);
          return;
        }
        
        const symbol = `${cryptoCode}USDT`;
        let priceUsdt: number | null = null;
        try {
          const binanceResp = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
          if (binanceResp.ok) {
            const binData = await binanceResp.json();
            priceUsdt = parseFloat(binData.price);
          }
        } catch (e) {
          console.warn('Binance fetch failed, will try fallback', e);
        }

        if ((fiatCode === 'USD' || fiatCode === 'USDT') && priceUsdt !== null) {
          setSelectedPrice(priceUsdt);
          return;
        }

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
    
    doFetch();
  }, [selectedCrypto, selectedCurrency]);

  // Reset transaction status when tab changes
  useEffect(() => {
    setTxStatus('idle');
    setTxError(null);
    setTxHash(null);
  }, []);

  // pending payload is used when we need to request an unlock key first
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<TransactionPayload | null>(null);

  const proceedWithPayload = async (payload: TransactionPayload, password: string) => {
    setTxStatus('saving');
    
    // compute global previous_hash (across all users) so encryption can be chained globally
    let previous_hash: string | null = null;
    try {
      const blocksRes = await getBlocks();
      if (blocksRes.ok && blocksRes.data?.blocks?.length > 0) {
        previous_hash = blocksRes.data.blocks[0].hash;
      }
    } catch (e) {
      console.warn('failed to query last block', e);
    }

    // Use previous_hash as the salt when encrypting (if available). This ties the ciphertext to the previous block.
    const encrypted = await encryptJSONWithPassword(payload, password, previous_hash || undefined);
    // Hash is computed internally during block creation, we just need the encrypted blob

    const public_summary = {
      kind: payload.kind,
      crypto: payload.crypto,
      amountFiat: payload.amountFiat,
      amountCrypto: payload.amountCrypto,
      fiatCurrency: payload.fiatCurrency,
      timestamp: payload.timestamp,
      tx_hash: payload.tx_hash || null,
      blockchain_confirmed: payload.blockchain_confirmed || false,
    };

    const blockData = JSON.stringify({ public_summary, encrypted_blob: encrypted, user_id: payload.user_id });
    const blockRes = await createBlock(blockData, previous_hash || null);

     if (!blockRes.ok) {
       console.error('failed to insert block', blockRes.error);
       setTxStatus('error');
       setTxError('Failed to persist transaction: ' + getErrorMessage(blockRes.error));
       return;
     }
    
    setTxStatus('success');
    // navigate within SPA to transactions (avoid full reload which can drop auth)
    setTimeout(() => navigate('/transactions'), 1500);
  };

  const handleTransaction = async () => {
    if (!user) return alert('You must be signed in to create a transaction');

    // Reset status
    setTxStatus('idle');
    setTxError(null);
    setTxHash(null);

    // Validate amounts
    const fiatAmount = parseFloat(amount);
    const cryptoAmt = parseFloat(cryptoAmount);

    if (isNaN(fiatAmount) || fiatAmount <= 0) {
      return alert('Please enter a valid fiat amount greater than 0');
    }

    if (isNaN(cryptoAmt) || cryptoAmt <= 0) {
      return alert('Please enter a valid crypto amount greater than 0');
    }

    // Minimum amount validation
    if (fiatAmount < MIN_FIAT_AMOUNT) {
      return alert(`Minimum transaction amount is $${MIN_FIAT_AMOUNT}`);
    }

    if (cryptoAmt < MIN_CRYPTO_AMOUNT) {
      return alert(`Minimum crypto amount is ${MIN_CRYPTO_AMOUNT}`);
    }

    // For SELL transactions - require wallet connection and ETH balance
    if (activeTab === 'sell') {
      // Check if selling ETH (blockchain transaction required)
      if (selectedCrypto.code === 'ETH') {
        // Check wallet connection
        if (!walletConnected) {
          setTxStatus('connecting');
          try {
            await connectWallet();
          } catch (e) {
            setTxStatus('error');
            setTxError('Please connect your wallet to sell ETH');
            return;
          }
        }

        // Check ETH balance
        const ethBalanceNum = ethBalance ? parseFloat(ethBalance) : 0;
        if (ethBalanceNum < cryptoAmt) {
          setTxStatus('error');
          setTxError(`Insufficient ETH balance. You have ${ethBalanceNum.toFixed(6)} ETH but trying to sell ${cryptoAmt.toFixed(6)} ETH`);
          return;
        }

        // Execute blockchain transaction
         setTxStatus('sending');
         try {
           const result = await sendEthAndWait(EXCHANGE_ADDRESS, cryptoAmt.toString());
           setTxHash(result.hash);
           setTxStatus('confirming');
           
           // Record transaction on blockchain_transactions table
           try {
             const amountWei = (cryptoAmt * 1e18).toFixed(0); // Convert ETH to Wei
             const recordRes = await recordTransaction({
               to: EXCHANGE_ADDRESS,
               amount: amountWei,
               currency: 'ETH',
               offChainTxHash: result.hash,
             });
             
             if (!recordRes.ok) {
               console.warn('Failed to record on blockchain_transactions:', recordRes.error);
               // Don't fail the whole transaction just because of this
             }
           } catch (e) {
             console.warn('Error recording blockchain transaction:', e);
           }
           
           // Transaction confirmed - now save to database
           const payload = await buildPayload(fiatAmount, cryptoAmt, result.hash, true);
           await saveTransaction(payload);
         } catch (e: any) {
           console.error('Blockchain transaction failed:', e);
           setTxStatus('error');
           setTxError(e?.message || 'Blockchain transaction failed. No funds were transferred.');
           return;
         }
      } else {
        // Non-ETH crypto - just record in database (no blockchain tx for demo)
        // Use ETH balance if available (real blockchain), otherwise fall back to database balance
        const currentBalance = ethBalance ? parseFloat(ethBalance) : balance;
        if (currentBalance < fiatAmount) {
          return alert(`Insufficient balance. You have $${currentBalance.toFixed(2)} available.`);
        }
        
        const payload = await buildPayload(fiatAmount, cryptoAmt, undefined, false);
        await saveTransaction(payload);
      }
    } else {
      // BUY transaction
      // For buys, we simulate the fiat payment and record the intent
      // In a real system, this would trigger a fiat payment gateway
      
      if (selectedCrypto.code === 'ETH') {
        // Check wallet connection (need address to receive ETH)
        if (!walletConnected) {
          setTxStatus('connecting');
          try {
            await connectWallet();
          } catch (e) {
            setTxStatus('error');
            setTxError('Please connect your wallet to receive ETH');
            return;
          }
        }
        
        // For demo: Record the buy intent. In production, ETH would be sent from exchange to user
        // after fiat payment confirmation
        const payload = await buildPayload(fiatAmount, cryptoAmt, undefined, false);
        payload.to_user_id = user.id;
        // Note: In production, tx_hash would be added after exchange sends ETH to user's wallet
        await saveTransaction(payload);
      } else {
        // Non-ETH crypto - just record in database
        const payload = await buildPayload(fiatAmount, cryptoAmt, undefined, false);
        await saveTransaction(payload);
      }
    }
  };

  const buildPayload = async (fiatAmount: number, cryptoAmt: number, hash?: string, blockchainConfirmed?: boolean): Promise<TransactionPayload> => {
    // Try to fetch current user's profile thumbprint to include as from_thumbprint
    let fromThumb: string | null = null;
    try {
      const profRes = await getProfile();
      if (profRes.ok && profRes.data?.profile) {
        fromThumb = profRes.data.profile.public_key?.thumbprint || null;
      }
    } catch (e) {
      // ignore — optional
    }

    return {
      kind: activeTab === 'buy' ? 'buy' : 'sell',
      crypto: selectedCrypto.code,
      fiatCurrency: selectedCurrency.code,
      fiatSymbol: selectedCurrency.symbol,
      amountFiat: fiatAmount,
      amountCrypto: cryptoAmt,
      timestamp: new Date().toISOString(),
      user_id: user!.id,
      from_user_id: user!.id,
      from_thumbprint: fromThumb,
      // For buy/sell, there's no recipient (it's with the exchange)
      to_user_id: null,
      to_thumbprint: null,
      tx_hash: hash,
      blockchain_confirmed: blockchainConfirmed,
    };
  };

  const saveTransaction = async (payload: TransactionPayload) => {
    const currentKey = getSymKey();
    if (currentKey) {
      // we have an unlocked wallet-derived key in memory — use it
      try {
        await proceedWithPayload(payload, currentKey);
      } catch (e) {
        console.error('persist error', e);
        setTxStatus('error');
        setTxError('Transaction failed: ' + getErrorMessage(e));
      }
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

  // Get status message for display
  const getStatusMessage = () => {
    switch (txStatus) {
      case 'connecting':
        return 'Connecting wallet...';
      case 'sending':
        return 'Sending transaction to blockchain...';
      case 'confirming':
        return 'Waiting for blockchain confirmation...';
      case 'saving':
        return 'Saving to database...';
      case 'success':
        return 'Transaction successful!';
      case 'error':
        return txError || 'Transaction failed';
      default:
        return null;
    }
  };

  const isTransactionInProgress = ['connecting', 'sending', 'confirming', 'saving'].includes(txStatus);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Buy & Sell Crypto</h1>
        <p className="text-slate-400 mt-2">Trade cryptocurrencies with ease</p>
      </div>

      {/* Security Warning for Selling */}
      {activeTab === 'sell' && (
        <Card className="mb-6 border-orange-500/20 bg-orange-500/10 backdrop-blur-xl rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-200">
                <p className="font-semibold mb-1 text-orange-300">Important Security Notice</p>
                <p>Selling cryptocurrency requires identity verification and withdrawal limits apply. Transactions are monitored for security. You can only sell to your verified bank account or exchange wallet to prevent fraud and money laundering.</p>
                {selectedCrypto.code === 'ETH' && (
                  <p className="mt-2 text-orange-300 font-medium">ETH sales require a real blockchain transaction. You will be asked to confirm in your wallet.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Status Banner */}
      {txStatus !== 'idle' && (
        <Card className={`mb-6 backdrop-blur-xl rounded-2xl ${
          txStatus === 'success' ? 'border-green-500/20 bg-green-500/10' :
          txStatus === 'error' ? 'border-red-500/20 bg-red-500/10' :
          'border-cyan-500/20 bg-cyan-500/10'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {isTransactionInProgress && (
                <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
              )}
              {txStatus === 'success' && (
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              )}
              {txStatus === 'error' && (
                <XCircle className="h-5 w-5 text-red-400" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  txStatus === 'success' ? 'text-green-300' :
                  txStatus === 'error' ? 'text-red-300' :
                  'text-cyan-300'
                }`}>
                  {getStatusMessage()}
                </p>
                {txHash && (
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </p>
                )}
              </div>
              {txStatus === 'error' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setTxStatus('idle');
                    setTxError(null);
                  }}
                  className="bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.06]"
                >
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Trading Card */}
        <Card className="lg:col-span-2 bg-slate-900/80 backdrop-blur-xl border-white/[0.06] rounded-2xl">
          <CardHeader>
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeTab === 'buy' ? 'default' : 'outline'}
                onClick={() => setActiveTab('buy')}
                disabled={isTransactionInProgress}
                className={activeTab === 'buy' ? 'flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0' : 'flex-1 bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.06]'}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Buy Crypto
              </Button>
              <Button
                variant={activeTab === 'sell' ? 'default' : 'outline'}
                onClick={() => setActiveTab('sell')}
                disabled={isTransactionInProgress}
                className={activeTab === 'sell' ? 'flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0' : 'flex-1 bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.06]'}
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Sell Crypto
              </Button>
            </div>
            <CardTitle className="text-white">
              {activeTab === 'buy' ? 'Buy' : 'Sell'} Cryptocurrency
            </CardTitle>
            <CardDescription className="text-slate-400">
              {activeTab === 'buy' ? 'Purchase crypto with your preferred currency' : 'Sell crypto to your verified account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cryptocurrency Selection */}
            <div className="space-y-2">
              <Label className="text-slate-400">Select Cryptocurrency</Label>
              <div className="grid grid-cols-3 gap-2">
                {CRYPTOCURRENCIES.map((crypto) => (
                  <Button
                    key={crypto.code}
                    variant={selectedCrypto.code === crypto.code ? 'default' : 'outline'}
                    onClick={() => setSelectedCrypto(crypto)}
                    disabled={isTransactionInProgress}
                    className={selectedCrypto.code === crypto.code ? 'h-auto py-3 flex flex-col items-center bg-emerald-500 hover:bg-emerald-600 text-white border-0' : 'h-auto py-3 flex flex-col items-center bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.06]'}
                  >
                    <span className="font-bold">{crypto.code}</span>
                    <span className="text-xs opacity-70">{crypto.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Currency Selection */}
            <div className="space-y-2">
              <Label className="text-slate-400">{activeTab === 'buy' ? 'Pay With' : 'Receive In'}</Label>
              <div className="grid grid-cols-4 gap-2">
                {CURRENCIES.map((currency) => (
                  <Button
                    key={currency.code}
                    variant={selectedCurrency.code === currency.code ? 'default' : 'outline'}
                    onClick={() => setSelectedCurrency(currency)}
                    disabled={isTransactionInProgress}
                    className={selectedCurrency.code === currency.code ? 'h-auto py-2 bg-emerald-500 hover:bg-emerald-600 text-white border-0' : 'h-auto py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.06]'}
                  >
                    <span className="font-semibold">{currency.code}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fiat-amount" className="text-slate-400">{activeTab === 'buy' ? 'You Pay' : 'You Receive'}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{selectedCurrency.symbol}</span>
                  <Input 
                    id="fiat-amount" 
                    type="number" 
                    placeholder="0.00" 
                    value={amount} 
                    onChange={(e) => handleAmountChange(e.target.value)} 
                    disabled={isTransactionInProgress}
                    className="pl-12 text-lg h-12 bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRightLeft className="h-6 w-6 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crypto-amount" className="text-slate-400">{activeTab === 'buy' ? 'You Get' : 'You Sell'}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{selectedCrypto.code}</span>
                  <Input 
                    id="crypto-amount" 
                    type="number" 
                    placeholder="0.00000000" 
                    value={cryptoAmount} 
                    onChange={(e) => handleCryptoAmountChange(e.target.value)} 
                    disabled={isTransactionInProgress}
                    className="pl-16 text-lg h-12 bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500" 
                  />
                </div>
              </div>
            </div>

            {/* Transaction Summary */}
            {amount && cryptoAmount && (
              <div className="bg-slate-800/50 border border-white/[0.06] p-4 rounded-2xl space-y-2">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-400">Exchange Rate</span>
                  <div className="text-right">
                    {priceLoading ? (
                      <span className="text-sm text-slate-500">Fetching price...</span>
                    ) : priceError ? (
                      <span className="text-sm text-red-400">{priceError}</span>
                    ) : (
                      <span className="font-medium text-white">1 {selectedCrypto.code} = {selectedCurrency.symbol}{selectedPrice.toLocaleString(undefined, { maximumFractionDigits: 8 })}</span>
                    )}
                    <div className="text-xs text-slate-500">Source: Binance</div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Transaction Fee (1%)</span>
                  <span className="font-medium text-white">{selectedCurrency.symbol}{(parseFloat(amount) * 0.01).toFixed(2)}</span>
                </div>
                {activeTab === 'sell' && selectedCrypto.code === 'ETH' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Blockchain TX</span>
                    <span className="font-medium text-cyan-400">Real ETH Transfer</span>
                  </div>
                )}
                <div className="border-t border-white/[0.06] pt-2 flex justify-between">
                  <span className="font-semibold text-white">Total</span>
                  <span className="font-bold text-lg text-emerald-400">{selectedCurrency.symbol}{(parseFloat(amount) * 1.01).toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button 
              onClick={handleTransaction} 
              disabled={!amount || !cryptoAmount || parseFloat(amount) <= 0 || parseFloat(cryptoAmount) <= 0 || isTransactionInProgress} 
              className="w-full h-12 text-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTransactionInProgress ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {getStatusMessage()}
                </>
              ) : (
                activeTab === 'buy' ? 'Buy Now' : 'Sell Now'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats Sidebar */}
        <div className="space-y-4">
          <Card className="bg-slate-900/80 backdrop-blur-xl border-white/[0.06] rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">YOUR BALANCE</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{balance ? `$${balance.toFixed(2)}` : '$0.00'}</p>
              <p className="text-sm text-slate-500 mt-1">Fiat balance</p>
              {walletConnected && ethBalance && (
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <p className="text-lg font-bold text-cyan-400">{parseFloat(ethBalance).toFixed(6)} ETH</p>
                  <p className="text-sm text-slate-500">Connected wallet</p>
                  <p className="text-xs text-slate-600 font-mono mt-1">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</p>
                </div>
              )}
              {!walletConnected && (
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <p className="text-sm text-slate-500 mb-2">Connect wallet for ETH trading</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={connectWallet}
                    disabled={walletConnecting}
                    className="w-full bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.06]"
                  >
                    {walletConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 backdrop-blur-xl border-white/[0.06] rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm text-white">Top Cryptos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {CRYPTOCURRENCIES.slice(0, 4).map((crypto) => (
                <div key={crypto.code} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white">{crypto.code}</p>
                    <p className="text-xs text-slate-500">{crypto.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">{crypto.code === selectedCrypto.code ? `${selectedCurrency.symbol}${selectedPrice.toLocaleString()}` : '—'}</p>
                    <p className="text-xs text-emerald-400">+2.5%</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {activeTab === 'sell' && selectedCrypto.code === 'ETH' && (
            <Card className="border-cyan-500/20 bg-cyan-500/10 backdrop-blur-xl rounded-2xl">
              <CardContent className="pt-6">
                <p className="text-sm text-cyan-200">
                  <strong className="text-cyan-300">Real Blockchain TX:</strong> Selling ETH will send a real transaction to the exchange address. You'll confirm this in MetaMask.
                </p>
                <p className="text-xs text-cyan-400 mt-2 font-mono">
                  Exchange: {EXCHANGE_ADDRESS.slice(0, 10)}...{EXCHANGE_ADDRESS.slice(-8)}
                </p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'sell' && selectedCrypto.code !== 'ETH' && (
            <Card className="border-cyan-500/20 bg-cyan-500/10 backdrop-blur-xl rounded-2xl">
              <CardContent className="pt-6">
                <p className="text-sm text-cyan-200"><strong className="text-cyan-300">KYC Required:</strong> To sell cryptocurrency, you must complete identity verification and link a verified bank account.</p>
                <Button variant="outline" className="w-full mt-4 bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.06]">Verify Account</Button>
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
