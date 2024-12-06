import { userTranscriptions } from "@/types/transcriptions";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchTranscriptions = async ({ pageParam = 0, filter = "false" }) => {
  const response = await axios.get(`/api/transcriptions?cursor=${pageParam}&filter=${filter}`);
  return response.data;
};

export const useTranscriptions = (initialData: userTranscriptions[], filter: string) => {
  return useInfiniteQuery({
    queryKey: ["transcriptions", filter],
    queryFn: ({ pageParam = 0 }) => fetchTranscriptions({ pageParam, filter }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    initialData: {
      pageParams: [0],
      pages: [initialData]
    }
  });
};