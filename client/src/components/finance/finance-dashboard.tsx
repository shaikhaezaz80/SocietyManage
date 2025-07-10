import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Users, Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";

export default function FinanceDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();

  const { data: financialSummary, isLoading } = useQuery({
    queryKey: ["/api/finances"],
    enabled: user?.role === 'admin' || user?.role === 'auditor'
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ["/api/finances", "recent"],
    enabled: user?.role === 'admin' || user?.role === 'auditor'
  });

  // Mock data for demonstration
  const mockSummary = {
    totalBalance: 1245000,
    monthlyIncome: 250000,
    monthlyExpenses: 165000,
    pendingDues: 45000,
    reserveFund: 500000,
    collectionRate: 87
  };

  const mockTransactions = [
    {
      id: 1,
      type: 'income',
      category: 'maintenance',
      amount: 15000,
      description: 'Maintenance Collection - A-101, A-102, B-201',
      date: new Date().toISOString(),
      paymentMethod: 'UPI'
    },
    {
      id: 2,
      type: 'expense',
      category: 'utilities',
      amount: 12500,
      description: 'Electricity Bill Payment',
      date: new Date().toISOString(),
      paymentMethod: 'Bank Transfer'
    },
    {
      id: 3,
      type: 'expense',
      category: 'staff_salary',
      amount: 60000,
      description: 'Monthly Salary - 4 Security Guards',
      date: new Date().toISOString(),
      paymentMethod: 'Bank Transfer'
    }
  ];

  const expenseCategories = [
    { name: t('staffSalaries'), amount: 80000, percentage: 48, color: 'bg-blue-500' },
    { name: t('utilities'), amount: 35000, percentage: 21, color: 'bg-yellow-500' },
    { name: t('maintenance'), amount: 25000, percentage: 15, color: 'bg-red-500' },
    { name: t('cleaning'), amount: 15000, percentage: 9, color: 'bg-green-500' },
    { name: t('insurance'), amount: 10000, percentage: 6, color: 'bg-purple-500' }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const summary = financialSummary || mockSummary;
  const transactions = recentTransactions || mockTransactions;

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('totalBalance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                ₹{(summary.totalBalance / 100000).toFixed(1)}L
              </p>
              <p className="text-sm text-gray-600 mt-1">{t('societyBalance')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('monthlyIncome')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                ₹{(summary.monthlyIncome / 100000).toFixed(1)}L
              </p>
              <div className="flex items-center justify-center space-x-1 mt-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <p className="text-sm text-green-600">+8% vs last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('monthlyExpenses')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                ₹{(summary.monthlyExpenses / 100000).toFixed(1)}L
              </p>
              <div className="flex items-center justify-center space-x-1 mt-1">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600">+3% vs last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-lg font-bold">₹{(summary.pendingDues / 1000).toFixed(0)}K</p>
            <p className="text-sm text-gray-600">{t('pendingDues')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-lg font-bold">{summary.collectionRate}%</p>
            <p className="text-sm text-gray-600">{t('collectionRate')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-lg font-bold">₹{(summary.reserveFund / 100000).toFixed(0)}L</p>
            <p className="text-sm text-gray-600">{t('reserveFund')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-lg font-bold">₹{((summary.monthlyIncome - summary.monthlyExpenses) / 1000).toFixed(0)}K</p>
            <p className="text-sm text-gray-600">{t('netIncome')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('recentTransactions')}</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            {t('export')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction: any) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{t(transaction.category)}</span>
                      <span>•</span>
                      <span>{transaction.paymentMethod}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t('monthlyExpenseBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenseCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded ${category.color}`}></div>
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">₹{category.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">({category.percentage}%)</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
