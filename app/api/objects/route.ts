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
        const prefix = request.nextUrl.searchParams.get("prefix") ?? ""
        
        // If prefix is provided (we're inside a folder), get files in that folder
        if (prefix) {
            const command = new ListObjectsV2Command({
                Bucket: "myfilemanager-bucket",
                Prefix: prefix,
            })
            const result = await client.send(command)
            
            // Filter out the folder itself and get only files inside the folder
            const files = result.Contents?.filter(e => {
                // Skip the folder itself
                if (e.Key === prefix) return false
                // Only include files that are direct children of this folder
                const relativeKey = e.Key?.substring(prefix.length)
                return relativeKey && !relativeKey.includes("/")
            }).map(e => ({
                Key: e.Key,
                Size: e.Size,
                Type: "file",
            })) ?? []
            
            return NextResponse.json({ items: files })
        }
        
        // If no prefix (root level), get folders and files at root
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
        
        // Get files at current level (excluding the folder itself if it appears in Contents)
        const files = result.Contents?.filter(e => {
            // Skip if it's the folder itself (ends with /)
            if (e.Key?.endsWith("/")) return false
            // Include files that don't contain "/" (files at current level)
            return !e.Key?.includes("/")
        }).map(e => ({
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