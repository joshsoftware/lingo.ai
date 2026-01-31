"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Download, RefreshCw, AlertCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ErrorLog {
  id: number;
  endpoint: string;
  audio_file_name: string | null;
  audio_storage_path: string | null;
  translated_text: string | null;
  detected_language: string | null;
  error_type: string;
  error_message: string;
  error_traceback: string | null;
  failure_stage: string | null;
  preprocessing_logs_text: string | null;
  intent_data: any;
  created_at: string;
}

interface ErrorStats {
  total_errors: number;
  by_failure_stage: Record<string, number>;
  top_error_types: Record<string, number>;
  by_endpoint: Record<string, number>;
}

export default function ErrorLogsPage() {
  const [filters, setFilters] = useState({
    endpoint: "",
    failure_stage: "",
    error_type: "",
  });
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch error logs
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["error-logs", page, pageSize, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        skip: String(page * pageSize),
        limit: String(pageSize),
      });
      
      if (filters.endpoint) params.append("endpoint", filters.endpoint);
      if (filters.failure_stage) params.append("failure_stage", filters.failure_stage);
      if (filters.error_type) params.append("error_type", filters.error_type);

      const response = await axios.get(`/api/admin/error-logs?${params.toString()}`);
      return response.data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["error-stats"],
    queryFn: async () => {
      const response = await axios.get("/api/admin/error-logs/stats");
      return response.data as ErrorStats;
    },
  });

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.endpoint) params.append("endpoint", filters.endpoint);
      if (filters.failure_stage) params.append("failure_stage", filters.failure_stage);
      if (filters.error_type) params.append("error_type", filters.error_type);

      const response = await axios.get(`/api/admin/error-logs/export?${params.toString()}`, {
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `error_logs_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Error logs exported successfully");
    } catch (error: any) {
      toast.error("Failed to export error logs");
      console.error(error);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load error logs. Please check your permissions.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">API Error Logs</h1>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Errors</div>
            <div className="text-2xl font-bold">{stats.total_errors}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Failure Stages</div>
            <div className="text-2xl font-bold">{Object.keys(stats.by_failure_stage).length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Error Types</div>
            <div className="text-2xl font-bold">{Object.keys(stats.top_error_types).length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Endpoints</div>
            <div className="text-2xl font-bold">{Object.keys(stats.by_endpoint).length}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              placeholder="Filter by endpoint..."
              value={filters.endpoint}
              onChange={(e) => setFilters({ ...filters, endpoint: e.target.value })}
            />
          </div>
          <div>
            <Select
              value={filters.failure_stage || undefined}
              onValueChange={(value) => setFilters({ ...filters, failure_stage: value === "all" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Failure Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {stats?.by_failure_stage &&
                  Object.keys(stats.by_failure_stage).map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage} ({stats.by_failure_stage[stage]})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={filters.error_type || undefined}
              onValueChange={(value) => setFilters({ ...filters, error_type: value === "all" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Error Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {stats?.top_error_types &&
                  Object.keys(stats.top_error_types).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type} ({stats.top_error_types[type]})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Error Logs Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Failure Stage</TableHead>
                <TableHead>Error Type</TableHead>
                <TableHead>Error Message</TableHead>
                <TableHead>Audio File</TableHead>
                <TableHead>Translated Text</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : !data?.data?.length ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No error logs found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((log: ErrorLog) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{log.id}</TableCell>
                    <TableCell>
                      {log.created_at
                        ? format(new Date(log.created_at), "MMM dd, yyyy HH:mm:ss")
                        : "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.endpoint}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                        {log.failure_stage}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.error_type}</TableCell>
                    <TableCell className="max-w-xs truncate" title={log.error_message}>
                      {log.error_message}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.audio_file_name || "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={log.translated_text || ""}>
                      {log.translated_text || "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log);
                          setIsDetailOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {data && data.total > pageSize && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, data.total)} of{" "}
              {data.total} errors
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * pageSize >= data.total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Error Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Error Log Details"
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground">ID</label>
                <p className="font-mono text-sm">{selectedLog.id}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Timestamp</label>
                <p className="text-sm">
                  {selectedLog.created_at
                    ? format(new Date(selectedLog.created_at), "MMM dd, yyyy HH:mm:ss")
                    : "-"}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Endpoint</label>
                <p className="font-mono text-sm">{selectedLog.endpoint}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Failure Stage</label>
                <p className="text-sm">
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                    {selectedLog.failure_stage || "-"}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Error Type</label>
                <p className="font-mono text-sm">{selectedLog.error_type}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Audio File</label>
                <p className="text-sm">{selectedLog.audio_file_name || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Detected Language</label>
                <p className="text-sm">{selectedLog.detected_language || "-"}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-muted-foreground">Error Message</label>
              <pre className="mt-1 p-3 bg-red-50 border border-red-200 rounded text-sm overflow-x-auto">
                {selectedLog.error_message}
              </pre>
            </div>

            {selectedLog.audio_storage_path && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Recorded Audio</label>
                <audio
                  controls
                  src={`/api/admin/error-logs/audio/${selectedLog.audio_storage_path}`}
                  className="mt-1 w-full max-w-md"
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {selectedLog.translated_text && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Translated Text</label>
                <p className="mt-1 p-3 bg-gray-50 border rounded text-sm">{selectedLog.translated_text}</p>
              </div>
            )}

            {selectedLog.intent_data && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Intent Data</label>
                <pre className="mt-1 p-3 bg-gray-50 border rounded text-sm overflow-x-auto">
                  {JSON.stringify(selectedLog.intent_data, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.preprocessing_logs_text && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Preprocessing / TTS-STT Logs</label>
                <pre className="mt-1 p-3 bg-gray-50 border rounded text-xs overflow-x-auto max-h-64 overflow-y-auto">
                  {selectedLog.preprocessing_logs_text}
                </pre>
              </div>
            )}

            {selectedLog.error_traceback && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Error Traceback</label>
                <pre className="mt-1 p-3 bg-red-50 border border-red-200 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto">
                  {selectedLog.error_traceback}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
