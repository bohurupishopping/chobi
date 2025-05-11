"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Loader2,
  RefreshCw,
  Share2,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Download,
  X,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingAnimation } from "@/components/ui/loading-animation";

interface ImageHistoryItem {
  id: string;
  imageData: string;
  prompt: string;
  timestamp: number;
  blobUrl?: string;
}

interface ImagePreviewProps {
  imageData: string | null;
  blobUrl?: string | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  currentTextIndex: number;
  generation: number;
  loadingTexts: string[];
  prompt: string;
  handleRegenerateImage: () => void;
  handleDownload: () => void;
  copyImageToClipboard: () => void;
  openInNewTab: () => void;
  setError: (error: string | null) => void;
  setImageData: (imageData: string) => void;
  setBlobUrl?: (blobUrl: string | null) => void;
}

export function ImagePreview({
  imageData,
  blobUrl,
  isLoading,
  error,
  progress,
  currentTextIndex,
  generation,
  loadingTexts,
  prompt,
  handleRegenerateImage,
  handleDownload,
  copyImageToClipboard,
  openInNewTab,
  setError,
  setImageData,
  setBlobUrl,
}: ImagePreviewProps) {
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([]);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(true);
  const isSelectingFromHistory = useRef(false);
  const lastGenerationRef = useRef(generation);

  // Load image history from localStorage on component mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('imageHistory');
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory);
        // Ensure all required fields are present
        const validHistory = parsedHistory.filter((item: any) => 
          item.id && (item.imageData || item.blobUrl) && item.prompt && item.timestamp
        );
        setImageHistory(validHistory);
      } catch (e) {
        console.error('Failed to parse image history from localStorage:', e);
        // Clear invalid history
        localStorage.removeItem('imageHistory');
      }
    }
  }, []);

  // Update history when a new image is generated
  useEffect(() => {
    if (imageData && prompt && !isLoading && !isSelectingFromHistory.current && generation !== lastGenerationRef.current) {
      lastGenerationRef.current = generation;
      
      const newHistoryItem: ImageHistoryItem = {
        id: `img-${Date.now()}`,
        imageData,
        prompt,
        timestamp: Date.now(),
        blobUrl: blobUrl || undefined,
      };

      setImageHistory(prevHistory => {
        // Check if this image already exists in history
        const imageExists = prevHistory.some(
          item => (item.imageData && item.imageData === imageData) || 
                 (item.blobUrl && item.blobUrl === blobUrl)
        );

        if (!imageExists) {
          // Add new image to history and limit to 10 items
          const updatedHistory = [newHistoryItem, ...prevHistory].slice(0, 10);
          
          // Save to localStorage
          try {
            localStorage.setItem('imageHistory', JSON.stringify(updatedHistory));
          } catch (e) {
            console.error('Failed to save image history:', e);
          }
          
          return updatedHistory;
        }
        
        return prevHistory;
      });
    }
    
    isSelectingFromHistory.current = false;
  }, [imageData, blobUrl, prompt, generation, isLoading]);

  const handleSelectHistoryImage = (historyItem: ImageHistoryItem) => {
    isSelectingFromHistory.current = true;
    if (historyItem.imageData) {
      setImageData(historyItem.imageData);
    }
    if (historyItem.blobUrl && setBlobUrl) {
      setBlobUrl(historyItem.blobUrl);
    }
  };

  const handleClearHistory = async () => {
    try {
      // Delete all images from Blob storage first
      const imagesToDelete = imageHistory.filter(item => item.blobUrl);
      
      // Create delete promises for all items with blob URLs
      const deletePromises = imagesToDelete.map(item => 
        fetch('/api/blob-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            blobUrl: item.blobUrl
          }),
        }).catch(err => console.error(`Failed to delete image: ${item.blobUrl}`, err))
      );
      
      // Execute all delete operations in parallel
      await Promise.allSettled(deletePromises);
    } catch (error) {
      console.error('Error clearing image history from Blob storage:', error);
    }
    
    // Clear local state and storage regardless of blob deletion success
    setImageHistory([]);
    localStorage.removeItem('imageHistory');
  };

  const handleRemoveHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Find the item to remove
    const itemToRemove = imageHistory.find(item => item.id === id);
    
    // Remove from Blob storage if it has a blob URL
    if (itemToRemove?.blobUrl) {
      try {
        const response = await fetch('/api/blob-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            blobUrl: itemToRemove.blobUrl
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to delete image from Blob storage');
        }
      } catch (error) {
        console.error('Error deleting image from Blob storage:', error);
      }
    }
    
    // Update state and local storage regardless of blob deletion success
    const updatedHistory = imageHistory.filter(item => item.id !== id);
    setImageHistory(updatedHistory);
    
    // Store only minimal data in localStorage
    const minimalHistory = updatedHistory.map(item => ({
      id: item.id,
      imageData: item.imageData,
      blobUrl: item.blobUrl || '',
      prompt: item.prompt,
      timestamp: item.timestamp,
    }));
    
    try {
      localStorage.setItem('imageHistory', JSON.stringify(minimalHistory));
    } catch (storageError) {
      console.error('Storage error:', storageError);
    }
  };

  const toggleHistorySidebar = () => {
    setIsHistorySidebarOpen(!isHistorySidebarOpen);
  };

  return (
    <>
      <Card className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-full">
        <CardContent className="p-0 h-full">
          <div className="flex h-full">
            {/* History Sidebar */}
            <div 
              className={cn(
                "transition-all duration-300 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-800/50",
                isHistorySidebarOpen ? "w-[80px]" : "w-0"
              )}
            >
              {isHistorySidebarOpen && (
                <div className="h-full flex flex-col">
                  <div className="p-2 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">History</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 p-0 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            onClick={handleClearHistory}
                            disabled={imageHistory.length === 0}
                          >
                            <Trash2 className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>Clear all history</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <ScrollArea className="flex-1">
                    <div className="p-2 flex flex-col gap-2">
                      {imageHistory.length > 0 ? (
                        imageHistory.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSelectHistoryImage(item)}
                            className="relative group cursor-pointer rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all"
                          >
                            <div className="aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                              <img
                                src={item.blobUrl || item.imageData}
                                alt={item.prompt.substring(0, 10) + "..."}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // If blob URL fails, try imageData
                                  if (item.blobUrl && item.imageData && e.currentTarget.src === item.blobUrl) {
                                    e.currentTarget.src = item.imageData;
                                  }
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 absolute top-0.5 right-0.5 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => handleRemoveHistoryItem(item.id, e)}
                              >
                                <X className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white text-[8px]">{new Date(item.timestamp).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center p-2 h-20 text-zinc-400 dark:text-zinc-500">
                          <p className="text-[9px] text-center">No history yet</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* Preview Area */}
            <div className="flex-1 relative">
              <div
                className="relative bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden h-full min-h-[calc(100vh-12rem)]"
              >
                {imageData ? (
                  <img
                    src={blobUrl || imageData}
                    alt="Generated image"
                    className="w-full h-auto object-contain aspect-video max-h-[calc(100vh-16rem)]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400 p-8">
                    <div className="bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 flex flex-col items-center gap-3">
                      <div className="relative aspect-video w-48 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg flex items-center justify-center">
                        <ImageIcon size={32} strokeWidth={1} className="text-zinc-400" />
                        <div className="absolute inset-0 border border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg pointer-events-none"></div>
                      </div>
                      <p className="text-sm max-w-[280px] text-center">
                        Your generated 16:9 image will appear here
                      </p>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <LoadingAnimation
                    progress={progress}
                    text={loadingTexts[currentTextIndex]}
                    subText="This usually takes 10-15 seconds"
                  />
                )}

                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/20 dark:bg-zinc-900/60 backdrop-blur-sm">
                    <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl max-w-xs text-center border border-red-200 dark:border-red-800/30">
                      <p className="text-red-600 dark:text-red-400 font-medium">Generation Error</p>
                      <p className="text-sm mt-2 text-red-600/80 dark:text-red-400/80">{error}</p>
                      <Button
                        variant="outline"
                        className="mt-4 border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400"
                        onClick={() => setError(null)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}

                {/* Toggle sidebar button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-2 left-2 h-8 w-8 rounded-full bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700"
                  onClick={toggleHistorySidebar}
                >
                  {isHistorySidebarOpen ? (
                    <ChevronLeft className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {imageData && (
            <Badge variant="outline" className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
              Generation #{generation}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {imageData && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg h-9 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      onClick={handleRegenerateImage}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-800 text-zinc-100 dark:bg-zinc-700">
                    <p>Create a new image with the same prompt</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg h-9 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      onClick={handleDownload}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-800 text-zinc-100 dark:bg-zinc-700">
                    <p>Save image to your device</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg h-9 w-9 p-0 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      onClick={copyImageToClipboard}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-800 text-zinc-100 dark:bg-zinc-700">
                    <p>Copy to clipboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg h-9 w-9 p-0 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      onClick={openInNewTab}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-800 text-zinc-100 dark:bg-zinc-700">
                    <p>Open in new tab</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg h-9 w-9 p-0 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-800 text-zinc-100 dark:bg-zinc-700">
                    <p>Share this image</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </div>
    </>
  );
} 