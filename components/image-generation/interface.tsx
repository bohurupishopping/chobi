"use client";

import { useState, useRef } from "react";
import { AIInputWithLoading } from "@/components/ui/ai-input-with-loading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  Share2,
  Sliders,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Sparkles,
  MessageCircle,
  Wand2
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ImageSettings } from "./image-settings";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ImagePreview } from "./image-preview";

export function ImageGenerationInterface() {
  const [imageData, setImageData] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [generation, setGeneration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [settings, setSettings] = useState({
    negativePrompt: "",
    seed: Math.floor(Math.random() * 1000000),
    steps: 30,
  });

  // Example loading texts
  const loadingTexts = [
    "Creating your masterpiece...",
    "Finding the perfect colors...",
    "Adding the final touches..."
  ];
  
  const generateImage = async (inputPrompt: string) => {
    if (!inputPrompt.trim() || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setPrompt(inputPrompt);
    setProgress(0);
    
    // Start progress animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1.5;
      });
    }, 30);
    
    // Rotate loading text
    const textInterval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 1500);
    
    try {
      // Get the active API key from localStorage
      const storedKeys = localStorage.getItem('gemini_api_keys');
      let apiKey = null;
      
      if (storedKeys) {
        try {
          const keys = JSON.parse(storedKeys);
          const activeKey = keys.find((key: any) => key.isActive);
          if (activeKey) {
            apiKey = activeKey.key;
          }
        } catch (e) {
          console.error('Failed to parse API keys from localStorage:', e);
        }
      }
      
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: inputPrompt,
          negativePrompt: settings.negativePrompt,
          seed: Math.floor(Math.random() * 1000000),
          steps: 30,
          apiKey: apiKey, // Pass the API key to the backend
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      setImageData(data.imageData);
      setBlobUrl(data.blobUrl);
      setGeneration(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
      clearInterval(interval);
      clearInterval(textInterval);
    }
  };

  const handleRegenerateImage = () => {
    if (prompt) {
      generateImage(prompt);
    }
  };

  const handleDownload = () => {
    if (!imageData) return;
    
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyImageToClipboard = async () => {
    if (!imageData) return;
    
    try {
      // Use fetch to get the image data - works with both local data URLs and remote Blob URLs
      const response = await fetch(imageData);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
    } catch (err) {
      console.error("Failed to copy image:", err);
    }
  };

  const openInNewTab = () => {
    const urlToOpen = blobUrl || imageData;
    if (urlToOpen) {
      window.open(urlToOpen, '_blank');
    }
  };

  const promptSuggestions = [
    "Professional headshot with neutral background",
    "Artistic portrait with dramatic lighting",
    "Casual portrait in natural outdoor setting",
  ];

  const applyPromptSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    generateImage(suggestion);
  };

  const handleGenerateClick = () => {
    if (inputValue.trim() && !isLoading) {
      generateImage(inputValue);
    }
  };

  // The updated setNegativePrompt function to maintain type safety
  const setNegativePrompt = (negativePrompt: string) => {
    setSettings({
      ...settings,
      negativePrompt
    });
  };

  return (
    <div className="w-full h-full px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="group relative overflow-hidden w-full h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
        <div className="w-full h-full grid grid-cols-1 lg:grid-cols-4 gap-4 p-4">
          <div className="lg:col-span-3 w-full flex flex-col gap-4">
            <ImagePreview
              imageData={imageData}
              blobUrl={blobUrl}
              isLoading={isLoading}
              error={error}
              progress={progress}
              currentTextIndex={currentTextIndex}
              generation={generation}
              loadingTexts={loadingTexts}
              prompt={prompt}
              handleRegenerateImage={handleRegenerateImage}
              handleDownload={handleDownload}
              copyImageToClipboard={copyImageToClipboard}
              openInNewTab={openInNewTab}
              setError={setError}
              setImageData={setImageData}
            />
          </div>
          
          <div className="w-full flex flex-col gap-4">
            <Card className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-auto">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-zinc-500" />
                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Image Prompt</h3>
                  </div>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700"
                      >
                        <Sliders className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SheetHeader>
                        <SheetTitle className="text-zinc-900 dark:text-zinc-100">Image Settings</SheetTitle>
                        
                      </SheetHeader>
                      <ImageSettings 
                        settings={{
                          negativePrompt: settings.negativePrompt
                        }} 
                        setSettings={(newSettings) => {
                          if (typeof newSettings === 'function') {
                            // Handle functional updates (rare case)
                            const updatedSettings = newSettings({ negativePrompt: settings.negativePrompt });
                            setNegativePrompt(updatedSettings.negativePrompt);
                          } else {
                            // Handle direct object updates (common case)
                            setNegativePrompt(newSettings.negativePrompt);
                          }
                        }}
                      />
                    </SheetContent>
                  </Sheet>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-500"></span>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Wand2 className="w-3.5 h-3.5 text-zinc-500" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                        <div className="space-y-1">
                          <h4 className="text-xs font-medium text-zinc-500">Suggestions</h4>
                          <div className="space-y-1">
                            {promptSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => applyPromptSuggestion(suggestion)}
                                className="w-full text-left p-2 text-xs rounded-md text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className={cn(
                    "transition-all ease-in-out duration-200",
                    isLoading && "opacity-50 pointer-events-none"
                  )}>
                    <div className="relative">
                      <Textarea
                        ref={textareaRef}
                        placeholder="Describe your image in detail (e.g., 'a serene lake at sunset with mountains in the background')..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full min-h-[200px] max-h-[300px] bg-zinc-50 dark:bg-zinc-800 border-0 resize-none p-4 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 rounded-xl"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                
                  <button
                    onClick={handleGenerateClick}
                    disabled={isLoading || !inputValue.trim()}
                    className="w-full h-10 mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Image
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 