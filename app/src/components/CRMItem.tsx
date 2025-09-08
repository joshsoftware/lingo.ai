"use client";
import { useState, useEffect, useRef, useCallback } from "react";
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

// Static CRM data for demonstration
const staticCRMData = [
  {
    id: "1",
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
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.j@techcorp.com",
    phone: "+1 (555) 987-6543",
    company: "TechCorp Solutions",
    status: "Prospect",
    lastContact: "2024-01-12",
    location: "San Francisco, CA",
    leadSource: "Referral",
    recordingUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    recordingName: "meeting_sarah_johnson_jan12.mp3",
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "m.brown@innovate.io",
    phone: "+1 (555) 456-7890",
    company: "Innovate Inc",
    status: "Qualified",
    lastContact: "2024-01-10",
    location: "Austin, TX",
    leadSource: "Cold Call",
    recordingUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    recordingName: "demo_call_michael_brown_jan10.mp3",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.davis@startup.com",
    phone: "+1 (555) 321-0987",
    company: "StartupCo",
    status: "Active",
    lastContact: "2024-01-08",
    location: "Seattle, WA",
    leadSource: "Social Media",
    recordingUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    recordingName: "follow_up_emily_davis_jan08.mp3",
  },
  {
    id: "5",
    name: "David Wilson",
    email: "d.wilson@enterprise.com",
    phone: "+1 (555) 654-3210",
    company: "Enterprise Solutions",
    status: "Closed",
    lastContact: "2024-01-05",
    location: "Chicago, IL",
    leadSource: "Trade Show",
    recordingUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    recordingName: "closing_call_david_wilson_jan05.mp3",
  },
];

const CRMItem = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const filteredData = statusFilter === "all" 
    ? staticCRMData 
    : staticCRMData.filter(item => item.status.toLowerCase() === statusFilter.toLowerCase());

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

  return (
    <div>
      <div className="container mx-auto px-4 pt-4 pb-8 max-w-[1400px]">
        <div className="overflow-clip flex w-full max-w-xs ml-auto mb-6">
          <Select
            value={statusFilter}
            onValueChange={handleFilterChange}
          >
            <SelectTrigger className="focus:outline-none focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Records</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">CRM Records</h1>
          <p className="text-muted-foreground">
            Manage and view your customer relationship management data
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
                  <TableHead className="w-48">File Name</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Lead Source</TableHead>
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
  record: typeof staticCRMData[0];
}

const CRMRecordRow = ({ record }: CRMRecordRowProps) => {
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
    if (record.recordingUrl) {
      const audio = new Audio(record.recordingUrl);
      audioRef.current = audio;

      audio.addEventListener("ended", handleAudioEnd);

      return () => {
        audio.removeEventListener("ended", handleAudioEnd);
        audio.pause();
      };
    }
  }, [record.recordingUrl]);

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
            <FileAudio className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm truncate">{record.recordingName}</span>
          </div>
        </Link>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{record.name}</span>
        </div>
      </td>
      <td className="text-muted-foreground">
        <div className="ml-4">
          {record.company}
        </div>
      </td>
      <td>
        <div className="ml-4 space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{record.email}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{record.phone}</span>
          </div>
        </div>
      </td>
      <td>
        <div className="ml-4">
          <Badge variant={getStatusBadgeVariant(record.status)}>
            {record.status}
          </Badge>
        </div>
      </td>
      <td className="text-muted-foreground">
        <div className="flex items-center gap-1 ml-4">
          <MapPin className="h-3 w-3" />
          <span className="text-sm">{record.location}</span>
        </div>
      </td>
      <td className="text-muted-foreground">
        <div className="ml-4">
          {record.leadSource}
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
};

export default CRMItem;
