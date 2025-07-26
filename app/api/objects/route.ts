import { NextRequest, NextResponse } from "next/server"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"

const client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY as string,
        secretAccessKey: process.env.AWS_SECRET_KEY as string,
    },
    region: "ap-south-1",
})

export async function GET(request: NextRequest) {
    try {
        // Only root level: prefix is undefined or empty string
        const prefix = request.nextUrl.searchParams.get("prefix") ?? ""
        const command = new ListObjectsV2Command({
            Bucket: "myfilemanager-bucket",
            Delimiter: "/",
            Prefix: prefix,
        })
        const result = await client.send(command)
        const folders = result.CommonPrefixes?.map(e => ({
            Key: e.Prefix,
            Type: "folder",
        })) ?? []
        // Only files at root level (no '/')
        const files = result.Contents?.filter(e => !e.Key?.includes("/")).map(e => ({
            Key: e.Key,
            Size: e.Size,
            Type: "file",
        })) ?? []
        return NextResponse.json({ items: [...folders, ...files] })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Failed to fetch objects" }, { status: 500 })
    }
}