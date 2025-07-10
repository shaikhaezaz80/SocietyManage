import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { 
  CreditCard,
  Download,
  Search,
  Bell,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Smartphone,
  Building,
  Users,
  Receipt
} from "lucide-react";

export default function Maintenance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ["/api/finance/bills", statusFilter, monthFilter, yearFilter],
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/finance/expenses"],
  });

  const paymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, transactionId: `TXN${Date.now()}` };
    },
    onSuccess: (data) => {
      setShowPaymentModal(false);
      setSelectedBill(null);
      toast({
        title: "Payment Successful",
        description: `Transaction ID: ${data.transactionId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/bills"] });
    },
    onError: () => {
      toast({
        title: "Payment Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    },
  });

  const handlePayment = (bill: any, method: string) => {
    paymentMutation.mutate({
      billId: bill.id,
      amount: bill.totalAmount,
      method,
    });
  };

  // Mock data for demonstration
  const mockBills = [
    {
      id: 1,
      flatId: user?.flatNumber || "A-101",
      month: 11,
      year: 2024,
      baseAmount: 3500,
      lateFee: 0,
      totalAmount: 3500,
      status: "pending",
      dueDate: "2024-11-05",
      createdAt: "2024-11-01"
    },
    {
      id: 2,
      flatId: user?.flatNumber || "A-101", 
      month: 10,
      year: 2024,
      baseAmount: 3500,
      lateFee: 500,
      totalAmount: 4000,
      status: "overdue",
      dueDate: "2024-10-05",
      createdAt: "2024-10-01"
    },
    {
      id: 3,
      flatId: user?.flatNumber || "A-101",
      month: 9,
      year: 2024,
      baseAmount: 3500,
      lateFee: 0,
      totalAmount: 3500,
      status: "paid",
      dueDate: "2024-09-05",
      paidDate: "2024-09-03",
      paymentMethod: "upi",
      createdAt: "2024-09-01"
    }
  ];

  const getFinancialOverview = () => {
    const currentMonth = bills.filter((b: any) => b.month === monthFilter && b.year === yearFilter);
    const totalDue = mockBills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + b.totalAmount, 0);
    const overdue = mockBills.filter(b => b.status === 'overdue').reduce((sum, b) => sum + b.totalAmount, 0);
    
    return {
      monthlyAmount: 3500,
      totalDue,
      overdue,
      lastPayment: mockBills.find(b => b.status === 'paid')
    };
  };

  const overview = getFinancialOverview();

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: "secondary",
      pending: "default",
      overdue: "destructive",
      partial: "outline"
    } as const;
    
    return variants[status as keyof typeof variants] || "outline";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'pending': return 'text-orange-600';
      case 'overdue': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      
      <main className="lg:ml-64 pt-16 pb-20 lg:pb-4">
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold">Maintenance & Billing</h1>
              <p className="text-muted-foreground">
                Manage your maintenance payments and view billing history
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
              {user?.role === "admin" && (
                <Button className="bg-whatsapp hover:bg-whatsapp-dark" size="sm">
                  <Bell className="w-4 h-4 mr-2" />
                  Send Reminders
                </Button>
              )}
            </div>
          </div>

          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Amount</p>
                    <p className="text-2xl font-bold">₹{overview.monthlyAmount.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Due</p>
                    <p className="text-2xl font-bold text-orange-600">₹{overview.totalDue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">₹{overview.overdue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Payment</p>
                    <p className="text-lg font-bold text-green-600">₹{overview.lastPayment?.totalAmount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Sep 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Payment Actions */}
          {overview.totalDue > 0 && (
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-orange-800">Outstanding Amount</h3>
                    <p className="text-sm text-orange-700 mb-2">
                      You have ₹{overview.totalDue.toLocaleString()} pending payment
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pay now to avoid additional late fees
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedBill(mockBills.find(b => b.status !== 'paid'));
                      setShowPaymentModal(true);
                    }}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Methods Info */}
          {user?.role === "admin" && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Collection Summary</CardTitle>
                <CardDescription>Society-wide payment statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Collection Rate</p>
                    <p className="text-2xl font-bold text-green-600">87%</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Collected</p>
                    <p className="text-2xl font-bold text-blue-600">₹5.2L</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">₹45K</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">₹12K</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Payment Methods Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">UPI Payments</span>
                      </div>
                      <span className="text-sm font-medium">₹2,45,000 (47%)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Online Banking</span>
                      </div>
                      <span className="text-sm font-medium">₹1,89,000 (36%)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Receipt className="w-4 h-4 text-purple-600" />
                        <span className="text-sm">Cash/Cheque</span>
                      </div>
                      <span className="text-sm font-medium">₹86,000 (17%)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={monthFilter.toString()} onValueChange={(value) => setMonthFilter(parseInt(value))}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={yearFilter.toString()} onValueChange={(value) => setYearFilter(parseInt(value))}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bills Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Your maintenance bill history and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockBills.map((bill) => (
                      <TableRow key={bill.id} className={bill.status === 'overdue' ? 'bg-red-50' : bill.status === 'paid' ? 'bg-green-50' : ''}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {new Date(bill.year, bill.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-sm text-muted-foreground">{bill.flatId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">₹{bill.totalAmount.toLocaleString()}</p>
                            {bill.lateFee > 0 && (
                              <p className="text-sm text-red-600">+₹{bill.lateFee} late fee</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{new Date(bill.dueDate).toLocaleDateString()}</p>
                            {bill.status === 'overdue' && (
                              <p className="text-xs text-red-600">
                                {Math.floor((Date.now() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(bill.status)}>
                            {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {bill.paymentMethod ? (
                            <span className="text-sm capitalize">{bill.paymentMethod}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {bill.status !== 'paid' ? (
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  setSelectedBill(bill);
                                  setShowPaymentModal(true);
                                }}
                                className="bg-whatsapp hover:bg-whatsapp-dark"
                              >
                                Pay Now
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline">
                                <FileText className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
          </DialogHeader>
          
          {selectedBill && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Payment Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Period:</span>
                    <span>{new Date(selectedBill.year, selectedBill.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span>₹{selectedBill.baseAmount.toLocaleString()}</span>
                  </div>
                  {selectedBill.lateFee > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Late Fee:</span>
                      <span>₹{selectedBill.lateFee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Total Amount:</span>
                    <span>₹{selectedBill.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Choose Payment Method</h4>
                
                <Button 
                  onClick={() => handlePayment(selectedBill, 'upi')}
                  disabled={paymentMutation.isPending}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Smartphone className="w-4 h-4 mr-3" />
                  UPI Payment (Recommended)
                </Button>
                
                <Button 
                  onClick={() => handlePayment(selectedBill, 'card')}
                  disabled={paymentMutation.isPending}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <CreditCard className="w-4 h-4 mr-3" />
                  Debit/Credit Card
                </Button>
                
                <Button 
                  onClick={() => handlePayment(selectedBill, 'netbanking')}
                  disabled={paymentMutation.isPending}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Building className="w-4 h-4 mr-3" />
                  Net Banking
                </Button>
                
                {paymentMutation.isPending && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-whatsapp mr-2"></div>
                    <span className="text-sm">Processing payment...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
  );
}
