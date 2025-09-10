import { Metadata } from "next";
import DetailedCRM from "../../../components/DetailedCRM";
import { getCrmLeadById } from "@/lib/crm-api";
import { notFound } from "next/navigation";
import { CRM_CONSTANTS } from "@/constants/crm";

export const metadata: Metadata = {
  title: "Lingo.ai | CRM Details",
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const page = async (props: PageProps) => {
  const { id } = await props.params;
  
  try {
    const lead = await getCrmLeadById(id);
    const extractedData = lead.extractedData as any || {};
    const crmRecord = {
      id: lead.id,
      leadId: lead.leadId,
      crmUrl: lead.crmUrl,
      fileName: lead.fileName,
      contact: extractedData.contact || CRM_CONSTANTS.FALLBACK_DATA.CONTACT,
      email: extractedData.email || '',
      company: extractedData.company || CRM_CONSTANTS.FALLBACK_DATA.COMPANY,
      lastContact: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '',
      documentUrl: lead.documentUrl,
      translation: lead.translation || CRM_CONSTANTS.FALLBACK_DATA.TRANSLATION
    };

    return (
      <div className="flex flex-col w-full h-full pt-8">
        <div className="flex flex-1 xl:overflow-y-auto">
          <DetailedCRM crmRecord={crmRecord} />
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
};

export default page;
