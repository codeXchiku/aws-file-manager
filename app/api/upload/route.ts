import { NextRequest, NextResponse } from "next/server"
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY as string,
        secretAccessKey: process.env.AWS_SECRET_KEY as string,
    },
    region: "ap-south-1",
})

export async function GET(request: NextRequest) {
    const Key = request.nextUrl.searchParams.get("key")
    
    if(!Key) throw new Error("Key is required")

    const command = new GetObjectCommand({
        Bucket: "myfilemanager-bucket",
        Key: Key,
    })
    const url = await getSignedUrl(client,command,{expiresIn:3000})
    return NextResponse.json({url})
}

export async function PUT(request: NextRequest) {
    try {
        const { key, contentType } = await request.json()
        
        if (!key) {
            return NextResponse.json({ error: "Key is required" }, { status: 400 })
        }

        const command = new PutObjectCommand({
            Bucket: "myfilemanager-bucket",
            Key: key,
            ContentType: contentType || 'application/octet-stream',
        })

        const presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
        
        return NextResponse.json({ 
            uploadUrl: presignedUrl,
            key: key 
        })
    } catch (error) {
        console.error('Error generating upload URL:', error)
        return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 })
    }
}