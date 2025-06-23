"use client";
import axios from "axios";
import React, { useEffect, useState } from "react";

const ProfileInformation = () => {
  const [profileData, setProfileData] = useState({
    email: "",
    sampleCount: 0,
    totalRecords: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchProfileData = async () => {
    try {
      const { data } = await axios.get("/api/profile/summary");
      if (!data) throw new Error("Failed to fetch");
      setProfileData({
        email: data.email || "",
        sampleCount: data.sampleCount || 0,
        totalRecords: data.totalRecords || 0,
      });
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const { email, sampleCount, totalRecords } = profileData;

  return (
    <div className="flex flex-col items-center text-center space-y-6 p-6">
      {/* Profile Picture */}
      <div className="w-24 h-24 rounded-full bg-[#668D7E] flex items-center justify-center text-3xl font-bold text-white">
        {loading ? (
          <div className="animate-spin w-5 h-5 border-2 border-white rounded-full border-t-transparent" />
        ) : (
          email.charAt(0).toUpperCase() || "?"
        )}
      </div>

      {/* Basic Info */}
      <div>
        <p className="text-lg font-semibold">
          {loading ? (
            <span className="inline-block ml-2 animate-spin w-4 h-4 border-2 border-gray-500 rounded-full border-t-transparent" />
          ) : (
            email
          )}
        </p>
      </div>

      {/* Separator */}
      <div className="w-full border-t border-gray-200" />

      {/* Info Badges */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
        <div className="px-4 py-2 bg-[#668D7E]/10 text-[#668D7E] rounded-full text-sm font-medium">
          Sample Recordings:
          {loading ? (
            <span className="inline-block ml-2 animate-spin w-4 h-4 border-2 border-[#668D7E] rounded-full border-t-transparent" />
          ) : (
            <span className="font-semibold">{sampleCount}</span>
          )}
        </div>
        <div className="px-4 py-2 bg-[#668D7E]/10 text-[#668D7E] rounded-full text-sm font-medium">
          Total Records:
          {loading ? (
            <span className="inline-block ml-2 animate-spin w-4 h-4 border-2 border-[#668D7E] rounded-full border-t-transparent" />
          ) : (
            <span className="font-semibold">{totalRecords}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileInformation;
