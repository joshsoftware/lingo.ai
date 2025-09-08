import { Metadata } from "next";
import DetailedCRM from "../../../components/DetailedCRM";

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

  // For now, we'll use static data. Later this will be replaced with actual API calls
  const crmRecord = {
    id: id,
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    company: "Acme Corporation",
    status: "Active",
    lastContact: "2024-01-15",
    location: "New York, NY",
    leadSource: "Website",
    recordingUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    recordingName: "call_with_john_smith_jan15.mp3",
    // CRM-specific data
    translation: "This is a sample translation of the CRM call recording. The conversation covered product features, pricing, and next steps for the potential client.",
    extraction: {
      entities: [
        { type: "Person", value: "John Smith", confidence: 0.95 },
        { type: "Company", value: "Acme Corporation", confidence: 0.98 },
        { type: "Product", value: "Enterprise Software", confidence: 0.87 },
        { type: "Price", value: "$50,000", confidence: 0.92 },
        { type: "Date", value: "January 15, 2024", confidence: 0.99 },
        { type: "Location", value: "New York", confidence: 0.94 }
      ],
      keyPoints: [
        "Client interested in enterprise software solution",
        "Budget range discussed: $40,000 - $60,000",
        "Decision timeline: 2-3 weeks",
        "Key stakeholders: John Smith, Sarah Johnson (CTO)",
        "Next meeting scheduled for January 22nd"
      ],
      actionItems: [
        "Send detailed product specifications",
        "Prepare custom pricing proposal",
        "Schedule demo with technical team",
        "Follow up on January 22nd"
      ]
    }
  };

  return (
    <div className="flex flex-col w-full h-full pt-8">
      <div className="flex flex-1 xl:overflow-y-auto">
        <DetailedCRM crmRecord={crmRecord} />
      </div>
    </div>
  );
};

export default page;
