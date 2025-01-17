import { userTranscriptions } from "@/types/transcriptions";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchTranscriptions = async ({
  pageParam = 0,
  filter = "false",
  userId = null as string | null | undefined,
}) => {
  const response = await axios.get(
    `/api/transcriptions?cursor=${pageParam}&filter=${filter}&userId=${userId}`
  );
  return response.data;
};

export const useTranscriptions = (
  initialData: userTranscriptions[],
  filter: string,
  userId: string | null
) => {
  return useInfiniteQuery({
    queryKey: ["transcriptions", filter, userId],
    queryFn: ({ pageParam = 0 }) =>
      fetchTranscriptions({ pageParam, filter, userId }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    initialData: {
      pageParams: [0],
      pages: [initialData],
    },
  });
};
