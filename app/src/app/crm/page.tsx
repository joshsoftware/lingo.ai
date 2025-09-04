import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lingo.ai | CRM",
};

const CRMPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">CRM Dashboard</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">
            CRM functionality will be implemented here. This is a placeholder page for the View CRM feature.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CRMPage;
