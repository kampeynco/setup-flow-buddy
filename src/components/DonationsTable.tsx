import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StatusPill } from "./StatusPill";
import { HorizontalProgressBar } from "./HorizontalProgressBar";
import { cn } from "@/lib/utils";

interface DonationWithStatus {
  id: string;
  donor_name: string | null;
  donor_address: string | null;
  donor_city: string | null;
  donor_state: string | null;
  donor_zip: string | null;
  order_number: string | null;
  amount: number;
  donation_date: string | null;
  postcard_status: string | null;
  tracking_status: string | null;
  is_error: boolean;
}

export function DonationsTable() {
  const [donations, setDonations] = useState<DonationWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonations();
    
    // Subscribe to changes in donations, postcards, and tracking_events
    const channel = supabase
      .channel('donations-tracking-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'donations'
        },
        () => fetchDonations()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'postcards'
        },
        () => fetchDonations()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tracking_events'
        },
        () => fetchDonations()
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
        .select(`
          id, 
          donor_name, 
          donor_address, 
          donor_city, 
          donor_state, 
          donor_zip, 
          order_number, 
          amount, 
          donation_date,
          postcards (
            id,
            status,
            tracking_events (
              status,
              name,
              created_at
            )
          )
        `)
        .order('donation_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform data to include status information
      const transformedData = (data || []).map(donation => {
        const postcard = donation.postcards?.[0];
        const latestEvent = postcard?.tracking_events?.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )?.[0];

        // Determine status and error state
        let currentStatus = 'Received'; // Default status
        let isError = false;

        if (postcard?.status) {
          // Map database status to display status
          switch (postcard.status.toLowerCase()) {
            case 'pending':
              currentStatus = 'Received';
              break;
            case 'processing':
            case 'rendered':
              currentStatus = 'In Production';
              break;
            case 'mailed':
              currentStatus = 'Mailed';
              break;
            default:
              currentStatus = postcard.status;
          }
        }

        // Check for error conditions from tracking events
        if (latestEvent?.status) {
          switch (latestEvent.status.toLowerCase()) {
            case 'in_transit':
              currentStatus = 'In Transit';
              break;
            case 'delivered':
              currentStatus = 'Delivered';
              break;
            case 'returned_to_sender':
            case 're_routed':
              currentStatus = latestEvent.name || 'Returned';
              isError = true;
              break;
          }
        }

        return {
          ...donation,
          postcard_status: postcard?.status || null,
          tracking_status: latestEvent?.status || null,
          is_error: isError
        };
      });

      setDonations(transformedData);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (donation: DonationWithStatus) => {
    const parts = [
      donation.donor_address,
      donation.donor_city,
      donation.donor_state,
      donation.donor_zip
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'No address provided';
  };

  const getCurrentStatus = (donation: DonationWithStatus) => {
    if (donation.tracking_status === 'delivered') return 'Delivered';
    if (donation.tracking_status === 'in_transit') return 'In Transit';
    if (donation.postcard_status === 'mailed') return 'Mailed';
    if (donation.postcard_status === 'processing' || donation.postcard_status === 'rendered') return 'In Production';
    return 'Received';
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
          <Accordion type="multiple" className="space-y-2">
            {donations.map((donation) => (
              <AccordionItem 
                key={donation.id} 
                value={donation.id}
                className={cn(
                  "border rounded-lg px-4",
                  donation.is_error && "border-destructive bg-destructive/5"
                )}
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center space-x-3">
                      <span className={cn(
                        "font-medium text-left",
                        donation.is_error && "text-destructive"
                      )}>
                        {donation.donor_name || 'Anonymous'}
                      </span>
                    </div>
                    <StatusPill 
                      status={getCurrentStatus(donation)} 
                      isError={donation.is_error}
                    />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Left Column: Details */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Donor Address
                        </h4>
                        <p className="text-sm">{formatAddress(donation)}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Order Number
                        </h4>
                        <p className="text-sm font-mono">
                          {donation.order_number || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Right Column: Progress Tracker */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Mailing Progress
                      </h4>
                      <HorizontalProgressBar 
                        currentStatus={getCurrentStatus(donation)}
                        isError={donation.is_error}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}