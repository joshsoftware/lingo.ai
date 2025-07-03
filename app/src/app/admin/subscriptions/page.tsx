"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import SubscriptionEdit from "../components/SubscriptionEdit";

export type SubscriptionData = {
  id:string,
  name: string;
  recordingCount: number;
  price: number;
  fileSizeLimitMB: number;
  durationDays: number;
};

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState<null | SubscriptionData>(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/admin/subscriptions");
      setSubs(data.subscriptions);
    } catch (err) {
      console.error("Failed to fetch subscriptions:", err);
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
  if(selectedSubscriptionId) setIsModalOpen(subs.find((s: any) => s.id === selectedSubscriptionId))
}, [selectedSubscriptionId])
  useEffect(() => {
    fetchSubscriptions();
  }, [isModalOpen]);

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4">Subscriptions</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Recording Count</TableHead>
                  <TableHead>File Size Limit (MB)</TableHead>
                  <TableHead>Duration (Days)</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.recordingCount}</TableCell>
                    <TableCell>{s.fileSizeLimitMB}</TableCell>
                    <TableCell>{s.durationDays}</TableCell>
                    <TableCell>{s.price}</TableCell>
                    <TableCell className="flex gap-2">
                      <div
                        onClick={() =>setSelectedSubscriptionId(s.id)}
                        className="w-8 h-8 p-2 rounded-full flex items-center justify-center shadow hover:bg-green-500 cursor-pointer border-green-800 hover:text-white"
                      >
                        <Edit2 size={20} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={!!isModalOpen}
        onClose={() => setIsModalOpen(null)}
        title="Update Subscription"
      >
        {isModalOpen && (
          <SubscriptionEdit
            recording={isModalOpen}
            onClose={() => setIsModalOpen(null)}
          />
        )}
      </Modal>
    </>
  );
}
