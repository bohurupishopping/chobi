"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type Prompt = {
  sceneNumber: number;
  prompt: string;
  content?: string;
};

interface PromptImporterProps {
  onPromptSelect: (prompt: string) => void;
}

export function PromptImporter({ onPromptSelect }: PromptImporterProps) {
  const [importedPrompts, setImportedPrompts] = useState<Prompt[]>([]);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(-1);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Validate the imported data
        if (Array.isArray(parsed) && parsed.every(item => 
          typeof item.sceneNumber === 'number' && 
          typeof item.prompt === 'string'
        )) {
          setImportedPrompts(parsed);
          setSelectedPromptIndex(0);
          toast({
            title: "Prompts imported successfully",
            description: `Loaded ${parsed.length} prompts`
          });
        } else {
          throw new Error("Invalid format");
        }
      } catch (error) {
        console.error("Error importing prompts:", error);
        toast({
          title: "Import failed",
          description: "Invalid prompts file format. Please export from the Prompt Generator.",
          variant: "destructive",
        });
      }
    };
    reader.onerror = () => {
      toast({
        title: "Import failed",
        description: "Failed to read the file. Please try again.",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  const clearImportedPrompts = () => {
    setImportedPrompts([]);
    setSelectedPromptIndex(-1);
  };

  // Auto-select first prompt when imported
  useEffect(() => {
    if (importedPrompts.length > 0 && selectedPromptIndex === -1) {
      setSelectedPromptIndex(0);
    }
  }, [importedPrompts, selectedPromptIndex]);

  // Update parent when selected prompt changes
  useEffect(() => {
    if (selectedPromptIndex >= 0 && importedPrompts[selectedPromptIndex]) {
      onPromptSelect(importedPrompts[selectedPromptIndex].prompt);
    }
  }, [selectedPromptIndex, importedPrompts, onPromptSelect]);

  const navigatePrompt = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedPromptIndex > 0) {
      setSelectedPromptIndex(prev => prev - 1);
    } else if (direction === 'next' && selectedPromptIndex < importedPrompts.length - 1) {
      setSelectedPromptIndex(prev => prev + 1);
    }
  };

  if (importedPrompts.length === 0) {
    return (
      <div className="space-y-2 mb-6">
        <Label htmlFor="import-prompts" className="block text-sm font-medium mb-1">
          Import Prompts
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="import-prompts"
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="cursor-pointer"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Import a JSON file with prompts exported from the Prompt Generator
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-6 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Imported Prompts</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearImportedPrompts}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigatePrompt('prev')}
            disabled={selectedPromptIndex <= 0}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Select
            value={selectedPromptIndex.toString()}
            onValueChange={(value) => setSelectedPromptIndex(parseInt(value))}
          >
            <SelectTrigger className="flex-1">
              <SelectValue>
                {selectedPromptIndex >= 0 
                  ? `Scene ${importedPrompts[selectedPromptIndex]?.sceneNumber}`
                  : 'Select a prompt'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {importedPrompts.map((item, index) => (
                <SelectItem key={index} value={index.toString()}>
                  Scene {item.sceneNumber}: {item.prompt.substring(0, 35)}{item.prompt.length > 35 ? '...' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigatePrompt('next')}
            disabled={selectedPromptIndex >= importedPrompts.length - 1}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            {importedPrompts.length > 0 && selectedPromptIndex >= 0
              ? `Prompt ${selectedPromptIndex + 1} of ${importedPrompts.length}`
              : 'No prompts'}
          </span>
          {selectedPromptIndex >= 0 && (
            <span className="font-medium">
              Scene {importedPrompts[selectedPromptIndex]?.sceneNumber}
            </span>
          )}
        </div>
        
        {selectedPromptIndex >= 0 && importedPrompts[selectedPromptIndex]?.content && (
          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded border">
            <p className="whitespace-pre-line">{importedPrompts[selectedPromptIndex].content}</p>
          </div>
        )}
      </div>
    </div>
  );
}
