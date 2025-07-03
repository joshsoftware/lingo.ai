"use client";

import { useEffect, useState } from "react";
import { SubscriptionData } from "../subscriptions/page";
import { API } from "@/lib/axios";
import { toast } from "sonner";

type Props = {
  recording: SubscriptionData;
  onClose: () => void;
};

const SubscriptionEdit = ({ recording, onClose }: Props) => {
  const [editData, setEditData] = useState<SubscriptionData>(recording);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  console.log("recording", recording);
  useEffect(() => {
    setEditData(recording);
  }, [recording]);

  const handleChange = (
    key: keyof SubscriptionData,
    value: string | number
  ) => {
    setEditData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setUpdating(true);
    try {
      const { id, ...data } = editData;
      const response = await API.patch(
        `/admin/subscriptions/free?id=${id}`,
        data
      );

      const result = response.data;
      console.log("Updated subscription:", result);
      // Close modal
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err?.response.data.error || "Failed to update subscription");
    } finally {
      onClose();
      setUpdating(false);
    }
  };

  const renderField = (label: string, key: keyof SubscriptionData) => (
    <div key={key as string} className="flex flex-col mb-4">
      <label className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          className="border border-gray-300 rounded px-2 py-1 w-full"
          value={editData[key]}
          onChange={(e) =>
            handleChange(
              key,
              key === "name" ? e.target.value : parseFloat(e.target.value)
            )
          }
        />
      </div>
    </div>
  );

  return (
    <div className="p-6 w-full max-w-lg">
      <h3 className="text-lg font-semibold mb-4">Edit Subscription Details</h3>
      {renderField("File Name", "name")}
      {renderField("Recording Count", "recordingCount")}
      {renderField("File Size Limit (MB)", "fileSizeLimitMB")}
      {renderField("Duration (Days)", "durationDays")}
      {renderField("Price", "price")}

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={updating}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default SubscriptionEdit;
