"use client";

import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Info,
  Lightbulb,
  MessageCircle,
  Plus,
  Check,
  Trash2,
  Key,
  Save,
  Image,
  X,
  Wand2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { promptTemplates } from "@/lib/prompt-builder";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  provider: "gemini" | "together";
}

interface ImageModel {
  id: string;
  name: string;
  provider: "gemini" | "together";
  model: string;
}

interface ImageSettingsProps {
  settings: {
    negativePrompt: string;
    selectedModel?: ImageModel;
    selectedTemplate: string;
  };
  setSettings: Dispatch<SetStateAction<any>>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ImageSettings({ settings, setSettings, open, onOpenChange }: ImageSettingsProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"gemini" | "together">("gemini");
  const { toast } = useToast();

  // Available models
  const availableModels: ImageModel[] = [
    {
      id: "gemini-1",
      name: "Gemini 2.0 Flash",
      provider: "gemini",
      model: "gemini-2.0-flash-preview-image-generation"
    },
    {
      id: "together-1",
      name: "FLUX.1 Schnell",
      provider: "together",
      model: "black-forest-labs/FLUX.1-schnell-Free"
    }
  ];

  // Load API keys from localStorage only on client side
  useEffect(() => {
    try {
      const storedKeys = localStorage.getItem('ai_api_keys');
      if (storedKeys) {
        setApiKeys(JSON.parse(storedKeys));
      }
      setIsInitialized(true);
    } catch (e) {
      console.error('Failed to parse API keys from localStorage:', e);
      setIsInitialized(true);
    }
  }, []);

  // Initialize local settings with props
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Save API keys to localStorage when they change
  useEffect(() => {
    if (isInitialized && apiKeys.length > 0) {
      try {
        localStorage.setItem('ai_api_keys', JSON.stringify(apiKeys));
      } catch (e) {
        console.error('Failed to save API keys to localStorage:', e);
      }
    }
  }, [apiKeys, isInitialized]);

  const handleNegativePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalSettings({
      ...localSettings,
      negativePrompt: e.target.value,
    });
  };

  const handleModelChange = (modelId: string) => {
    const selectedModel = availableModels.find(model => model.id === modelId);
    if (selectedModel) {
      setLocalSettings({
        ...localSettings,
        selectedModel
      });
      setSelectedProvider(selectedModel.provider);
      
      // Save selected model to localStorage
      try {
        localStorage.setItem('selected_image_model', JSON.stringify(selectedModel));
      } catch (e) {
        console.error('Failed to save selected model to localStorage:', e);
      }
    }
  };

  const handleTemplateChange = (templateId: string) => {
    const template = promptTemplates.find(t => t.id === templateId);
    if (template) {
      setLocalSettings({
        ...localSettings,
        selectedTemplate: templateId,
        negativePrompt: template.template.negativePrompt
      });
    }
  };

  const handleApplySettings = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 400));
    setSettings(localSettings);

    if (apiKeys.length > 0) {
      try {
        localStorage.setItem('ai_api_keys', JSON.stringify(apiKeys));
        toast({
          title: "Settings saved",
          description: "Your settings and API keys have been saved.",
          duration: 3000,
        });
      } catch (e) {
        console.error('Failed to save API keys to localStorage:', e);
        toast({
          title: "Error saving API keys",
          description: "There was an error saving your API keys.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } else {
      toast({
        title: "Settings saved",
        description: "Your settings have been saved.",
        duration: 3000,
      });
    }
    
    setIsSaving(false);
    if (onOpenChange) onOpenChange(false);
  };

  const addNewKey = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) return;
    
    setIsSavingKey(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      key: newKeyValue,
      provider: selectedProvider,
      isActive: !apiKeys.some(k => k.provider === selectedProvider), // Make first key of provider active by default
    };
    
    const updatedKeys = [...apiKeys, newKey];
    setApiKeys(updatedKeys);
    
    try {
      localStorage.setItem('ai_api_keys', JSON.stringify(updatedKeys));
      toast({
        title: "API key added",
        description: `"${newKeyName}" has been added to your ${selectedProvider.toUpperCase()} API keys.`,
        duration: 3000,
      });
    } catch (e) {
      console.error('Failed to save API keys to localStorage:', e);
      toast({
        title: "Error saving API key",
        description: "There was an error saving your API key.",
        variant: "destructive",
        duration: 3000,
      });
    }
    
    setNewKeyName('');
    setNewKeyValue('');
    setIsSavingKey(false);
    setIsAdding(false);
  };

  const removeKey = async (id: string) => {
    const keyToRemove = apiKeys.find(key => key.id === id);
    if (!keyToRemove) return;

    const keyName = keyToRemove.name;
    const provider = keyToRemove.provider;
    const updatedKeys = apiKeys.filter(key => key.id !== id);
    
    // If we're removing the active key, make another one active for the same provider
    if (keyToRemove.isActive) {
      const nextKey = updatedKeys.find(k => k.provider === provider);
      if (nextKey) {
        nextKey.isActive = true;
      }
    }
    
    setApiKeys(updatedKeys);
    
    try {
      localStorage.setItem('ai_api_keys', JSON.stringify(updatedKeys));
      toast({
        title: "API key removed",
        description: `"${keyName}" has been removed.`,
        duration: 3000,
      });
    } catch (e) {
      console.error('Failed to save API keys to localStorage:', e);
    }
  };

  const setActiveKey = async (id: string) => {
    const keyToActivate = apiKeys.find(key => key.id === id);
    if (!keyToActivate || keyToActivate.isActive) return;

    const provider = keyToActivate.provider;
    
    const updatedKeys = apiKeys.map(key => ({
      ...key,
      isActive: key.id === id || (key.isActive && key.provider !== provider)
    }));
    
    setApiKeys(updatedKeys);
    
    try {
      localStorage.setItem('ai_api_keys', JSON.stringify(updatedKeys));
      toast({
        title: "API key activated",
        description: `"${keyToActivate.name}" is now active for ${provider.toUpperCase()}.`,
        duration: 3000,
      });
    } catch (e) {
      console.error('Failed to save API keys to localStorage:', e);
    }
  };

  const negativePromptExamples = [
    "blurry, low quality, distortion",
    "deformed, ugly, bad anatomy",
    "out of frame, cropped, worst quality",
    "disfigured, low resolution, bad art"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 gap-0 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Image Settings</DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            Configure your image generation settings and API keys
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[600px] px-6">
          <div className="space-y-8 py-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-zinc-500" />
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Prompt Template</h3>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-zinc-400" />
                    </TooltipTrigger>
                    <TooltipContent className="w-80 p-3">
                      <p className="text-sm">
                        Choose "No Template" to use your prompt directly, or select a style template to enhance your prompt with predefined artistic and technical details.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <Select 
                value={localSettings.selectedTemplate} 
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                  <SelectGroup>
                    <SelectLabel className="text-zinc-500">Available Templates</SelectLabel>
                    {promptTemplates.map((template) => (
                      <SelectItem 
                        key={template.id} 
                        value={template.id}
                        className="text-zinc-900 dark:text-zinc-100"
                      >
                        <div className="flex items-center gap-2">
                          <span>{template.name}</span>
                          {template.id === "no-template" ? (
                            <Badge 
                              variant="outline" 
                              className="ml-2 text-xs py-0 h-5 bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                            >
                              Basic
                            </Badge>
                          ) : (
                            <Badge 
                              variant="outline" 
                              className="ml-2 text-xs py-0 h-5 bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400 border-violet-200 dark:border-violet-800"
                            >
                              Enhanced
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <div className="text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg">
                <p className="font-medium mb-2">Template Description</p>
                <p>{promptTemplates.find(t => t.id === localSettings.selectedTemplate)?.description}</p>
                {localSettings.selectedTemplate === "no-template" && (
                  <p className="mt-2 text-xs">
                    Your prompt will be used directly with minimal enhancements for quality control.
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-zinc-500" />
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Model Selection</h3>
              </div>
              
              <Select 
                value={localSettings.selectedModel?.id || availableModels[0].id} 
                onValueChange={handleModelChange}
              >
                <SelectTrigger className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                  <SelectGroup>
                    <SelectLabel className="text-zinc-500">Available Models</SelectLabel>
                    {availableModels.map((model) => (
                      <SelectItem 
                        key={model.id} 
                        value={model.id}
                        className="text-zinc-900 dark:text-zinc-100"
                      >
                        <div className="flex items-center gap-2">
                          <span>{model.name}</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "ml-2 text-xs py-0 h-5",
                              model.provider === "gemini" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" : 
                              "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                            )}
                          >
                            {model.provider === "gemini" ? "Gemini" : "Together AI"}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <Separator className="bg-zinc-200 dark:bg-zinc-700" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-zinc-500" />
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Negative Prompt</h3>
              </div>
              
              <Textarea
                placeholder="Describe what you want to avoid in the image..."
                value={localSettings.negativePrompt}
                onChange={handleNegativePromptChange}
                className="resize-none h-24 text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
              />
              
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Suggestions</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {negativePromptExamples.map(example => (
                    <Button
                      key={example}
                      variant="outline"
                      size="sm"
                      className="h-auto py-1 text-xs rounded-full bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                      onClick={() => setLocalSettings({
                        ...localSettings,
                        negativePrompt: localSettings.negativePrompt ? `${localSettings.negativePrompt}, ${example}` : example
                      })}
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <Separator className="bg-zinc-200 dark:bg-zinc-700" />
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-zinc-500" />
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">API Keys</h3>
                </div>
              </div>

              <Tabs defaultValue="gemini" className="w-full" onValueChange={(v) => setSelectedProvider(v as "gemini" | "together")}>
                <TabsList className="w-full bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                  <TabsTrigger 
                    value="gemini" 
                    className="w-1/2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900"
                  >
                    Gemini
                  </TabsTrigger>
                  <TabsTrigger 
                    value="together" 
                    className="w-1/2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900"
                  >
                    Together AI
                  </TabsTrigger>
                </TabsList>

                {["gemini", "together"].map((provider) => (
                  <TabsContent key={provider} value={provider} className="mt-4">
                    <div className="space-y-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-9 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                        onClick={() => setIsAdding(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add {provider === "gemini" ? "Gemini" : "Together AI"} Key
                      </Button>

                      {isAdding && selectedProvider === provider && (
                        <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                          <div className="space-y-2">
                            <label className="text-xs text-zinc-500 dark:text-zinc-400">Key Name</label>
                            <Input 
                              type="text"
                              placeholder={`e.g., My ${provider === "gemini" ? "Gemini" : "Together AI"} Key 1`}
                              value={newKeyName}
                              onChange={(e) => setNewKeyName(e.target.value)}
                              className="h-8 text-sm bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-zinc-500 dark:text-zinc-400">API Key</label>
                            <Input 
                              type="password"
                              placeholder={`Enter your ${provider === "gemini" ? "Gemini" : "Together AI"} API key`}
                              value={newKeyValue}
                              onChange={(e) => setNewKeyValue(e.target.value)}
                              className="h-8 text-sm bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                              onClick={() => setIsAdding(false)}
                              disabled={isSavingKey}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className={cn(
                                "h-7 relative overflow-hidden",
                                "bg-emerald-500 hover:bg-emerald-600 text-white",
                                "active:scale-[0.98] active:duration-75",
                                isSavingKey && "pointer-events-none"
                              )}
                              onClick={addNewKey}
                              disabled={!newKeyName.trim() || !newKeyValue.trim() || isSavingKey}
                            >
                              {isSavingKey ? (
                                <>
                                  <span className="absolute inset-0 flex items-center justify-center">
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  </span>
                                  <span className="opacity-0">Save Key</span>
                                </>
                              ) : (
                                "Save Key"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {apiKeys.filter(key => key.provider === provider).map((key) => (
                          <div 
                            key={key.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                          >
                            <div className="flex items-center gap-3">
                              <Button
                                variant={key.isActive ? "default" : "ghost"}
                                size="sm"
                                className={cn(
                                  "h-6 w-6 p-0 rounded-full transition-all duration-200",
                                  key.isActive ? "bg-emerald-500 hover:bg-emerald-600" : "hover:bg-zinc-100 dark:hover:bg-zinc-700",
                                  "active:scale-[0.94] active:duration-75"
                                )}
                                onClick={() => setActiveKey(key.id)}
                              >
                                {key.isActive && (
                                  <Check className="h-3.5 w-3.5 text-white transition-opacity animate-in fade-in duration-200" />
                                )}
                              </Button>
                              <div>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{key.name}</p>
                                <p className="text-xs text-zinc-500">
                                  {key.key.substring(0, 4)}****{key.key.substring(key.key.length - 4)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors active:scale-[0.94] active:duration-75"
                              onClick={() => removeKey(key.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}

                        {apiKeys.filter(key => key.provider === provider).length === 0 && (
                          <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-dashed border-zinc-200 dark:border-zinc-700">
                            <Key className="h-8 w-8 text-zinc-400 mb-2" />
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                              No {provider === "gemini" ? "Gemini" : "Together AI"} API keys added
                            </p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center mt-1">
                              Add your {provider === "gemini" ? "Gemini" : "Together AI"} API key to use for image generation
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-700 rounded-b-2xl">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="bg-white dark:bg-zinc-800"
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button 
              className={cn(
                "relative overflow-hidden transition-all duration-200",
                "bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white",
                "hover:from-fuchsia-600 hover:to-violet-600",
                "active:scale-[0.98] active:duration-75",
                isSaving && "pointer-events-none"
              )}
              onClick={handleApplySettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg 
                      className="animate-spin h-5 w-5 text-white" 
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
                      ></circle>
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </span>
                  <span className="opacity-0">Save Settings</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 