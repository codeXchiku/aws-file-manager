'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Loader2 } from 'lucide-react'

interface UploadButtonProps {
  folderPath: string
  onUploadComplete?: () => void
  className?: string
}

const UploadButton: React.FC<UploadButtonProps> = ({ 
  folderPath, 
  onUploadComplete,
  className = ""
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    
    try {
      // Create the full key path for the file
      const fileName = file.name
      const key = folderPath ? `${folderPath}${fileName}` : fileName
      
      // Get presigned URL for upload
      const response = await fetch('/api/upload', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: key,
          contentType: file.type,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { uploadUrl } = await response.json()

      // Upload file directly to S3 using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      console.log('File uploaded successfully:', key)
      
      // Call the callback to refresh the file list
      if (onUploadComplete) {
        onUploadComplete()
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept="*/*"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={triggerFileSelect}
        disabled={isUploading}
        className="p-2 h-8 w-8"
        title={`Upload file to ${folderPath || 'root'}`}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 text-green-500 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 text-green-500" />
        )}
      </Button>
    </div>
  )
}

export default UploadButton 