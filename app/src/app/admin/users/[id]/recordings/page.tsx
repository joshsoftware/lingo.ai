import RecordingsPage from "./RecordingsPage";

interface PageProps {
  params: {
    id: string;
  };
}

export default function RecordingsWrapper({ params }: PageProps) {
  return <RecordingsPage userId={params.id} />;
}
