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
      style: "The illustration is rendered in a cinematic, ultra-detailed Indian anime-inspired style. It combines Indian aesthetics with modern anime techniques, focusing on expressive forms, dramatic poses, and highly stylized linework. Color grading is rich and atmospheric, with saturated highlights and deep shadows. Materials such as metal, cloth, and skin are textured with realism-enhancing detail, while effects like glowing energy, fire, and aura elements are illustrated with dynamic brushwork and motion cues. Characters wear modern Indian attire such as tailored pants, stylish shirts, vibrant sarees, or contemporary local dresses, reflecting urban and rural Indian fashion with a nod to cultural elegance. The color palette is vibrant yet balanced, featuring jewel-toned hues inspired by Indian textiles and festivals, with luminous highlights and velvety shadows. Textures—such as crisp cotton fabrics, flowing silk sarees with meticulous detail, enhancing",
      background: "The background features a dark, moody environment that reinforces the scene's tone. It is intentionally blurred with a shallow depth of field, keeping focus on the subject while preserving atmospheric richness. Subtle fog, glowing embers, or mystical particles drift through the background, adding depth and energy. Light sources are strategically placed to provide contrast and silhouette focal elements.",
      cinematicElements: "The artwork is composed in a 16:9 cinematic aspect ratio with a shallow depth of field. High-contrast lighting—such as golden rim lighting or fiery backlight—is used to emphasize forms and isolate the subject from the background. Dynamic highlights and shadows carve out three-dimensionality, while environmental effects like haze, glow, and smoke enhance drama.",
      focalLength: "The scene is depicted with the equivalent of a medium telephoto lens (approximately 85mm–135mm full-frame), creating a cinematic compression effect that enhances subject isolation and intensifies emotional connection.",
      negativePrompt: "blurry, low quality, distorted, deformed, ugly, bad anatomy, out of frame, cropped, worst quality, low resolution, bad art, mutated, extra limbs, poorly drawn face, poorly drawn hands, text, watermark, signature, blurred, grainy, noisy, oversaturated, overexposed"
    }
  },
  {
    "id": "indian-anime-cinematic-modern",
    "name": "Indian Anime Cinematic Modern",
    "description": "A vibrant, ultra-detailed Indian anime-inspired style with cinematic composition, showcasing modern Indian characters in contemporary and regional attire, blending cultural authenticity with dynamic anime artistry",
    "template": {
      "style": "The illustration is rendered in a hyper-detailed, cinematic Indian anime-inspired style, fusing modern Indian fashion with cutting-edge anime techniques. Characters are depicted in expressive, dynamic poses with fluid, stylized linework that conveys emotion and movement. Characters wear modern-Indian attire such as tailored pants, stylish shirts, vibrant sarees, or contemporary local dresses, reflecting urban and rural Indian fashion with a nod to cultural elegance. The color palette is vibrant yet balanced, featuring jewel-toned hues inspired by Indian textiles and festivals, with luminous highlights and velvety shadows. Textures—such as crisp cotton fabrics, flowing silk sarees, and lifelike skin—are rendered with meticulous detail, enhancing realism. Visual effects like radiant energy, swirling flames, or ethereal auras are depicted with vibrant, kinetic brushwork, incorporating motion blur and particle effects for a sense of vitality and power",
      "background": "The background is a rich, atmospheric setting that complements the modern Indian vibe—think bustling urban streets at twilight, serene rural landscapes with mustard fields, or vibrant festival markets. It's rendered with a subtle bokeh effect and shallow depth of field to keep the focus on the characters. Environmental details, like drifting flower petals, glowing streetlights, or shimmering monsoon droplets, add a poetic touch. Strategic light sources—neon signs, golden sunset glow, or colorful festival lamps—create dramatic silhouettes and enhance depth with volumetric lighting and soft god rays.",
      "cinematicElements": "The artwork is framed in a widescreen 16:9 aspect ratio with a shallow depth of field for a theatrical, immersive experience. Lighting is high-contrast and emotive, using techniques like warm streetlamp glow, vibrant festival lighting, or soft natural rim lighting to sculpt characters and evoke mood. Shadows are deep and defined, adding three-dimensionality, while environmental effects like urban haze, confetti bursts, or gentle rain enhance drama. Subtle lens flares or light leaks are sparingly used to elevate the cinematic polish.",
      "focalLength": "The scene is captured with the equivalent of a medium telephoto lens (approximately 85mm–135mm full-frame), delivering a cinematic compression effect that isolates characters, flattens perspective for a painterly quality, and fosters an intimate emotional connection with the viewer.",
      "negativePrompt": "blurry, low quality, distorted, deformed, unnatural proportions, bad anatomy, out of frame, cropped, low resolution, amateurish, mutated, extra limbs, poorly drawn facial features, poorly drawn hands, text artifacts, watermarks, signatures, grainy textures, excessive noise, oversaturated colors, overexposed highlights, unbalanced composition, unrealistic lighting, outdated or stereotypical costumes, god-like armor, overly fantastical elements"
    }
  },
  {
    "id": "indian-anime-cinematic-normal",
    "name": "Indian Animation Cinematic Normal",
    "description": "A breathtaking, ultra-detailed Indian anime-inspired style with grandiose cinematic composition, blending vibrant cultural heritage with dynamic anime artistry",
    "template": {
      "style": "The illustration is crafted in a hyper-detailed, cinematic Indian anime-inspired style, seamlessly merging traditional Indian artistry with cutting-edge anime techniques. It emphasizes fluid, expressive character designs, bold and dynamic poses, and intricate, stylized linework that captures emotional intensity. Characters wear modern Indian attire such as tailored pants, stylish shirts, vibrant sarees, or contemporary local dresses, reflecting urban and rural Indian fashion with a nod to cultural elegance. The color palette is vibrant yet balanced, featuring jewel-toned hues inspired by Indian textiles and festivals, with luminous highlights and velvety shadows. Textures—such as crisp cotton fabrics, flowing silk sarees, and lifelike skin—are rendered with meticulous detail, enhancing realism. Visual effects like radiant energy, swirling flames, or ethereal auras are depicted with vibrant, kinetic brushwork, incorporating motion blur and particle effects for a sense of vitality and power.",
      "background": "The background is a rich, atmospheric tapestry that amplifies the scene's emotional tone. It features a dark, evocative setting—such as a moonlit ancient temple, a bustling bazaar at dusk, or a misty Himalayan peak—rendered with a subtle bokeh effect and shallow depth of field to keep the focus on the subject. Delicate environmental details, like drifting lotus petals, glowing fireflies, or shimmering dust motes, add a mystical quality. Strategic light sources, such as flickering torches, celestial moonlight, or vibrant festival lanterns, create dramatic silhouettes and enhance depth with volumetric lighting and soft god rays.",
      "cinematicElements": "The artwork is framed in a widescreen 16:9 aspect ratio, employing a shallow depth of field to create a theatrical, immersive experience. Lighting is high-contrast and purposeful, utilizing techniques like golden-hour rim lighting, vibrant festival glows, or intense fiery backlighting to sculpt the subject and evoke emotion. Shadows are deep and sculpted, adding three-dimensionality, while environmental effects—such as swirling incense smoke, radiant heat haze, or sparkling magical particles—heighten the drama. Subtle lens flares or chromatic aberrations are sparingly used to enhance the cinematic polish.",
      "focalLength": "The scene is captured with the equivalent of a medium telephoto lens (approximately 85mm–135mm full-frame), delivering a cinematic compression effect that isolates the subject, flattens perspective for a painterly quality, and fosters an intimate emotional connection with the viewer.",
      "negativePrompt": "blurry, low quality, distorted, deformed, unnatural proportions, bad anatomy, out of frame, cropped, low resolution, amateurish, mutated, extra limbs, poorly drawn facial features, poorly drawn hands, text artifacts, watermarks, signatures, grainy textures, excessive noise, oversaturated colors, overexposed highlights, unbalanced composition, unrealistic lighting"
    }
  }
];

// Add new interface for reference images
interface ReferenceImage {
  path: string;
  description: string;
}

// Add reference images configuration
export const referenceImages: ReferenceImage[] = [
  {
    path: "/images/image-1747136764318.png",
    description: "Reference style - vibrant colors and detailed composition, with dramatic lighting and cinematic feel"
  },
  {
    path: "/images/image-1747141314771.png",
    description: "Reference style 3 with balanced composition and rich details"
  }
];

// Add fixed seed for consistency
export const FIXED_SEED = 42;

// Add image size configuration with 16:9 aspect ratio
export const IMAGE_SIZE = {
  width: 1024,
  height: 720, // 16:9 aspect ratio (1024 ÷ 16 × 9 = 576)
};

export function buildPrompt(sceneDescription: string, templateId: string = "no-template"): { prompt: string; negativePrompt: string; seed: number; referenceImages: string[]; width: number; height: number } {
  const template = promptTemplates.find(t => t.id === templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  const { style, background, cinematicElements, focalLength } = template.template;

  // Get reference image paths
  const refImagePaths = referenceImages.map(img => img.path);

  // If using no-template, return the scene description with style reference
  if (templateId === "no-template") {
    return {
      prompt: `Create an image that matches the following description while maintaining a consistent style similar to the provided reference images: ${sceneDescription}, best quality, highly detailed, 16:9 aspect ratio, cinematic composition`,
      negativePrompt: template.template.negativePrompt,
      seed: FIXED_SEED,
      referenceImages: refImagePaths,
      width: IMAGE_SIZE.width,
      height: IMAGE_SIZE.height
    };
  }

  // Build the enhanced prompt using the template and style reference
  const enhancedPrompt = `
Create an image that matches the following description while maintaining a consistent style similar to the provided reference images:

Scene: ${sceneDescription}

Style: ${style}

Background Details: ${background}

Cinematic Elements: ${cinematicElements}

Technical Details: ${focalLength}

Additional Requirements: masterpiece, best quality, highly detailed, ultra sharp focus, 8k UHD, professional photography, artistic composition, 16:9 aspect ratio, cinematic widescreen format

Important: Maintain the same artistic style, color palette, and composition approach as shown in the reference images while incorporating the specific scene requirements above.
`.trim();

  return {
    prompt: enhancedPrompt,
    negativePrompt: template.template.negativePrompt,
    seed: FIXED_SEED,
    referenceImages: refImagePaths,
    width: IMAGE_SIZE.width,
    height: IMAGE_SIZE.height
  };
} 