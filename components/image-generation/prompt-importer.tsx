"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Upload, X } from "lucide-react";
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

  const handleUsePrompt = () => {
    if (selectedPromptIndex >= 0 && importedPrompts[selectedPromptIndex]) {
      onPromptSelect(importedPrompts[selectedPromptIndex].prompt);
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
      
      <div className="space-y-2">
        <div className="grid gap-2">
          <Select
            value={selectedPromptIndex.toString()}
            onValueChange={(value) => setSelectedPromptIndex(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a prompt" />
            </SelectTrigger>
            <SelectContent>
              {importedPrompts.map((item, index) => (
                <SelectItem key={index} value={index.toString()}>
                  Scene {item.sceneNumber}: {item.prompt.substring(0, 40)}{item.prompt.length > 40 ? '...' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedPromptIndex >= 0 && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <div className="font-medium">Scene {importedPrompts[selectedPromptIndex].sceneNumber}</div>
              <p className="line-clamp-2">
                {importedPrompts[selectedPromptIndex].content || 'No description available'}
              </p>
            </div>
          )}
          
          <Button 
            onClick={handleUsePrompt}
            disabled={selectedPromptIndex < 0}
            className="w-full"
          >
            Use Selected Prompt
          </Button>
        </div>
      </div>
    </div>
  );
}
