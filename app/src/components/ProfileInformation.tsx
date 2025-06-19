import React, { useEffect, useState } from "react";

const ProfileInformation = () => {
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    email: "john@example.com",
    initials: "JD",
    sampleCount: 0,
    totalRecords: 0,
  });

  useEffect(() => {
    // Simulate async data fetch (replace with real API later)
    const fetchProfileData = async () => {
      // Dummy timeout to simulate network request
      await new Promise((res) => setTimeout(res, 300));

      // Example of setting real data
      setProfileData({
        name: "The Lingo.Ai",
        email: "thelingo.ai@lingo.com",
        initials: "TL",
        sampleCount: 12,
        totalRecords: 48,
      });
    };

    fetchProfileData();
  }, []);

  const { name, email, initials, sampleCount, totalRecords } = profileData;

  return (
    <div className="flex flex-col items-center text-center space-y-6 p-6">
      {/* Profile Picture */}
      <div className="w-24 h-24 rounded-full bg-[#668D7E] flex items-center justify-center text-3xl font-bold text-white">
        {initials}
      </div>

      {/* Basic Info */}
      <div>
        <p className="text-lg font-semibold">{name}</p>
        <p className="text-sm text-muted-foreground">{email}</p>
      </div>

      {/* Separator */}
      <div className="w-full border-t border-gray-200" />

      {/* Info Badges */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
        <div className="px-4 py-2 bg-[#668D7E]/10 text-[#668D7E] rounded-full text-sm font-medium">
          Sample Recordings:
          <span className="font-semibold">{sampleCount}</span>
        </div>
        <div className="px-4 py-2 bg-[#668D7E]/10 text-[#668D7E] rounded-full text-sm font-medium">
          Total Records: <span className="font-semibold">{totalRecords}</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileInformation;
