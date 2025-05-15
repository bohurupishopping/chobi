import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Trash2, 
  X, 
  RefreshCw, 
  History as HistoryIcon,
  Download,
  ExternalLink,
  ImageIcon,
  Info,
  CheckCircle
} from "lucide-react";

interface HistoryImage {
  id: string;
  blobUrl: string;
  prompt: string;
  timestamp: number;
  projectName: string;
  sequenceNumber: number;
}

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectImage: (image: HistoryImage) => void;
  currentProjectName: string;
}

export function HistoryDialog({ 
  open, 
  onOpenChange, 
  onSelectImage, 
  currentProjectName 
}: HistoryDialogProps) {
  const [images, setImages] = useState<HistoryImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "current">("current");
  const [selectedImage, setSelectedImage] = useState<HistoryImage | null>(null);

  // Fetch images from blob storage
  const fetchImages = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/blob-list', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const data = await response.json();
      setImages(data.images);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
      console.error('Error fetching images:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchImages();
    }
  }, [open]);

  const handleRemoveImage = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch('/api/blob-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      // Refresh the image list
      fetchImages();
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to delete all images? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/blob-clear', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to clear history');
      }

      // Refresh the image list
      fetchImages();
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  const handleImageClick = (image: HistoryImage) => {
    setSelectedImage(image);
  };

  const handleUseImage = () => {
    if (selectedImage) {
      onSelectImage(selectedImage);
      onOpenChange(false);
    }
  };

  const handleDownload = (image: HistoryImage) => {
    const link = document.createElement("a");
    link.href = image.blobUrl;
    link.download = `${image.projectName}-${image.sequenceNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = (image: HistoryImage) => {
    window.open(image.blobUrl, '_blank');
  };

  // Filter images based on view mode
  const filteredImages = viewMode === "current" && currentProjectName
    ? images.filter(img => img.projectName === currentProjectName)
    : images;

  // Group images by project name
  const groupedImages = filteredImages.reduce((acc, image) => {
    const key = image.projectName;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(image);
    return acc;
  }, {} as Record<string, HistoryImage[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] p-0 gap-0 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-zinc-500" />
              <DialogTitle className="text-xl font-semibold">Image History</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      onClick={fetchImages}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh image history</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      onClick={handleClearHistory}
                      disabled={images.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete all history</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 mb-2">
            <Button
              variant={viewMode === "current" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("current")}
              className="h-9 px-4 rounded-full"
            >
              Current Project
            </Button>
            <Button
              variant={viewMode === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("all")}
              className="h-9 px-4 rounded-full"
            >
              All Projects
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 flex gap-6 h-[calc(90vh-140px)]">
          <div className="w-2/3 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 pr-4" style={{ height: '100%' }}>
              <div className="pb-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-500" />
                  </div>
                ) : error ? (
                  <div className="p-4 text-center text-red-500 text-sm bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <Info className="h-4 w-4 mx-auto mb-2" />
                    {error}
                  </div>
                ) : Object.keys(groupedImages).length > 0 ? (
                  <div className="space-y-8 pb-4">
                    {Object.entries(groupedImages).map(([projectName, projectImages]) => (
                      <div key={projectName} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center">
                            <ImageIcon className="h-4 w-4 mr-2 text-zinc-400" />
                            {projectName}
                          </h3>
                          <Badge variant="secondary" className="text-xs px-2 py-1">
                            {projectImages.length} images
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          {projectImages.map((image) => (
                            <div
                              key={image.id}
                              onClick={() => handleImageClick(image)}
                              className={cn(
                                "relative group cursor-pointer rounded-lg overflow-hidden border-2 shadow-sm hover:shadow-md transition-all",
                                selectedImage?.id === image.id
                                  ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-900"
                                  : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-600"
                              )}
                            >
                              <div className="aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                <img
                                  src={image.blobUrl}
                                  alt={`Generated image ${image.sequenceNumber}`}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-0 left-0 right-0 p-2">
                                  <p className="text-white text-xs font-medium">#{image.sequenceNumber}</p>
                                </div>
                                <div className="absolute top-2 right-2 flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 bg-black/70 text-white rounded-full hover:bg-red-500/90 transition-colors"
                                    onClick={(e) => handleRemoveImage(image.id, e)}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              {selectedImage?.id === image.id && (
                                <div className="absolute top-2 left-2">
                                  <div className="bg-blue-500 text-white p-1 rounded-full">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700">
                    <HistoryIcon className="h-10 w-10 mb-3 opacity-30 text-zinc-400" />
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No images found</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Generate some images to see them here</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="w-1/3 border-l border-zinc-200 dark:border-zinc-700 pl-6">
            {selectedImage ? (
              <div className="space-y-5">
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-md">
                  <img
                    src={selectedImage.blobUrl}
                    alt={`Selected image ${selectedImage.sequenceNumber}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center">
                    <Info className="h-4 w-4 mr-2 text-zinc-400" />
                    Image Details
                  </h4>
                  <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400">Project:</span>
                      <span className="font-medium">{selectedImage.projectName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400">Sequence:</span>
                      <span className="font-medium">#{selectedImage.sequenceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400">Date:</span>
                      <span className="font-medium">{new Date(selectedImage.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <Button 
                    onClick={handleUseImage} 
                    className="w-full mb-3 h-10 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Use This Image
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-10"
                      onClick={() => handleDownload(selectedImage)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-10"
                      onClick={() => handleOpenInNewTab(selectedImage)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 mt-16">
                <ImageIcon className="h-10 w-10 mb-3 opacity-30 text-zinc-400" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No image selected</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Click on an image to view details</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 