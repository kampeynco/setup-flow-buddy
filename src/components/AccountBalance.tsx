import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, RefreshCw, History, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface BalanceTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

interface AccountBalanceProps {
  profileId: string;
}

export function AccountBalance({ profileId }: AccountBalanceProps) {
  const [balance, setBalance] = useState<number>(0);
  const [autoTopupEnabled, setAutoTopupEnabled] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showTransactions, setShowTransactions] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchBalance = async () => {
    try {
      const { data, error } = await supabase
        .from("account_balances")
        .select("current_balance, auto_topup_enabled")
        .eq("profile_id", profileId)
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116 = no rows found
        throw error;
      }

      if (data) {
        setBalance(typeof data.current_balance === 'string' ? parseFloat(data.current_balance) : data.current_balance);
        setAutoTopupEnabled(data.auto_topup_enabled);
      } else {
        setBalance(0);
        setAutoTopupEnabled(true);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      toast({
        title: "Error",
        description: "Failed to fetch account balance",
        variant: "destructive",
      });
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("balance_transactions")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const refreshBalance = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-account-balance', {
        body: {
          action: 'check_balance',
          userId: profileId
        }
      });

      if (error) throw error;

      if (data) {
        setBalance(data.balance);
        setAutoTopupEnabled(data.auto_topup_enabled);
      }
      
      toast({
        title: "Balance Updated",
        description: "Account balance has been refreshed",
      });
    } catch (error) {
      console.error("Error refreshing balance:", error);
      toast({
        title: "Error",
        description: "Failed to refresh balance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [profileId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'topup':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'usage':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'topup':
        return 'text-green-600';
      case 'usage':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Account Balance
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshBalance}
          disabled={loading}
          className="h-8 px-3"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold">{formatCurrency(balance)}</div>
          <div className="text-sm text-muted-foreground">Available Credit</div>
          
          {balance < 10 && (
            <div className="mt-2 flex items-center justify-center gap-2 text-orange-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Low balance - auto top-up will trigger soon</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Auto top-up:</span>
            <Badge variant={autoTopupEnabled ? "default" : "secondary"}>
              {autoTopupEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          
          <Dialog open={showTransactions} onOpenChange={setShowTransactions}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={fetchTransactions}
              >
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Balance Transaction History</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No transactions found
                  </p>
                ) : (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <p className="text-sm font-medium">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance: {formatCurrency(transaction.balance_after)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-2">
          • $50 charged when balance falls below $10
          • $1.99 deducted per postcard sent
        </div>
      </CardContent>
    </Card>
  );
}