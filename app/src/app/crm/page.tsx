import { Metadata } from "next";
import CRMItem from "@/components/CRMItem";

export const metadata: Metadata = {
  title: "Lingo.ai | CRM",
};

const CRMPage = () => {
  return (
    <div>
      <CRMItem />
    </div>
  );
};

export default CRMPage;
