import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'

interface FileData {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  base64Data: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const fileData: FileData = body.file

    console.log('Received file data:', {
      name: fileData.name,
      type: fileData.type,
      size: fileData.size
    })

    if (!fileData.type || !fileData.name || !fileData.base64Data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const fileBuffer = Buffer.from(
      fileData.base64Data.replace(/^data:.*?;base64,/, ''),
      'base64'
    )

    const key = `${Date.now()}-${fileData.name}`

    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    })

    const params = {
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: fileBuffer,
      ContentType: fileData.type,
      Metadata: {
        originalName: fileData.name,
        fileSize: fileData.size.toString(),
        lastModified: fileData.lastModified.toString(),
      },
    }

    const command = new PutObjectCommand(params)
    await s3.send(command)

    const fileUrl = `${process.env.AWS_ENDPOINT}/${key}`

    return NextResponse.json({
      url: fileUrl,
      key: key,
      bucket: process.env.S3_BUCKET
    }, { status: 200 })

  } catch (err) {
    console.error('Error uploading to S3:', err)
    return NextResponse.json(
      { error: 'Error uploading to S3' },
      { status: 500 }
    )
  }
}