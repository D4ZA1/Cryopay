import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, QrCode, AlertCircle, Camera, ChevronDown, ChevronUp, Clipboard, Check } from 'lucide-react';
import { submitQrScan, generateBinQr } from '@/lib/api';

type Tab = 'camera' | 'paste';

const MATERIAL_TYPES = ['plastic', 'glass', 'paper', 'metal', 'ewaste'] as const;
type MaterialType = (typeof MATERIAL_TYPES)[number];

// ─── Dev helper: expiry countdown ────────────────────────────────────────────
function useExpiryCountdown(expiresAt: string | null): number | null {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) { setSeconds(null); return; }
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSeconds(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return seconds;
}

// ─── Camera scanner component ─────────────────────────────────────────────────
interface CameraScannerProps {
  onScan: (text: string) => void;
  onError: (msg: string) => void;
}

const CameraScanner = ({ onScan, onError }: CameraScannerProps) => {
  const [initializing, setInitializing] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScanned = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (hasScanned.current) return;
          hasScanned.current = true;
          scanner.stop().then(() => onScan(decodedText)).catch(() => onScan(decodedText));
        },
        undefined
      )
      .then(() => setInitializing(false))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        onError('Camera access denied: ' + msg);
        setInitializing(false);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan, onError]);

  return (
    <div className="space-y-3">
      {initializing && (
        <div className="flex items-center justify-center gap-2 text-slate-500 py-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Starting camera…</span>
        </div>
      )}
      <div
        id="qr-reader"
        className="w-full rounded-lg overflow-hidden border border-slate-200"
        style={{ minHeight: initializing ? 0 : 300 }}
      />
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const RecycleScan = () => {
  const [activeTab, setActiveTab] = useState<Tab>('camera');
  const [qrInput, setQrInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Dev helper state
  const [devOpen, setDevOpen] = useState(false);
  const [devBinId, setDevBinId] = useState('');
  const [devMaterial, setDevMaterial] = useState<MaterialType>('plastic');
  const [devWeight, setDevWeight] = useState<number>(500);
  const [devQrString, setDevQrString] = useState<string | null>(null);
  const [devExpiresAt, setDevExpiresAt] = useState<string | null>(null);
  const [devGenerating, setDevGenerating] = useState(false);
  const [devError, setDevError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const countdown = useExpiryCountdown(devExpiresAt);

  const handleScan = async (text: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await submitQrScan(text.trim());
      if (res.ok && res.data) {
        navigate('/recycle/success', { state: { deposit: res.data } });
      } else {
        setError(res.error || 'QR verification failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteScan = () => {
    if (!qrInput.trim()) { setError('Please paste a QR code string'); return; }
    setError(null);
    handleScan(qrInput.trim());
  };

  const handleCameraError = (msg: string) => setError(msg);

  const handleGenerateQr = async () => {
    if (!devBinId.trim()) { setDevError('Bin ID is required'); return; }
    setDevGenerating(true);
    setDevError(null);
    setDevQrString(null);
    setDevExpiresAt(null);

    const res = await generateBinQr(devBinId.trim(), devMaterial, devWeight);
    setDevGenerating(false);

    if (res.ok && res.data) {
      setDevQrString(res.data.qr_string);
      setDevExpiresAt(res.data.expires_at ?? null);
    } else {
      setDevError(res.error || 'Failed to generate QR');
    }
  };

  const handleUseQr = () => {
    if (!devQrString) return;
    setQrInput(devQrString);
    setActiveTab('paste');
  };

  const handleCopy = async () => {
    if (!devQrString) return;
    await navigator.clipboard.writeText(devQrString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <QrCode className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Scan Recycling Bin</h1>
        <p className="text-slate-500 mt-1">Scan the QR code displayed on the smart bin to earn GRN tokens.</p>
      </div>

      {/* Tab toggle */}
      <div className="flex rounded-lg border border-slate-200 overflow-hidden">
        <button
          onClick={() => { setActiveTab('camera'); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'camera'
              ? 'bg-green-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Camera className="w-4 h-4" />
          Camera Scan
        </button>
        <button
          onClick={() => { setActiveTab('paste'); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'paste'
              ? 'bg-green-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <QrCode className="w-4 h-4" />
          Paste Code
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading overlay for scan submission */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin text-green-600" />
          <span className="text-sm text-green-700 font-medium">Verifying QR code…</span>
        </div>
      )}

      {/* Camera tab */}
      {activeTab === 'camera' && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Point camera at QR code</CardTitle>
          </CardHeader>
          <CardContent>
            <CameraScanner onScan={handleScan} onError={handleCameraError} />
          </CardContent>
        </Card>
      )}

      {/* Paste tab */}
      {activeTab === 'paste' && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paste QR Code String</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qr-input">QR Code (base64url)</Label>
              <Textarea
                id="qr-input"
                placeholder="Paste the QR code string here…"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                rows={4}
                disabled={isLoading}
                className="font-mono text-xs"
              />
            </div>
            <Button
              onClick={handlePasteScan}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading || !qrInput.trim()}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Verify &amp; Claim Tokens
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dev helper — only in development */}
      {import.meta.env.DEV && (
        <Card className="border-dashed border-amber-300 bg-amber-50">
          <CardHeader className="pb-2">
            <button
              onClick={() => setDevOpen((v) => !v)}
              className="flex items-center justify-between w-full text-left"
            >
              <CardTitle className="text-sm text-amber-700">🛠 Dev: Generate Test QR</CardTitle>
              {devOpen ? (
                <ChevronUp className="w-4 h-4 text-amber-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-600" />
              )}
            </button>
          </CardHeader>

          {devOpen && (
            <CardContent className="space-y-4 pt-0">
              {/* Bin ID */}
              <div className="space-y-1">
                <Label htmlFor="dev-bin-id" className="text-xs text-amber-800">Bin ID</Label>
                <Input
                  id="dev-bin-id"
                  placeholder="e.g. bin_001"
                  value={devBinId}
                  onChange={(e) => setDevBinId(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Material type */}
              <div className="space-y-1">
                <Label htmlFor="dev-material" className="text-xs text-amber-800">Material type</Label>
                <select
                  id="dev-material"
                  value={devMaterial}
                  onChange={(e) => setDevMaterial(e.target.value as MaterialType)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {MATERIAL_TYPES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Weight */}
              <div className="space-y-1">
                <Label htmlFor="dev-weight" className="text-xs text-amber-800">Weight (grams)</Label>
                <Input
                  id="dev-weight"
                  type="number"
                  min={1}
                  value={devWeight}
                  onChange={(e) => setDevWeight(Number(e.target.value))}
                  className="text-xs"
                />
              </div>

              {devError && (
                <p className="text-xs text-red-600">{devError}</p>
              )}

              <Button
                onClick={handleGenerateQr}
                disabled={devGenerating}
                size="sm"
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                {devGenerating ? (
                  <><Loader2 className="w-3 h-3 animate-spin mr-1" />Generating…</>
                ) : (
                  'Generate QR from bin'
                )}
              </Button>

              {devQrString && (
                <div className="space-y-2">
                  {/* QR string output */}
                  <div className="relative">
                    <Textarea
                      readOnly
                      value={devQrString}
                      rows={3}
                      className="font-mono text-xs pr-10 bg-white"
                    />
                    <button
                      onClick={handleCopy}
                      className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Clipboard className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Expiry countdown */}
                  {countdown !== null && (
                    <p className={`text-xs font-medium ${countdown < 30 ? 'text-red-600' : 'text-amber-700'}`}>
                      ⏱ Expires in {countdown}s
                    </p>
                  )}

                  <Button
                    onClick={handleUseQr}
                    size="sm"
                    variant="outline"
                    className="w-full border-amber-400 text-amber-800 hover:bg-amber-100"
                  >
                    Use this QR →
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default RecycleScan;
