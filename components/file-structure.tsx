'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Folder, File, ChevronRight, ChevronDown, Home, Download, Loader2 } from 'lucide-react'

interface FileItem {
  Key: string
  Type: 'folder' | 'file'
  Size?: number
}

interface FileStructureProps {
  items: FileItem[]
  currentPath?: string
  onNavigate?: (path: string) => void
}

const FileStructure: React.FC<FileStructureProps> = ({ 
  items, 
  currentPath = '', 
  onNavigate 
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [nestedItems, setNestedItems] = useState<Record<string, FileItem[]>>({})
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set())

  const toggleFolder = async (folderKey: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderKey)) {
      newExpanded.delete(folderKey)
    } else {
      newExpanded.add(folderKey)
      // Fetch nested items if not already loaded
      if (!nestedItems[folderKey]) {
        try {
          const response = await fetch(`/api/objects?prefix=${folderKey}`)
          const data = await response.json()
          setNestedItems(prev => ({
            ...prev,
            [folderKey]: data.items || []
          }))
        } catch (error) {
          console.error('Error fetching nested items:', error)
        }
      }
    }
    setExpandedFolders(newExpanded)
  }

  const handleItemClick = (item: FileItem) => {
    if (item.Type === 'folder') {
      toggleFolder(item.Key)
    } else {
      // Handle file click - could open preview, download, etc.
      console.log('File clicked:', item.Key)
    }
  }

  const handleDownload = async (fileKey: string) => {
    setDownloadingFiles(prev => new Set(prev).add(fileKey))
    
    try {
      const response = await fetch(`/api/download?key=${encodeURIComponent(fileKey)}`)
      if (!response.ok) {
        throw new Error('Failed to generate download URL')
      }
      const data = await response.json()
      
      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = data.downloadUrl
      link.download = getDisplayName(fileKey)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Failed to download file')
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(fileKey)
        return newSet
      })
    }
  }

  const navigateToPath = (path: string) => {
    if (onNavigate) {
      onNavigate(path)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const getDisplayName = (key: string) => {
    // Remove trailing slash for folders
    const cleanKey = key.endsWith('/') ? key.slice(0, -1) : key
    // Get the last part of the path
    return cleanKey.split('/').pop() || cleanKey
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateToPath('')}
              className="p-1"
            >
              <Home className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">
              {currentPath ? `Path: ${currentPath}` : 'Root Directory'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items found
              </div>
            ) : (
              items.map((item) => (
                <div key={item.Key} className="w-full">
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                    onClick={() => handleItemClick(item)}
                  >
                    {item.Type === 'folder' ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFolder(item.Key)
                          }}
                        >
                          {expandedFolders.has(item.Key) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <Folder className="h-5 w-5 text-blue-500" />
                      </>
                    ) : (
                      <div className="w-10" /> // Spacer for alignment
                    )}
                    <div className="flex-1 flex items-center gap-2">
                      {item.Type === 'file' && <File className="h-5 w-5 text-gray-500" />}
                      <span className="font-medium">{getDisplayName(item.Key)}</span>
                      {item.Type === 'file' && item.Size && (
                        <span className="text-sm text-muted-foreground">
                          ({formatFileSize(item.Size)})
                        </span>
                      )}
                    </div>
                    
                    {/* Download button for files */}
                    {item.Type === 'file' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(item.Key)
                        }}
                        className="p-2 h-8 w-8"
                        title="Download file"
                        disabled={downloadingFiles.has(item.Key)}
                      >
                        {downloadingFiles.has(item.Key) ? (
                          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 text-blue-500" />
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {/* Nested items for expanded folders */}
                  {item.Type === 'folder' && expandedFolders.has(item.Key) && nestedItems[item.Key] && (
                    <div className="ml-8 mt-2 space-y-1">
                      <FileStructure
                        items={nestedItems[item.Key]}
                        currentPath={item.Key}
                        onNavigate={onNavigate}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FileStructure 