import { postFilesToDb } from "@/utils/server/postFilesToDb";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const useTranscriptions = () =>{
    const { mutate: uploadUserFiles, isPending } = useMutation({
        mutationKey: ['transcription'],
        mutationFn: postFilesToDb,
        onMutate: () => toast.info('File upload in progress'),
        onSuccess: () => toast.success('File uploaded successfully'),
        onError: (error) => {

          if (error instanceof AxiosError) {
            if (error.response?.status === 401) {
              return toast.error('You are not authorized to upload files');
            }
            if (error.response?.status === 422) {
              return toast.error("Invalid Transcriptions", {
                description: error.message
              });
            }
          }
          return toast.error('File Upload Failed please try again in some time');
        },
      });

      return {
        isPending,
        uploadUserFiles,
      }
}

export default useTranscriptions;