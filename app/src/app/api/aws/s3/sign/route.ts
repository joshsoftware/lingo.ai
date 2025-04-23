import {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeFileName } from "@/utils/filenameSanitization";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileData = formData.get("file") as File;

    const sanitizedFileName = sanitizeFileName(fileData.name);

    if (!fileData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const key = `${Date.now()}-${sanitizedFileName}`;
    const isLargeFile = fileData.size > 5 * 1024 * 1024; // 5MB

    if (isLargeFile) {
      // --- Multipart Upload ---
      try {
        const multipartInit = await s3.send(
          new CreateMultipartUploadCommand({
            Bucket: process.env.S3_BUCKET!,
            Key: key,
            ContentType: fileData.type,
            Metadata: {
              originalName: sanitizedFileName || "unknown",
              fileSize: fileData.size.toString(),
              lastModified: fileData.lastModified.toString(),
            },
          })
        );

        if (!multipartInit.UploadId) {
          console.error("Failed to initiate multipart upload");
          return NextResponse.json(
            { error: "Failed to initiate multipart upload" },
            { status: 500 }
          );
        }

        const partSize = 5 * 1024 * 1024; // 5MB
        const numParts = Math.ceil(fileBuffer.length / partSize);
        const uploadedParts: { ETag: string; PartNumber: number }[] = [];

        for (let i = 0; i < numParts; i++) {
          const start = i * partSize;
          const end = Math.min(start + partSize, fileBuffer.length);
          const partBuffer = fileBuffer.slice(start, end);

          const part = await s3.send(
            new UploadPartCommand({
              Bucket: process.env.S3_BUCKET!,
              Key: key,
              UploadId: multipartInit.UploadId!,
              PartNumber: i + 1,
              Body: partBuffer,
            })
          );

          uploadedParts.push({
            ETag: part.ETag!,
            PartNumber: i + 1,
          });
        }
        const complete = await s3.send(
          new CompleteMultipartUploadCommand({
            Bucket: process.env.S3_BUCKET!,
            Key: key,
            UploadId: multipartInit.UploadId!,
            MultipartUpload: {
              Parts: uploadedParts,
            },
          })
        );

        const fileUrl = `${process.env.AWS_ENDPOINT}/${key}`;

        return NextResponse.json(
          {
            url: fileUrl,
            key: key,
            bucket: process.env.S3_BUCKET,
          },
          { status: 200 }
        );
      } catch (error) {
        console.log(error);

        return NextResponse.json(
          {
            error: "Upload failed. Please try again.",
            debugMessage:
              error instanceof Error ? error.message : "Unexpected error",
          },
          { status: 402 }
        );
      }
    } else {
      try {
        // --- Single Upload ---
        const command = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: key,
          Body: fileBuffer,
          ContentType: fileData.type,
          Metadata: {
            originalName: sanitizedFileName || "unknown",
            fileSize: fileData.size.toString(),
          },
        });

        await s3.send(command);

        const fileUrl = `${process.env.AWS_ENDPOINT}/${key}`;

        return NextResponse.json(
          {
            url: fileUrl,
            key: key,
            bucket: process.env.S3_BUCKET,
          },
          { status: 200 }
        );
      } catch (error) {
        console.log(error);

        return NextResponse.json(
          {
            error: "Upload failed. Please try again.",
            debugMessage:
              error instanceof Error ? error.message : "Unexpected error",
          },
        { status: 402 }
        );
      }
    }
  } catch (err) {
    console.error("Error processing file upload:", err);
    return NextResponse.json(
      {
        error: "Failed to initiate multipart upload",
        details: (err as Error).message,
      },
      { status: 503 }
    );
  }
}
