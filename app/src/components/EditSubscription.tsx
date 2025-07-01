"use client";
import { useEffect, useState } from "react";
import { API } from "@/lib/axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Check, Loader2, RefreshCcw } from "lucide-react";

const EditSubscription = ({ userId ,setIsModalOpen}: { userId: string | null, setIsModalOpen: any }) => {
  const router = useRouter();
  const [profileData, setProfileData] = useState({
    username: "",
    name: "",
    contactNumber: "",
    role: "",
    subscription: {
      id: "",
      name: "",
      recordingCount: 0,
      fileSizeLimitMB: 0,
      durationDays: 0,
    },
    recordingsUsed: 0,
    recordingsRemaining: 0,
  });
const [hasChanged,setHasChanged] = useState(false)
  const [subscriptions, setSubscriptions] = useState<
    {
      id: string;
      name: string;
      recordingCount: number;
      fileSizeLimitMB: number;
      durationDays: number;
    }[]
  >([]);

  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userId) return;

        const [userRes, subsRes] = await Promise.all([
          API.get(`/admin/users/${userId}`),
          API.get("/admin/subscriptions"),
        ]);

        const user = userRes.data;
        const subs = subsRes.data.subscriptions;

        setSubscriptions(subs);

        const selectedSub = subs.find(
          (s: any) => s.name === user.subscription?.name
        );

        const subId = selectedSub?.id || "";

        setProfileData({
          username: user.username || "",
          name: user.name || "",
          contactNumber: user.contactNumber || "",
          role: user.role || "",
          subscription: {
            id: subId,
            name: selectedSub?.name || "",
            recordingCount: selectedSub?.recordingCount || 0,
            fileSizeLimitMB: selectedSub?.fileSizeLimitMB || 0,
            durationDays: selectedSub?.durationDays || 0,
          },
          recordingsUsed: user.recordingsUsed || 0,
          recordingsRemaining: user.recordingsRemaining || 0,
        });

        setSelectedSubscriptionId(subId);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const {
    name,
    username,
    contactNumber,
    role,
    subscription,
    recordingsUsed,
    recordingsRemaining,
  } = profileData;

  const handleSubscriptionChange = (subscriptionId: string) => {
    const selected = subscriptions.find((s) => s.id === subscriptionId);
    if (!selected) return;

    setSelectedSubscriptionId(subscriptionId);

    // setProfileData((prev) => ({
    //   ...prev,
    //   subscription: {
    //     id: selected.id,
    //     name: selected.name,
    //     recordingCount: selected.recordingCount,
    //     fileSizeLimitMB: selected.fileSizeLimitMB,
    //     durationDays: selected.durationDays,
    //   },
    // }));
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      await API.patch(`/admin/users/${userId}`, {
        subscriptionId: selectedSubscriptionId,
      });
toast.success("Subscription updated successfully");
      router.push("/admin/users");
      setIsModalOpen(null);
      // alert("Subscription updated successfully");
    } catch (err) {
      console.error("Update failed:", err);
      // alert("Failed to update subscription.");
    } finally {
      setUpdating(false);
    }
  };
useEffect(()=>{
  setHasChanged(selectedSubscriptionId !== subscription.id);
},[selectedSubscriptionId])

  return (
    <div className="flex flex-col items-center text-center space-y-6 p-6">
      {/* Profile Initial */}
      <div className="w-24 h-24 rounded-full bg-[#668D7E] flex items-center justify-center text-3xl font-bold text-white">
        {loading ? (
          <div className="animate-spin w-5 h-5 border-2 border-white rounded-full border-t-transparent" />
        ) : (
          name?.charAt(0)?.toUpperCase() || "?"
        )}
      </div>

      {/* Basic Info */}
      <div className="space-y-1">
        <p className="text-lg font-semibold">{loading ? "..." : name || "N/A"}</p>
        <p className="text-sm text-gray-600">{username || "N/A"}</p>
        <p className="text-sm text-gray-600">{contactNumber || "N/A"}</p>
        <p className="text-xs text-gray-500 italic">{role || "N/A"}</p>
      </div>

      {/* Separator */}
      <div className="w-full border-t border-gray-200 my-2" />

      {/* Subscription Plan Selector */}
      <div className="w-full max-w-xs bg-[#668D7E]/10 text-[#668D7E] rounded-lg px-4 py-3 text-sm">
  <div className="flex items-center justify-between gap-2">
    <span className="text-xs font-medium whitespace-nowrap">Subscription Plan:</span>

    <div className="relative flex items-center gap-2">
      <select
        value={selectedSubscriptionId}
        onChange={(e) => handleSubscriptionChange(e.target.value)}
        className="px-2 py-1 bg-white border border-[#668D7E] text-[#3B6253] rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#668D7E]/30"
      >
        {subscriptions.map((sub) => (
          <option key={sub.id} value={sub.id}>
            {sub.name}
          </option>
        ))}
      </select>

      {hasChanged && (
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="bg-[#3B6253]/80 hover:bg-[#2e4e42] text-white p-[6px] rounded-full transition"
          title="Update Subscription"
        >
          {updating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  </div>
</div>


      {/* Plan Details */}
      {!loading && (
        <div className="w-full max-w-xs rounded-lg border border-[#668D7E] bg-[#F0F9F5] p-4 mt-2">
          <h4 className="text-sm font-semibold text-[#3B6253] mb-3">
            Plan Details
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm text-[#3B6253]">
            <div className="flex justify-between">
              <span>Limit</span>
              <span className="font-medium">{subscription.recordingCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Used Recordings</span>
              <span className="font-medium">{recordingsUsed}</span>
            </div>
            <div className="flex justify-between">
              <span>Remaining Recordings</span>
              <span className="font-medium">{recordingsRemaining}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditSubscription;
