"use client";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TranscriptionCard from "./TranscriptionCard";

type userTranscriptions = {
  id: string;
  documentName: string;
  createdAt: Date | null;
  documentUrl: string;
  isDefault: boolean;
};

interface TranscriptionItemProps {
  userTranscriptions: userTranscriptions[];
}

const TranscriptionItem = (props: TranscriptionItemProps) => {
  const { userTranscriptions } = props;

  const [defaultTranscriptionFilter, setDefaultTranscriptionFilter] = useState<boolean>(false);
  const [filteredTranscriptions, setFilteredTranscriptions] = useState(userTranscriptions);


  useEffect(() => {
    if (defaultTranscriptionFilter) {
      setFilteredTranscriptions(userTranscriptions.filter((transcription) => transcription.isDefault));
    } else {
      setFilteredTranscriptions(userTranscriptions);
    }
  }, [defaultTranscriptionFilter, userTranscriptions]);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="overflow-hidden flex w-full max-w-xs h-14 ml-auto">
        <Select onValueChange={(value) => setDefaultTranscriptionFilter(value === "true")}>
          <SelectTrigger>
            <SelectValue placeholder="Filter transcriptions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Demo Transcriptions</SelectItem>
            <SelectItem value="false">Recent Transcriptions</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto">
      {filteredTranscriptions.slice(0, 10).map((transcription, idx) => (
        <TranscriptionCard key={idx} transcription={transcription} index={idx} />
      ))}
      </div>
    </div>
  );
};

export default TranscriptionItem;