"use client";
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Database, User, Mail, Phone, Calendar, MapPin, Play, Pause, FileAudio } from "lucide-react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import Link from "next/link";
import { getAllCrmLeads, transformCrmLead } from "@/lib/crm-api";
import { CRM_CONSTANTS } from "@/constants/crm";
import { ExtractedData, CRMDisplayData } from "@/types/crm";
import { CrmLeadsType } from "@/db/schema";



const CRMItem = () => {
  const [crmData, setCrmData] = useState<CRMDisplayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformLead = useCallback((lead: CrmLeadsType): CRMDisplayData => {
    const extractedData = (lead.extractedData as ExtractedData) || {};
    return {
      id: lead.id,
      leadId: lead.leadId,
      crmUrl: lead.crmUrl,
      fileName: lead.fileName,
      email: extractedData.email || '',
      company: extractedData.company || CRM_CONSTANTS.FALLBACK_DATA.COMPANY,
      contact: extractedData.contact || CRM_CONSTANTS.FALLBACK_DATA.CONTACT,
      lastContact: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '',
      documentUrl: lead.documentUrl,
      translation: lead.translation
    };
  }, []);

  useEffect(() => {
    const fetchCrmData = async () => {
      try {
        setLoading(true);
        setError(null);
        const leads = await getAllCrmLeads();
        const transformedLeads = leads.map(transformLead);
        setCrmData(transformedLeads);
      } catch (err) {
        setError(err instanceof Error ? err.message : CRM_CONSTANTS.MESSAGES.FAILED_TO_FETCH);
        setCrmData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCrmData();
  }, [transformLead]);

  const filteredData = useMemo(() => crmData, [crmData]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-4 pb-8 max-w-[1400px]">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span>{CRM_CONSTANTS.MESSAGES.LOADING}</span>
          </div>
        </div>
      </div>
    );
  }

  if (crmData.length === 0 && !error) {
    return (
      <div className="container mx-auto px-4 pt-4 pb-8 max-w-[1400px]">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{CRM_CONSTANTS.UI.TITLE}</h1>
          <p className="text-muted-foreground">
            {CRM_CONSTANTS.UI.SUBTITLE}
          </p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Database className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{CRM_CONSTANTS.UI.EMPTY_STATE_TITLE}</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {CRM_CONSTANTS.UI.EMPTY_STATE_DESCRIPTION}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto px-4 pt-4 pb-8 max-w-[1400px]">
        {error && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              <strong>Warning:</strong> {error}. Showing fallback data.
            </p>
          </div>
        )}
        

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{CRM_CONSTANTS.UI.TITLE}</h1>
          <p className="text-muted-foreground">
            {CRM_CONSTANTS.UI.SUBTITLE}
            {crmData.length > 0 && ` (${crmData.length} records)`}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              All CRM Records ({filteredData.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-32">Lead ID</TableHead>
                  <TableHead className="w-48">File Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>CRM URL</TableHead>
                  <TableHead>Last Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((record) => (
                  <CRMRecordRow key={record.id} record={record} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface CRMRecordRowProps {
  record: CRMDisplayData;
}

const CRMRecordRow = memo(({ record }: CRMRecordRowProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default";
      case "prospect":
        return "secondary";
      case "qualified":
        return "outline";
      case "closed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  useEffect(() => {
    if (record.documentUrl) {
      const audio = new Audio(record.documentUrl);
      audioRef.current = audio;

      audio.addEventListener("ended", handleAudioEnd);

      return () => {
        audio.removeEventListener("ended", handleAudioEnd);
        audio.pause();
      };
    }
  }, [record.documentUrl]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <tr className="border-b border-gray-200 mt-4">
      <td className="py-3 px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlayPause}
          className="h-8 w-8 p-0"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 text-green-500" />
          ) : (
            <Play className="h-4 w-4 text-green-500" />
          )}
        </Button>
      </td>
      <td className="py-3 px-2">
        <Link href={`/crm/${record.id}`}>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">{record.leadId}</span>
          </div>
        </Link>
      </td>
      <td className="py-3 px-2">
        <Link href={`/crm/${record.id}`}>
          <div className="flex items-center gap-2">
            <FileAudio className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm truncate">{record.fileName}</span>
          </div>
        </Link>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{record.contact}</span>
        </div>
      </td>
      <td className="text-muted-foreground">
        <div className="ml-4">
          {record.company}
        </div>
      </td>
      <td>
        <div className="ml-4">
          <div className="flex items-center gap-1 text-sm">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{record.email}</span>
          </div>
        </div>
      </td>
      <td className="text-muted-foreground">
        <div className="ml-4">
          <a 
            href={record.crmUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            View in CRM
          </a>
        </div>
      </td>
      <td className="text-muted-foreground">
        <div className="flex items-center gap-1 ml-4">
          <Calendar className="h-3 w-3" />
          <span className="text-sm">{record.lastContact}</span>
        </div>
      </td>
    </tr>
  );
});

CRMRecordRow.displayName = 'CRMRecordRow';

export default CRMItem;
