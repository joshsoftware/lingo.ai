import {
  generateReactHelpers,
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const {useUploadThing} = generateReactHelpers<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
