"use client";

import { useState, useRef, useEffect } from "react";
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
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageSettings } from "./image-settings";
import { cn } from "@/lib/utils";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ImagePreview } from "./image-preview";
import { buildPrompt, promptTemplates } from "@/lib/prompt-builder";
import { motion } from "framer-motion";

interface ImageModel {
  id: string;
  name: string;
  provider: "gemini" | "together";
  model: string;
}

interface Settings {
  negativePrompt: string;
  seed: number;
  steps: number;
  selectedModel: ImageModel;
  selectedTemplate: string;
}

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

  // Default settings without localStorage dependency
  const defaultSettings: Settings = {
    negativePrompt: promptTemplates[0].template.negativePrompt,
    seed: Math.floor(Math.random() * 1000000),
    steps: 4,
    selectedModel: {
      id: "together-1",
      name: "FLUX.1 Schnell",
      provider: "together",
      model: "black-forest-labs/FLUX.1-schnell-Free"
    },
    selectedTemplate: "no-template"
  };

  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [selectedProvider, setSelectedProvider] = useState<"gemini" | "together">("together");
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Available models
  const availableModels: ImageModel[] = [
    {
      id: "together-1",
      name: "FLUX.1 Schnell",
      provider: "together",
      model: "black-forest-labs/FLUX.1-schnell-Free"
    },
    {
      id: "gemini-1",
      name: "Gemini 2.0 Flash",
      provider: "gemini",
      model: "gemini-2.0-flash-preview-image-generation"
    }
  ];

  // Example loading texts
  const loadingTexts = [
    "Creating your masterpiece...",
    "Finding the perfect colors...",
    "Adding the final touches..."
  ];
  
  // Load settings from localStorage only on client side
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('image_generation_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        setSelectedProvider(parsedSettings.selectedModel?.provider || "together");
      }
      setIsSettingsInitialized(true);
    } catch (e) {
      console.error('Failed to load settings:', e);
      setIsSettingsInitialized(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isSettingsInitialized) {
      try {
        localStorage.setItem('image_generation_settings', JSON.stringify(settings));
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
    }
  }, [settings, isSettingsInitialized]);

  const generateImage = async (inputPrompt: string) => {
    if (!inputPrompt.trim() || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setPrompt(inputPrompt);
    setProgress(0);
    setImageData(null);
    setBlobUrl(null);
    
    // Build the enhanced prompt using the template
    const { prompt: enhancedPrompt, negativePrompt } = buildPrompt(inputPrompt, settings.selectedTemplate);
    
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
      let apiKey = null;
      
      // Only try to access localStorage on the client side
      if (typeof window !== 'undefined') {
        try {
          const storedKeys = localStorage.getItem('ai_api_keys');
          if (storedKeys) {
            const keys = JSON.parse(storedKeys);
            const activeKey = keys.find((key: any) => 
              key.isActive && key.provider === settings.selectedModel?.provider
            );
            if (activeKey) {
              apiKey = activeKey.key;
            }
          }
        } catch (e) {
          console.error('Failed to parse API keys from localStorage:', e);
        }
      }
      
      const apiEndpoint = settings.selectedModel?.provider === "together" 
        ? "/api/generate-image-together" 
        : "/api/generate-image";

      const adjustedSteps = settings.selectedModel?.provider === "together"
        ? Math.min(Math.max(1, settings.steps), 4)
        : settings.steps;
      
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          negativePrompt: negativePrompt,
          seed: settings.seed,
          steps: adjustedSteps,
          apiKey: apiKey,
          model: settings.selectedModel?.model,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      setImageData(data.imageData);
      if (data.blobUrl) {
        setBlobUrl(data.blobUrl);
      }
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
      // Generate a new seed for each regeneration
      setSettings({
        ...settings,
        seed: Math.floor(Math.random() * 1000000)
      });
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
    "A serene mountain landscape at sunset with snow-capped peaks",
    "A modern city street with neon signs and rain-slicked roads",
    "A majestic Indian warrior princess standing atop a mountain peak at sunset, her armor glowing with mystical energy",
    "A futuristic Mumbai cityscape with flying vehicles and holographic temples floating among the clouds",
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

  // Handle settings updates
  const updateSettings = (newSettings: any) => {
    if (typeof newSettings === 'function') {
      // Handle functional updates
      setSettings(prevSettings => {
        const updatedSettings = newSettings(prevSettings);
        return {
          ...prevSettings,
          ...updatedSettings
        };
      });
    } else {
      // Handle direct object updates
      setSettings(prevSettings => ({
        ...prevSettings,
        ...newSettings
      }));
    }
  };

  // Update the handleModelChange function
  const handleModelChange = (modelId: string) => {
    const selectedModel = availableModels.find(model => model.id === modelId);
    if (selectedModel) {
      const updatedSettings = {
        ...settings,
        selectedModel,
        // Adjust steps based on the new provider
        steps: selectedModel.provider === "together" ? 4 : 30
      };
      setSettings(updatedSettings);
      setSelectedProvider(selectedModel.provider);
      
      // Save to localStorage
      try {
        localStorage.setItem('image_generation_settings', JSON.stringify(updatedSettings));
      } catch (e) {
        console.error('Failed to save settings to localStorage:', e);
      }
    }
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
                  <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700"
                      >
                        <Sliders className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </DialogTrigger>
                    <ImageSettings 
                      settings={{
                        negativePrompt: settings.negativePrompt,
                        selectedModel: settings.selectedModel,
                        selectedTemplate: settings.selectedTemplate
                      }} 
                      setSettings={updateSettings}
                      open={isSettingsOpen}
                      onOpenChange={setIsSettingsOpen}
                    />
                  </Dialog>
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
                
                  <motion.button
                    onClick={handleGenerateClick}
                    disabled={isLoading || !inputValue.trim()}
                    className={cn(
                      "w-full h-10 mt-4 relative overflow-hidden",
                      "flex items-center justify-center gap-2",
                      "bg-gradient-to-r from-fuchsia-500 to-violet-500",
                      "text-white text-sm font-medium rounded-xl",
                      "transition-all duration-200",
                      "hover:from-fuchsia-600 hover:to-violet-600",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "group"
                    )}
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    {isLoading ? (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-violet-500" />
                        <div className="absolute inset-0 flex items-center justify-center gap-2">
                          <svg 
                            className="animate-spin h-4 w-4" 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24"
                          >
                            <circle 
                              className="opacity-25" 
                              cx="12" 
                              cy="12" 
                              r="10" 
                              stroke="currentColor" 
                              strokeWidth="4"
                            />
                            <path 
                              className="opacity-75" 
                              fill="currentColor" 
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span className="animate-pulse">Generating...</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/50 to-violet-500/50"
                          initial={{ x: "100%" }}
                          animate={{ x: "0%" }}
                          transition={{
                            duration: 0.5,
                            ease: "easeOut"
                          }}
                        />
                        <Sparkles className="w-4 h-4 relative z-10 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
                        <span className="relative z-10">Generate Image</span>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20"
                          initial={{ scale: 0, opacity: 0 }}
                          whileHover={{ scale: 1, opacity: 1 }}
                          transition={{
                            duration: 0.2,
                            ease: "easeOut"
                          }}
                        />
                      </>
                    )}
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 