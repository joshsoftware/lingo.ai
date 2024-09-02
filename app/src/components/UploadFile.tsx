"use client";

import { postFilesToDb } from "@/utils/server/postFilesToDb";
import { UploadButton } from "@/utils/uploadthing";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

export default function UploadFile() {

  const {mutate: uploadUserFiles, isPending} = useMutation({
    mutationKey: ['transcription'],
    mutationFn: postFilesToDb,
    onMutate: () => {
      return toast.info('File upload in progress')
    },
    onSuccess: () => {
      return toast.success('File uploaded successfully');
    },
    onError: (error) => {
      if(error instanceof AxiosError){
        if(error.response?.status === 401){
          return toast.error('You are not authorized to upload files');
        }

        if(error.response?.status === 422){
          return toast.error("Invalid Transcriptions",{
            description:error.message
          })
        }
      }
      return toast.error('File Upload Failed please try again in some time');
    },
  })

  return (
    <main className="flex flex-col items-center justify-between p-24">
      <UploadButton
        endpoint="audioUploader"
        disabled={isPending}
        onClientUploadComplete={(res) => {
          uploadUserFiles(res)
        }}
        onUploadError={(error: Error) => {
          // Do something with the error.
          console.log(`ERROR! ${error.message}`);
        }}
      />
    </main>
  );
}
