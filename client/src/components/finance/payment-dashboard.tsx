import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Download,
  Calendar
} from "lucide-react";

interface PaymentDashboardProps {
  userRole: string;
}

export default function PaymentDashboard({ userRole }: PaymentDashboardProps) {
  // Mock data - replace with real API calls
  const financialSummary = {
    totalIncome: 450000,
    totalExpenses: 285000,
    balance: 165000,
    monthlyCollection: 380000,
    pendingAmount: 45000,
    collectionRate: 88
  };

  const recentTransactions = [
    {
      id: 1,
      type: "income",
      description: "Maintenance Collection - A Block",
      amount: 25000,
      date: "2024-01-15",
      method: "UPI"
    },
    {
      id: 2,
      type: "expense",
      description: "Electricity Bill Payment",
      amount: 12500,
      date: "2024-01-14",
      method: "Bank Transfer"
    },
    {
      id: 3,
      type: "expense",
      description: "Security Staff Salary",
      amount: 60000,
      date: "2024-01-13",
      method: "Cash"
    }
  ];

  const monthlyBreakdown = [
    { category: "Staff Salaries", amount: 120000, percentage: 42 },
    { category: "Utilities", amount: 65000, percentage: 23 },
    { category: "Maintenance", amount: 45000, percentage: 16 },
    { category: "Security", amount: 35000, percentage: 12 },
    { category: "Others", amount: 20000, percentage: 7 }
  ];

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{(financialSummary.totalIncome / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  ₹{(financialSummary.totalExpenses / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Net Balance</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{(financialSummary.balance / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{(financialSummary.monthlyCollection / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Collection Rate</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {financialSummary.collectionRate}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={financialSummary.collectionRate} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Collected</p>
                <p className="font-semibold text-green-600">
                  ₹{((financialSummary.monthlyCollection - financialSummary.pendingAmount) / 1000).toFixed(0)}K
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="font-semibold text-orange-600">
                  ₹{(financialSummary.pendingAmount / 1000).toFixed(0)}K
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Target</p>
                <p className="font-semibold text-blue-600">
                  ₹{(financialSummary.monthlyCollection / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Transactions</span>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === "income" ? "bg-green-100" : "bg-red-100"
                  }`}>
                    {transaction.type === "income" ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(transaction.date).toLocaleDateString()} • {transaction.method}
                    </p>
                  </div>
                </div>
                <div className={`font-semibold ${
                  transaction.type === "income" ? "text-green-600" : "text-red-600"
                }`}>
                  {transaction.type === "income" ? "+" : "-"}₹{transaction.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expense Breakdown (Admin/Auditor view) */}
      {(userRole === "admin" || userRole === "auditor") && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyBreakdown.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.category}</span>
                    <span className="font-medium">₹{item.amount.toLocaleString()} ({item.percentage}%)</span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
