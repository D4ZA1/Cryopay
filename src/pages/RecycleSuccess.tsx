import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Leaf, ArrowRight, History } from 'lucide-react';

const MATERIAL_LABELS: Record<string, string> = {
  plastic: '♻️ Plastic',
  glass: '🫙 Glass',
  paper: '📄 Paper',
  metal: '🔩 Metal',
  ewaste: '⚡ E-Waste',
};

const RecycleSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const deposit = location.state?.deposit as {
    tokens_awarded: number;
    material_type: string;
    weight_grams: number;
    dynamic_tokens_per_kg: number;
    deposit_id: string;
  } | undefined;

  if (!deposit) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <p className="text-slate-500">No deposit data found.</p>
        <Button onClick={() => navigate('/recycle/scan')} className="mt-4">Scan Again</Button>
      </div>
    );
  }

  const weightKg = (deposit.weight_grams / 1000).toFixed(2);

  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Deposit Verified!</h1>
        <p className="text-slate-500 mt-1">Your recycling has been recorded on-chain.</p>
      </div>

      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Leaf className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">GRN Tokens Earned</span>
            </div>
            <p className="text-5xl font-bold text-green-700">+{deposit.tokens_awarded}</p>
            <p className="text-sm text-green-600 mt-1">GRN</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Material</span>
            <span className="font-medium">{MATERIAL_LABELS[deposit.material_type] ?? deposit.material_type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Weight</span>
            <span className="font-medium">{weightKg} kg ({deposit.weight_grams}g)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Rate</span>
            <span className="font-medium">{deposit.dynamic_tokens_per_kg} GRN/kg</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Deposit ID</span>
            <span className="font-mono text-xs text-slate-400">{deposit.deposit_id.slice(0, 12)}...</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate('/recycle/history')}
        >
          <History className="h-4 w-4 mr-2" />
          View History
        </Button>
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={() => navigate('/recycle/scan')}
        >
          Scan Again
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="text-center">
        <Link to="/recycle/redeem" className="text-sm text-green-600 hover:underline">
          Redeem tokens for vouchers →
        </Link>
      </div>
    </div>
  );
};

export default RecycleSuccess;
