import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Donation {
  id: string;
  donor_name: string | null;
  donor_address: string | null;
  donor_city: string | null;
  donor_state: string | null;
  donor_zip: string | null;
  order_number: string | null;
  amount: number;
  donation_date: string | null;
}

export function DonationsTable() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonations();
    
    // Subscribe to new donations
    const channel = supabase
      .channel('donations-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donations'
        },
        (payload) => {
          setDonations(prev => [payload.new as Donation, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('id, donor_name, donor_address, donor_city, donor_state, donor_zip, order_number, amount, donation_date')
        .order('donation_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setDonations(data || []);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (donation: Donation) => {
    const parts = [
      donation.donor_address,
      donation.donor_city,
      donation.donor_state,
      donation.donor_zip
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'No address provided';
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Donations</CardTitle>
        <CardDescription>
          Incoming donations from your ActBlue integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : donations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No donations received yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Donations will appear here once your ActBlue integration is active
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donor Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Order Number</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell className="font-medium">
                    {donation.donor_name || 'Anonymous'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {formatAddress(donation)}
                  </TableCell>
                  <TableCell>
                    {donation.order_number || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(donation.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}