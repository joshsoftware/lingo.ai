"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { API } from "@/lib/axios";
import { toast } from "sonner";

interface Recording {
  id: string;
  documentName: string;
  audioDuration: number;
  createdAt: string;
  translation: string;
  summary: string;
  isDefault: boolean;
}

interface Props {
  userId: string;
}

export default function RecordingsPage({ userId }: Props) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const searchParams = useSearchParams();
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "20";

  const fetchRecordings = useCallback(async () => {
    try {
      const response = await API.get(
        `/admin/users/transcriptions/${userId}?page=${page}&limit=${limit}`
      );
      setRecordings(response.data.data);
    } catch (error) {
      console.error("Failed to fetch recordings:", error);
    }
  }, [userId, page, limit]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const handleDeleteRecording = async (recordingId: String) => {
    try {
      const confirmDelete = confirm(
        "Are you sure you want to delete this recording?"
      );
      if (!confirmDelete) return;

      await API.delete(`/admin/transcriptions/${recordingId}`);
      await fetchRecordings();
      toast.success("Recording deleted successfully");
    } catch (error) {
      console.error("Failed to delete recording:", error);
      toast.error("Failed to delete recording");
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-xl font-semibold mb-4">All Recordings</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Duration (s)</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recordings.map((audioFile) => (
              <TableRow key={audioFile.id}>
                <TableCell className="font-medium">
                  {audioFile.documentName}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{audioFile.audioDuration}</Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {new Date(audioFile.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="flex gap-2">
                  <div
                    className="w-8 h-8 p-2 rounded-full flex items-center justify-center shadow-xl hover:bg-red-500 cursor-pointer hover:text-white"
                    onClick={() => handleDeleteRecording(audioFile.id)}
                  >
                    <Trash2 size={20} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
