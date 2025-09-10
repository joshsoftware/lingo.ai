import { CrmLeadsType } from "@/db/schema";


interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
}

interface CrmLeadWithDetails extends CrmLeadsType {

  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  lastContact?: string;
  location?: string;
  leadSource?: string;
  recordingUrl?: string;
  recordingName?: string;
  extraction?: {
    entities: Array<{
      type: string;
      value: string;
      confidence: number;
    }>;
    keyPoints: string[];
    actionItems: string[];
  };
}


export class CrmApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  private getApiUrl(endpoint: string): string {
    if (this.baseUrl) {
      return `${this.baseUrl}${endpoint}`;
    }
    // In server-side context, we need an absolute URL
    if (typeof window === 'undefined') {
      // Server-side: construct absolute URL
      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
      return `${baseUrl}${endpoint}`;
    }
 
    return endpoint;
  }

  async getAllLeads(): Promise<CrmLeadsType[]> {
    try {
      const response = await fetch(this.getApiUrl('/api/crm-leads'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CRM leads: ${response.statusText}`);
      }

      const result: ApiResponse<CrmLeadsType[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch CRM leads');
      }

      return result.data || [];
    } catch (error) {
      throw error;
    }
  }


  async getLeadById(id: string): Promise<CrmLeadsType> {
    try {
      const url = this.getApiUrl(`/api/crm-leads/simple/${id}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 404) {
          throw new Error('CRM lead not found');
        }
        throw new Error(`Failed to fetch CRM lead: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }


  async getDefaultLeads(): Promise<CrmLeadsType[]> {
    try {
      const response = await fetch(this.getApiUrl('/api/crm-leads/default'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch default CRM leads: ${response.statusText}`);
      }

      const result: ApiResponse<CrmLeadsType[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch default CRM leads');
      }

      return result.data || [];
    } catch (error) {
      throw error;
    }
  }


  transformLeadToDisplay(lead: CrmLeadsType): CrmLeadWithDetails {
  
    const extractedData = lead.extractedData as any || {};
    
    return {
      ...lead,
      name: extractedData.name || extractedData.contactName || 'Unknown',
      email: extractedData.email || extractedData.contactEmail || '',
      phone: extractedData.phone || extractedData.contactPhone || '',
      company: extractedData.company || extractedData.organization || 'Unknown Company',
      status: extractedData.status || 'Active',
      lastContact: lead.createdAt ? new Date(lead.createdAt).toISOString().split('T')[0] : '',
      location: extractedData.location || extractedData.address || '',
      leadSource: extractedData.leadSource || extractedData.source || 'Unknown',
      recordingUrl: lead.documentUrl,
      recordingName: lead.fileName,
      extraction: {
        entities: extractedData.entities || [],
        keyPoints: extractedData.keyPoints || [],
        actionItems: extractedData.actionItems || []
      }
    };
  }
}


export const crmApiClient = new CrmApiClient();


export const getAllCrmLeads = () => crmApiClient.getAllLeads();
export const getCrmLeadById = (id: string) => crmApiClient.getLeadById(id);
export const getDefaultCrmLeads = () => crmApiClient.getDefaultLeads();
export const transformCrmLead = (lead: CrmLeadsType) => crmApiClient.transformLeadToDisplay(lead);
