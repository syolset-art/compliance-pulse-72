import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VerifyCustomerResult {
  success: boolean;
  verified: boolean;
  customer_name?: string;
  partner?: string;
  message: string;
}

export interface RequestAccessResult {
  success: boolean;
  request_id?: string;
  estimated_activation?: string;
  message: string;
}

export interface FetchedAsset {
  id: string;
  name: string;
  hostname: string;
  type: "system" | "location" | "network" | "hardware" | "vendor";
  os: string;
  status: "protected" | "warning" | "critical";
  lastSeen: string;
  complianceScore?: number;
  frameworks?: string[];
  vendor?: string;
}

export interface FetchAssetsResult {
  success: boolean;
  customer_id?: string;
  source?: string;
  partner?: string;
  assets?: FetchedAsset[];
  sync_token?: string;
  fetched_at?: string;
  next_sync_available?: string;
  error?: string;
}

export function use7SecurityIntegration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyCustomer = useCallback(async (customerId: string): Promise<VerifyCustomerResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: funcError } = await supabase.functions.invoke('fetch-7security-data', {
        body: {
          action: 'verify_customer',
          customer_id: customerId
        }
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      return data as VerifyCustomerResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke verifisere kunde-ID';
      setError(message);
      return {
        success: false,
        verified: false,
        message
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestAccess = useCallback(async (data: {
    orgNumber: string;
    contactName: string;
    contactEmail: string;
  }): Promise<RequestAccessResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: result, error: funcError } = await supabase.functions.invoke('fetch-7security-data', {
        body: {
          action: 'request_access',
          org_number: data.orgNumber,
          contact_name: data.contactName,
          contact_email: data.contactEmail
        }
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (result.success) {
        toast.success("Tilgangsforespørsel sendt!");
      }

      return result as RequestAccessResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke sende tilgangsforespørsel';
      setError(message);
      toast.error(message);
      return {
        success: false,
        message
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAcronisAssets = useCallback(async (
    customerId: string,
    assetTypes?: string[]
  ): Promise<FetchAssetsResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: funcError } = await supabase.functions.invoke('fetch-7security-data', {
        body: {
          action: 'fetch_acronis_assets',
          customer_id: customerId,
          asset_types: assetTypes || ['all']
        }
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      return data as FetchAssetsResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke hente eiendeler';
      setError(message);
      toast.error(message);
      return {
        success: false,
        error: message
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkSyncStatus = useCallback(async (customerId: string) => {
    try {
      const { data, error: funcError } = await supabase.functions.invoke('fetch-7security-data', {
        body: {
          action: 'get_sync_status',
          customer_id: customerId
        }
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      return data;
    } catch (err) {
      console.error("Error checking sync status:", err);
      return null;
    }
  }, []);

  return {
    isLoading,
    error,
    verifyCustomer,
    requestAccess,
    fetchAcronisAssets,
    checkSyncStatus
  };
}
