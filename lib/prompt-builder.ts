interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: {
    style: string;
    background: string;
    cinematicElements: string;
    focalLength: string;
    negativePrompt: string;
  };
}

export const promptTemplates: PromptTemplate[] = [
  {
    id: "no-template",
    name: "No Template",
    description: "Use your prompt directly without any style enhancements or additional details.",
    template: {
      style: "",
      background: "",
      cinematicElements: "",
      focalLength: "",
      negativePrompt: "blurry, low quality, distorted, deformed, ugly, bad anatomy, out of frame, cropped, worst quality, low resolution, bad art"
    }
  },
  {
    id: "indian-anime",
    name: "Indian Anime Cinematic",
    description: "Ultra-detailed Indian anime-inspired style with cinematic composition",
    template: {
      style: "The illustration is rendered in a cinematic, ultra-detailed Indian anime-inspired style. It combines traditional Indian aesthetics with modern anime techniques, focusing on expressive forms, dramatic poses, and highly stylized linework. Color grading is rich and atmospheric, with saturated highlights and deep shadows. Materials such as metal, cloth, and skin are textured with realism-enhancing detail, while effects like glowing energy, fire, and aura elements are illustrated with dynamic brushwork and motion cues.",
      background: "The background features a dark, moody environment that reinforces the scene's tone. It is intentionally blurred with a shallow depth of field, keeping focus on the subject while preserving atmospheric richness. Subtle fog, glowing embers, or mystical particles drift through the background, adding depth and energy. Light sources are strategically placed to provide contrast and silhouette focal elements.",
      cinematicElements: "The artwork is composed in a 16:9 cinematic aspect ratio with a shallow depth of field. High-contrast lighting—such as golden rim lighting or fiery backlight—is used to emphasize forms and isolate the subject from the background. Dynamic highlights and shadows carve out three-dimensionality, while environmental effects like haze, glow, and smoke enhance drama.",
      focalLength: "The scene is depicted with the equivalent of a medium telephoto lens (approximately 85mm–135mm full-frame), creating a cinematic compression effect that enhances subject isolation and intensifies emotional connection.",
      negativePrompt: "blurry, low quality, distorted, deformed, ugly, bad anatomy, out of frame, cropped, worst quality, low resolution, bad art, mutated, extra limbs, poorly drawn face, poorly drawn hands, text, watermark, signature, blurred, grainy, noisy, oversaturated, overexposed"
    }
  },
  // Add more templates here as needed
];

export function buildPrompt(sceneDescription: string, templateId: string = "no-template"): { prompt: string; negativePrompt: string } {
  const template = promptTemplates.find(t => t.id === templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  const { style, background, cinematicElements, focalLength } = template.template;

  // If using no-template, return the scene description directly
  if (templateId === "no-template") {
    return {
      prompt: `${sceneDescription}, best quality, highly detailed`,
      negativePrompt: template.template.negativePrompt
    };
  }

  // Otherwise, build the enhanced prompt using the template
  const enhancedPrompt = `
Scene: ${sceneDescription}

Style: ${style}

Background Details: ${background}

Cinematic Elements: ${cinematicElements}

Technical Details: ${focalLength}

Additional Requirements: masterpiece, best quality, highly detailed, ultra sharp focus, 8k UHD, professional photography, artistic composition
`.trim();

  return {
    prompt: enhancedPrompt,
    negativePrompt: template.template.negativePrompt
  };
} 