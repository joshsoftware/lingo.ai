import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import { getAdminBasicAuthHeaders } from "@/lib/admin-auth";
import axios from "axios";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin role check later when role system is implemented
    // For now, any authenticated user can access error logs

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();
    
    // Forward all query parameters
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });

    // Proxy request to FastAPI backend
    const microserviceUrl = process.env.NEXT_PUBLIC_MICROSERVICE_URL || "http://localhost:8000";
    const url = `${microserviceUrl}/admin/error-logs?${params.toString()}`;

    const authHeader = req.headers.get("authorization");
    const headers = authHeader
      ? { Authorization: authHeader }
      : getAdminBasicAuthHeaders();
    const response = await axios.get(url, { headers });
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error fetching error logs:", error);
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data?.detail || "Failed to fetch error logs" },
        { status: error.response.status }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
