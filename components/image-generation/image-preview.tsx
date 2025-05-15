"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { Badge } from "@/components/ui/badge";

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
  return (
    <>
      <Card className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-full">
        <CardContent className="p-0 h-full">
          <div className="relative bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden h-full min-h-[calc(100vh-12rem)]">
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