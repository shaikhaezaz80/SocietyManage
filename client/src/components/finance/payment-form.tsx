import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CreditCard, Smartphone, Building, DollarSign } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface PaymentFormProps {
  billId: number;
  amount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PaymentForm({ billId, amount, onSuccess, onCancel }: PaymentFormProps) {
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<string>('upi');
  const [transactionId, setTransactionId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const processPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const res = await apiRequest("PATCH", `/api/maintenance-bills/${billId}/payment`, paymentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-bills"] });
      toast({
        title: t('paymentSuccessful'),
        description: t('paymentProcessed'),
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: t('paymentFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePayment = async () => {
    if (!transactionId && paymentMethod !== 'cash') {
      toast({
        title: t('error'),
        description: t('transactionIdRequired'),
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing for different methods
      await simulatePayment(paymentMethod);
      
      const paymentData = {
        amount: amount,
        paymentMethod: paymentMethod,
        transactionId: transactionId || `CASH_${Date.now()}`
      };

      processPaymentMutation.mutate(paymentData);
    } catch (error) {
      toast({
        title: t('paymentFailed'),
        description: t('paymentError'),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const simulatePayment = async (method: string): Promise<void> => {
    // Simulate different payment gateways
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 95% success rate
        if (Math.random() > 0.05) {
          resolve();
        } else {
          reject(new Error('Payment gateway error'));
        }
      }, 2000);
    });
  };

  const paymentMethods = [
    {
      id: 'upi',
      name: t('upiPayment'),
      icon: Smartphone,
      description: t('payWithUPI'),
      popular: true
    },
    {
      id: 'card',
      name: t('cardPayment'),
      icon: CreditCard,
      description: t('payWithCard'),
      popular: false
    },
    {
      id: 'netbanking',
      name: t('netBanking'),
      icon: Building,
      description: t('payWithNetBanking'),
      popular: false
    },
    {
      id: 'cash',
      name: t('cashPayment'),
      icon: DollarSign,
      description: t('payWithCash'),
      popular: false
    }
  ];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {t('paymentAmount')}: ₹{amount.toLocaleString()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium mb-3 block">
            {t('selectPaymentMethod')}
          </Label>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value={method.id} id={method.id} />
                <div className="flex items-center space-x-3 flex-1">
                  <method.icon className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={method.id} className="font-medium cursor-pointer">
                        {method.name}
                      </Label>
                      {method.popular && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          {t('popular')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {paymentMethod !== 'cash' && (
          <div>
            <Label htmlFor="transactionId" className="text-sm font-medium">
              {t('transactionId')} *
            </Label>
            <Input
              id="transactionId"
              placeholder={t('enterTransactionId')}
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('transactionIdHelper')}
            </p>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">{t('paymentSummary')}</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>{t('maintenanceAmount')}:</span>
              <span>₹{amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('convenienceFee')}:</span>
              <span>₹0</span>
            </div>
            <div className="border-t pt-1 mt-2">
              <div className="flex justify-between font-medium">
                <span>{t('totalAmount')}:</span>
                <span>₹{amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isProcessing}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handlePayment}
            className="flex-1 bg-green-500 hover:bg-green-600"
            disabled={isProcessing || processPaymentMutation.isPending}
          >
            {(isProcessing || processPaymentMutation.isPending) && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {isProcessing ? t('processing') : t('payNow')}
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            🔒 {t('securePayment')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
