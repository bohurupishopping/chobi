"use client";

import { useState, useRef, useEffect } from "react";

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
  Wand2,
  History
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageSettings } from "./image-settings";
import { cn } from "@/lib/utils";

import { Textarea } from "@/components/ui/textarea";
import { ImagePreview } from "./image-preview";
import { buildPrompt, promptTemplates } from "@/lib/prompt-builder";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectForm } from "./project-form";
import { HistoryDialog } from "./history-dialog";
import { PromptImporter } from "./prompt-importer";
import { toast } from "@/components/ui/use-toast";

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
  const [isEnhanceEnabled, setIsEnhanceEnabled] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string>("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Imported prompts state
  const [importedPrompts, setImportedPrompts] = useState<Array<{sceneNumber: number, prompt: string, content?: string}>>([]);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(-1);

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
    
    if (!currentProjectName) {
      setError("Please set a project name before generating images.");
      return;
    }
    
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
        ? "/api/together-model" 
        : "/api/google-model";

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
          projectName: currentProjectName,
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

  const handleGenerateClick = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    setIsLoading(true);
    let finalPrompt = inputValue;

    try {
      // If enhance is enabled, first enhance the prompt
      if (isEnhanceEnabled) {
        setIsEnhancing(true);
        
        // Get OpenAI API key from localStorage
        let apiKey = null;
        try {
          const storedKeys = localStorage.getItem('ai_api_keys');
          if (storedKeys) {
            const keys = JSON.parse(storedKeys);
            const activeKey = keys.find((key: any) => 
              key.isActive && key.provider === "openai"
            );
            if (activeKey) {
              apiKey = activeKey.key;
            }
          }
        } catch (e) {
          console.error('Failed to parse API keys from localStorage:', e);
        }

        if (!apiKey) {
          setError('Please add and activate an OpenAI API key in settings to use prompt enhancement.');
          setIsLoading(false);
          setIsEnhancing(false);
          return;
        }

        try {
          const response = await fetch('/api/enhance-prompt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              prompt: inputValue,
              apiKey: apiKey
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to enhance prompt');
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No reader available');

          const decoder = new TextDecoder();
          let enhancedText = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(5));
                  if (data.error) {
                    throw new Error(data.error);
                  }
                  enhancedText += data.content;
                  setEnhancedPrompt(enhancedText);
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                  if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                    throw e;
                  }
                }
              }
            }
          }

          finalPrompt = enhancedText.trim();
          if (!finalPrompt) {
            throw new Error('Enhanced prompt is empty');
          }
        } catch (error) {
          console.error('Error in enhancement process:', error);
          toast({
            title: "Error",
            description: "Failed to enhance prompt. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          setIsEnhancing(false);
          return;
        }
        
        setIsEnhancing(false);
      }

      // Now generate the image with either the enhanced or original prompt
      await generateImage(finalPrompt);
    } catch (error) {
      console.error('Error in generation process:', error);
      setError(error instanceof Error ? error.message : 'Failed to process request. Please try again.');
    } finally {
      setIsLoading(false);
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

  // Handle selecting image from history
  const handleSelectHistoryImage = (image: any) => {
    if (image.blobUrl) {
      setBlobUrl(image.blobUrl);
    }
    setImageData(image.imageData);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          try {
            const data = JSON.parse(event.target.result as string);
            setImportedPrompts(data);
          } catch (error) {
            console.error('Error parsing imported prompts:', error);
            toast({
              title: 'Error',
              description: 'Failed to import prompts. Please check the file format.',
              variant: 'destructive',
            });
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="w-full h-full p-2 sm:px-4 md:px-6 lg:px-8 sm:py-4 md:py-6 animate-in fade-in-0 duration-500">
      <div className="group relative overflow-hidden w-full h-full bg-card/50 dark:bg-card/50 border border-border/50 dark:border-border/50 rounded-3xl backdrop-blur-xl">
        <div className="w-full h-full grid grid-cols-1 lg:grid-cols-4 gap-2 sm:gap-4 p-2 sm:p-4">
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
              setBlobUrl={setBlobUrl}
            />
          </div>
          
          <div className="w-full flex flex-col gap-3 sm:gap-4">
            <ProjectForm onProjectNameChange={setCurrentProjectName} />
            
            <PromptImporter 
              onPromptSelect={(prompt) => setInputValue(prompt)} 
            />
            
            <Card className="rounded-2xl border border-border/50 dark:border-border/50 bg-card/50 dark:bg-card/50 backdrop-blur-xl h-auto">
              <CardContent className="p-3 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-foreground">Image Prompt</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl bg-background/50 dark:bg-background/50 text-foreground border-border/50 transition-colors duration-300 hover:bg-accent/70"
                      onClick={() => setIsHistoryOpen(true)}
                    >
                      <History className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">History</span>
                    </Button>
                    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl bg-background/50 dark:bg-background/50 text-foreground border-border/50 transition-colors duration-300 hover:bg-accent/70"
                        >
                          <Sliders className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Settings</span>
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
                </div>
                
                <div className="space-y-2">                  
                  <AnimatePresence>
                    <motion.div 
                      className={cn(
                        "transition-all ease-in-out duration-300",
                        isLoading && "opacity-50 pointer-events-none"
                      )}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative">
                        <Textarea
                          ref={textareaRef}
                          placeholder="Describe your image in detail (e.g., 'a serene lake at sunset with mountains in the background')..."
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          className="w-full min-h-[120px] sm:min-h-[200px] max-h-[300px] bg-background/50 dark:bg-background/50 border-border/50 resize-none p-3 sm:p-4 text-foreground placeholder:text-muted-foreground rounded-2xl transition-all duration-300 focus:ring-2 focus:ring-primary/30"
                          disabled={isLoading}
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                
                  <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-10 relative px-3 sm:px-4",
                        "flex items-center justify-center sm:justify-start gap-2",
                        "border border-border/50 rounded-2xl",
                        "transition-all duration-300",
                        isEnhanceEnabled
                          ? "bg-primary/10 dark:bg-primary/20 border-primary/20 dark:border-primary/30"
                          : "bg-background/50 dark:bg-background/50 hover:bg-accent/50 dark:hover:bg-accent/50",
                      )}
                      onClick={() => setIsEnhanceEnabled(!isEnhanceEnabled)}
                    >
                      <div className={cn(
                        "relative flex items-center w-8 h-4 rounded-full transition-colors duration-300",
                        isEnhanceEnabled 
                          ? "bg-primary" 
                          : "bg-muted dark:bg-muted"
                      )}>
                        <div className={cn(
                          "absolute w-3 h-3 rounded-full bg-white transition-transform duration-300 transform",
                          isEnhanceEnabled ? "translate-x-4" : "translate-x-1"
                        )} />
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        isEnhanceEnabled 
                          ? "text-primary dark:text-primary" 
                          : "text-muted-foreground"
                      )}>
                        {isEnhanceEnabled ? "Enhanced" : "Raw"}
                      </span>
                      <Wand2 className={cn(
                        "w-4 h-4",
                        isEnhanceEnabled 
                          ? "text-primary" 
                          : "text-muted-foreground"
                      )} />
                    </Button>

                    <motion.button
                      onClick={handleGenerateClick}
                      disabled={isLoading || !inputValue.trim()}
                      className={cn(
                        "flex-1 h-10 relative overflow-hidden",
                        "flex items-center justify-center gap-2",
                        "bg-gradient-to-r from-primary to-primary/80",
                        "text-white text-sm font-medium rounded-2xl",
                        "transition-all duration-300",
                        "hover:from-primary/90 hover:to-primary/70",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "group"
                      )}
                      whileTap={{ scale: 0.98 }}
                      whileHover={{ scale: 1.01 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {isLoading ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80" />
                          <motion.div 
                            className="absolute inset-0 flex items-center justify-center gap-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
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
                            <span className="animate-pulse">
                              {isEnhancing ? "Enhancing..." : "Generating..."}
                            </span>
                          </motion.div>
                        </>
                      ) : (
                        <>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary/30"
                            initial={{ x: "100%" }}
                            animate={{ x: "0%" }}
                            transition={{
                              duration: 0.5,
                              ease: "easeOut"
                            }}
                          />
                          <Sparkles className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                          <span className="relative z-10">Generate Image</span>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10"
                            initial={{ scale: 0, opacity: 0 }}
                            whileHover={{ scale: 1, opacity: 1 }}
                            transition={{
                              duration: 0.3,
                              ease: "easeOut"
                            }}
                          />
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <HistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        onSelectImage={(image) => {
          if (image.blobUrl) {
            setBlobUrl(image.blobUrl);
            setImageData(`data:image/png;base64,${image.blobUrl.split(',')[1]}`);
          }
        }}
        currentProjectName={currentProjectName}
      />
    </div>
  );
} 