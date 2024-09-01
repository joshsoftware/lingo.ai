import { ClientUploadedFileData } from "uploadthing/types";
import axios from "axios";
import { TranscriptionRequest } from "@/Validators/transcriptions";

export const postFilesToDb = async (res: ClientUploadedFileData<{
    uploadedBy: string;
}>[]) => {
    const payload: TranscriptionRequest = {
        documentUrl: res[0].url,
        transcription: ""
    }
    const { data } = await axios.post('/api/uploadUserFiles', payload)

    return data;
}