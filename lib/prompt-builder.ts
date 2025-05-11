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
    "id": "indian-anime-cinematic",
    "name": "Indian Anime Cinematic Epic",
    "description": "A breathtaking, ultra-detailed Indian anime-inspired style with grandiose cinematic composition, blending vibrant cultural heritage with dynamic anime artistry",
    "template": {
      "style": "The illustration is crafted in a hyper-detailed, cinematic Indian anime-inspired style, seamlessly merging traditional Indian artistry with cutting-edge anime techniques. It emphasizes fluid, expressive character designs, bold and dynamic poses, and intricate, stylized linework that captures emotional intensity. The color palette is vibrant yet balanced, featuring jewel-toned hues inspired by Indian textiles and festivals, with luminous highlights and velvety shadows. Textures—such as ornate metalwork, flowing silk fabrics, and lifelike skin—are rendered with meticulous detail, enhancing realism. Visual effects like radiant energy, swirling flames, or ethereal auras are depicted with vibrant, kinetic brushwork, incorporating motion blur and particle effects for a sense of vitality and power.",
      "background": "The background is a rich, atmospheric tapestry that amplifies the scene’s emotional tone. It features a dark, evocative setting—such as a moonlit ancient temple, a bustling bazaar at dusk, or a misty Himalayan peak—rendered with a subtle bokeh effect and shallow depth of field to keep the focus on the subject. Delicate environmental details, like drifting lotus petals, glowing fireflies, or shimmering dust motes, add a mystical quality. Strategic light sources, such as flickering torches, celestial moonlight, or vibrant festival lanterns, create dramatic silhouettes and enhance depth with volumetric lighting and soft god rays.",
      "cinematicElements": "The artwork is framed in a widescreen 16:9 aspect ratio, employing a shallow depth of field to create a theatrical, immersive experience. Lighting is high-contrast and purposeful, utilizing techniques like golden-hour rim lighting, vibrant festival glows, or intense fiery backlighting to sculpt the subject and evoke emotion. Shadows are deep and sculpted, adding three-dimensionality, while environmental effects—such as swirling incense smoke, radiant heat haze, or sparkling magical particles—heighten the drama. Subtle lens flares or chromatic aberrations are sparingly used to enhance the cinematic polish.",
      "focalLength": "The scene is captured with the equivalent of a medium telephoto lens (approximately 85mm–135mm full-frame), delivering a cinematic compression effect that isolates the subject, flattens perspective for a painterly quality, and fosters an intimate emotional connection with the viewer.",
      "negativePrompt": "blurry, low quality, distorted, deformed, unnatural proportions, bad anatomy, out of frame, cropped, low resolution, amateurish, mutated, extra limbs, poorly drawn facial features, poorly drawn hands, text artifacts, watermarks, signatures, grainy textures, excessive noise, oversaturated colors, overexposed highlights, unbalanced composition, unrealistic lighting"
    }
  },
  {
    "id": "indian-anime-cinematic-modern",
    "name": "Indian Anime Cinematic Modern",
    "description": "A vibrant, ultra-detailed Indian anime-inspired style with cinematic composition, showcasing modern Indian characters in contemporary and regional attire, blending cultural authenticity with dynamic anime artistry",
    "template": {
      "style": "The illustration is rendered in a hyper-detailed, cinematic Indian anime-inspired style, fusing modern Indian fashion with cutting-edge anime techniques. Characters are depicted in expressive, dynamic poses with fluid, stylized linework that conveys emotion and movement. Clothing reflects contemporary Indian aesthetics—such as tailored kurtas, vibrant sarees, chic lehengas, casual shirts and pants, or urban streetwear with regional flair (e.g., embroidered dupattas, kolhapuri sneakers, or bandhani prints). The color palette is bold and harmonious, drawing from modern Indian trends with vibrant hues like saffron, turquoise, and magenta, balanced by neutral tones. Textures like cotton, silk, denim, or linen are rendered with lifelike detail, while accessories like jhumkas, bangles, or minimalist jewelry add cultural nuance. Visual effects—such as glowing energy, swirling winds, or subtle auras—are depicted with kinetic brushwork, incorporating motion blur and particle effects for a lively, dynamic feel.",
      "background": "The background is a rich, atmospheric setting that complements the modern Indian vibe—think bustling urban streets at twilight, serene rural landscapes with mustard fields, or vibrant festival markets. It’s rendered with a subtle bokeh effect and shallow depth of field to keep the focus on the characters. Environmental details, like drifting flower petals, glowing streetlights, or shimmering monsoon droplets, add a poetic touch. Strategic light sources—neon signs, golden sunset glow, or colorful festival lamps—create dramatic silhouettes and enhance depth with volumetric lighting and soft god rays.",
      "cinematicElements": "The artwork is framed in a widescreen 16:9 aspect ratio with a shallow depth of field for a theatrical, immersive experience. Lighting is high-contrast and emotive, using techniques like warm streetlamp glow, vibrant festival lighting, or soft natural rim lighting to sculpt characters and evoke mood. Shadows are deep and defined, adding three-dimensionality, while environmental effects like urban haze, confetti bursts, or gentle rain enhance drama. Subtle lens flares or light leaks are sparingly used to elevate the cinematic polish.",
      "focalLength": "The scene is captured with the equivalent of a medium telephoto lens (approximately 85mm–135mm full-frame), delivering a cinematic compression effect that isolates characters, flattens perspective for a painterly quality, and fosters an intimate emotional connection with the viewer.",
      "negativePrompt": "blurry, low quality, distorted, deformed, unnatural proportions, bad anatomy, out of frame, cropped, low resolution, amateurish, mutated, extra limbs, poorly drawn facial features, poorly drawn hands, text artifacts, watermarks, signatures, grainy textures, excessive noise, oversaturated colors, overexposed highlights, unbalanced composition, unrealistic lighting, outdated or stereotypical costumes, god-like armor, overly fantastical elements"
    }
  },
  {
    "id": "indian-anime-cinematic-normal",
    "name": "Indian Anime Cinematic Normal",
  "description": "A breathtaking, ultra-detailed Indian anime-inspired style with grandiose cinematic composition, blending vibrant cultural heritage with dynamic anime artistry",
  "template": {
    "style": "The illustration is crafted in a hyper-detailed, cinematic Indian anime-inspired style, seamlessly merging traditional Indian artistry with cutting-edge anime techniques. It emphasizes fluid, expressive character designs, bold and dynamic poses, and intricate, stylized linework that captures emotional intensity. Characters wear modern Indian attire such as tailored pants, stylish shirts, vibrant sarees, or contemporary local dresses, reflecting urban and rural Indian fashion with a nod to cultural elegance. The color palette is vibrant yet balanced, featuring jewel-toned hues inspired by Indian textiles and festivals, with luminous highlights and velvety shadows. Textures—such as crisp cotton fabrics, flowing silk sarees, and lifelike skin—are rendered with meticulous detail, enhancing realism. Visual effects like radiant energy, swirling flames, or ethereal auras are depicted with vibrant, kinetic brushwork, incorporating motion blur and particle effects for a sense of vitality and power.",
    "background": "The background is a rich, atmospheric tapestry that amplifies the scene’s emotional tone. It features a dark, evocative setting—such as a moonlit ancient temple, a bustling bazaar at dusk, or a misty Himalayan peak—rendered with a subtle bokeh effect and shallow depth of field to keep the focus on the subject. Delicate environmental details, like drifting lotus petals, glowing fireflies, or shimmering dust motes, add a mystical quality. Strategic light sources, such as flickering torches, celestial moonlight, or vibrant festival lanterns, create dramatic silhouettes and enhance depth with volumetric lighting and soft god rays.",
    "cinematicElements": "The artwork is framed in a widescreen 16:9 aspect ratio, employing a shallow depth of field to create a theatrical, immersive experience. Lighting is high-contrast and purposeful, utilizing techniques like golden-hour rim lighting, vibrant festival glows, or intense fiery backlighting to sculpt the subject and evoke emotion. Shadows are deep and sculpted, adding three-dimensionality, while environmental effects—such as swirling incense smoke, radiant heat haze, or sparkling magical particles—heighten the drama. Subtle lens flares or chromatic aberrations are sparingly used to enhance the cinematic polish.",
    "focalLength": "The scene is captured with the equivalent of a medium telephoto lens (approximately 85mm–135mm full-frame), delivering a cinematic compression effect that isolates the subject, flattens perspective for a painterly quality, and fosters an intimate emotional connection with the viewer.",
    "negativePrompt": "blurry, low quality, distorted, deformed, unnatural proportions, bad anatomy, out of frame, cropped, low resolution, amateurish, mutated, extra limbs, poorly drawn facial features, poorly drawn hands, text artifacts, watermarks, signatures, grainy textures, excessive noise, oversaturated colors, overexposed highlights, unbalanced composition, unrealistic lighting"
  }
}
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