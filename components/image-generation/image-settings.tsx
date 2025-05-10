"use client";

import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  AlertCircle, 
  Info, 
  Shuffle, 
  Lightbulb,
  MessageCircle,
  Plus,
  Check,
  Trash2,
  Key,
  Save
} from "lucide-react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
}

interface ImageSettingsProps {
  settings: {
    negativePrompt: string;
  };
  setSettings: Dispatch<SetStateAction<{
    negativePrompt: string;
  }>>;
}

export function ImageSettings({ settings, setSettings }: ImageSettingsProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const { toast } = useToast();

  // Load API keys from localStorage on mount
  useEffect(() => {
    const storedKeys = localStorage.getItem('gemini_api_keys');
    if (storedKeys) {
      try {
        setApiKeys(JSON.parse(storedKeys));
      } catch (e) {
        console.error('Failed to parse API keys from localStorage:', e);
      }
    }
  }, []);

  // Initialize local settings with props
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Save API keys to localStorage when they change
  useEffect(() => {
    if (apiKeys.length > 0) {
      try {
        localStorage.setItem('gemini_api_keys', JSON.stringify(apiKeys));
      } catch (e) {
        console.error('Failed to save API keys to localStorage:', e);
      }
    }
  }, [apiKeys]);

  const handleNegativePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalSettings({
      ...localSettings,
      negativePrompt: e.target.value,
    });
  };

  const handleApplySettings = async () => {
    // Show saving state
    setIsSaving(true);
    
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Apply settings from local state to parent component
    setSettings(localSettings);

    // Also ensure API keys are saved
    if (apiKeys.length > 0) {
      try {
        localStorage.setItem('gemini_api_keys', JSON.stringify(apiKeys));
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
    
    // Reset saving state
    setIsSaving(false);
  };

  const addNewKey = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) return;
    
    // Set saving state
    setIsSavingKey(true);
    
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      key: newKeyValue,
      isActive: apiKeys.length === 0, // Make first key active by default
    };
    
    const updatedKeys = [...apiKeys, newKey];
    setApiKeys(updatedKeys);
    
    // Force save to localStorage immediately
    try {
      localStorage.setItem('gemini_api_keys', JSON.stringify(updatedKeys));
      toast({
        title: "API key added",
        description: `"${newKeyName}" has been added to your API keys.`,
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
    const keyName = keyToRemove?.name || 'Key';
    const updatedKeys = apiKeys.filter(key => key.id !== id);
    
    // If we're removing the active key, make another one active
    if (keyToRemove?.isActive && updatedKeys.length > 0) {
      updatedKeys[0].isActive = true;
    }
    
    setApiKeys(updatedKeys);
    
    // Force save to localStorage immediately
    try {
      localStorage.setItem('gemini_api_keys', JSON.stringify(updatedKeys));
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
    // Don't do anything if already active
    if (apiKeys.find(key => key.id === id)?.isActive) return;
    
    const updatedKeys = apiKeys.map(key => ({
      ...key,
      isActive: key.id === id
    }));
    
    setApiKeys(updatedKeys);
    
    // Force save to localStorage immediately
    try {
      localStorage.setItem('gemini_api_keys', JSON.stringify(updatedKeys));
      const activeKey = updatedKeys.find(key => key.id === id);
      if (activeKey) {
        toast({
          title: "API key activated",
          description: `"${activeKey.name}" is now active.`,
          duration: 3000,
        });
      }
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
    <div className="pt-6 pb-2 space-y-8">
     
      <Separator className="bg-zinc-200 dark:bg-zinc-700" />
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-zinc-500" />
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Negative Prompt</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-zinc-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[260px] bg-zinc-800 text-zinc-100 dark:bg-zinc-700">
                    <p className="text-xs">Elements you want to exclude from the generated image</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
                    negativePrompt: localSettings.negativePrompt ? `${localSettings.negativePrompt}, ${example}` : example
                  })}
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <Separator className="bg-zinc-200 dark:bg-zinc-700" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">API Keys</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-zinc-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[260px] bg-zinc-800 text-zinc-100 dark:bg-zinc-700">
                  <p className="text-xs">Manage your Gemini API keys. Keys are stored locally on your device.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 active:scale-[0.97] transition-transform duration-100 group"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1 transition-transform group-hover:rotate-90 duration-200" />
            Add Key
          </Button>
        </div>
        
        {isAdding && (
          <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 dark:text-zinc-400">Key Name</label>
              <Input 
                type="text"
                placeholder="e.g., My Gemini Key 1"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="h-8 text-sm bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 dark:text-zinc-400">API Key</label>
              <Input 
                type="password"
                placeholder="Enter your Gemini API key"
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
          {apiKeys.length > 0 ? (
            apiKeys.map((key) => (
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
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-dashed border-zinc-200 dark:border-zinc-700">
              <Key className="h-8 w-8 text-zinc-400 mb-2" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                No API keys added yet
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center mt-1">
                Add your Gemini API key to use for image generation
              </p>
            </div>
          )}
        </div>
        
        {apiKeys.length > 0 && (
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Your API keys are stored only on this device. The active key will be used for image generation.
            </p>
          </div>
        )}
      </div>
      
      <Separator className="bg-zinc-200 dark:bg-zinc-700" />
      
      
      <div className="pt-4">
        <Button 
          className={cn(
            "w-full relative overflow-hidden transition-all duration-200",
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
              <span className="relative z-10">Save Settings</span>
              <span className="absolute inset-0 transform translate-y-full bg-gradient-to-r from-fuchsia-600 to-violet-600 transition-transform duration-300 ease-out group-hover:translate-y-0"></span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 