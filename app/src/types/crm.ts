
export interface ExtractedData {

  name?: string;
  contactName?: string;
  email?: string;
  contactEmail?: string;
  phone?: string;
  contactPhone?: string;
  contact?: string;

  company?: string;
  organization?: string;
  
  status?: string;
  leadSource?: string;
  source?: string;
  location?: string;
  address?: string;
  

  entities?: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  keyPoints?: string[];
  actionItems?: string[];
  
 
  [key: string]: any;
}

export interface CRMDisplayData {
  id: string;
  leadId: string;
  crmUrl: string;
  fileName: string;
  email: string;
  company: string;
  contact: string;
  lastContact: string;
  documentUrl: string;
  translation: string;
}

export interface CRMRecord {
  id: string;
  leadId: string;
  crmUrl: string;
  fileName: string;
  contact: string;
  email: string;
  company: string;
  lastContact: string;
  documentUrl: string;
  translation: string;
}
