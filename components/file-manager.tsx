'use client'

import { useState, useEffect } from 'react'
import FileStructure from './file-structure'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2 } from 'lucide-react'

interface FileItem {
  Key: string
  Type: 'folder' | 'file'
  Size?: number
}

const FileManager: React.FC = () => {
  const [items, setItems] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState('')

  const fetchItems = async (path: string = '') => {
    setLoading(true)
    setError(null)
    
    try {
      const url = path ? `/api/objects?prefix=${path}` : '/api/objects'
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setItems(data.items || [])
      setCurrentPath(path)
    } catch (err) {
      console.error('Error fetching items:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleNavigate = (path: string) => {
    fetchItems(path)
  }

  const handleRefresh = () => {
    fetchItems(currentPath)
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">AWS File Manager</h1>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading files...</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <FileStructure
            items={items}
            currentPath={currentPath}
            onNavigate={handleNavigate}
          />
        )}
      </div>
    </div>
  )
}

export default FileManager 