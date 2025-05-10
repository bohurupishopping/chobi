# Chobi Image Generator

An AI-powered image generation app using Gemini's image generation capabilities.

## Quick Start

### Windows Users

Two batch files are included for easy startup:

1. **start-dev-server.bat** - Starts the development server on port 4000
2. **start-dev-server-with-browser.bat** - Starts the server and automatically opens your browser

Simply double-click either file to start the server.

### Manual Start

If you prefer to start the server manually:

```bash
# Using npm
npm run dev -- --port 4000

# Using yarn
yarn dev --port 4000
```

Then open your browser to http://localhost:4000

## Features

- Generate high-quality 16:9 images using Gemini AI
- Customize generation with negative prompts
- Manage multiple API keys
- Save and download generated images
- View image generation history

## API Keys

To use the application, you need a Gemini API key:

1. Sign up for a Google AI Studio account and get your API key
2. Add your API key in the app settings panel

## Development

This project uses:

- Next.js
- React
- TypeScript
- Tailwind CSS

To install dependencies:

```bash
npm install
# or
yarn install
```

## Getting Started

### Prerequisites

- Node.js 16.8 or later
- A Google AI Studio API key (Gemini)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory with your API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/)
2. Create or sign in to your account
3. Go to API keys section and create a new key
4. Copy the key into your `.env.local` file

## Usage

1. Enter a descriptive prompt for the image you want to generate
2. Customize settings like style, resolution, and aspect ratio
3. Click "Generate Image" to create your AI image
4. View your generation history and download images as needed

## Advanced Settings

- **Negative Prompt**: Specify elements to avoid in the generated image
- **Seed**: Use a specific seed for reproducible results
- **Steps**: Control the number of diffusion steps for image quality

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Vercel Blob Storage Setup

This application uses Vercel Blob Storage for efficiently storing generated images.

### Setup Instructions

1. If deploying to Vercel, make sure to set up the following environment variables:
   - `GEMINI_API_KEY` - Your Google Gemini API key
   - `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token

2. To generate a Blob token, use the Vercel CLI:
   ```bash
   npx vercel env add BLOB_READ_WRITE_TOKEN
   ```
   
   Or add it directly in the Vercel dashboard under Project Settings > Environment Variables.

3. When running locally, create a `.env.local` file with these variables:
   ```
   GEMINI_API_KEY=your_gemini_key_here
   BLOB_READ_WRITE_TOKEN=your_blob_token_here
   VERCEL_URL=localhost:3000
   ```

### Why Vercel Blob?

- Efficient storage of generated images
- Prevents localStorage quota exceeded errors
- Better performance and scalability
- Persists images between sessions and devices

### Image Storage Workflow

1. User enters a prompt and clicks "Generate Image"
2. The backend generates the image using Gemini API
3. The generated image is immediately stored in Vercel Blob
4. Both the image data (for immediate display) and the Blob URL (for persistent storage) are returned
5. The UI displays the image and saves the Blob URL in the history
6. When viewing history, images are loaded directly from Vercel Blob
7. When images are removed from history, they are also deleted from Blob storage

This complete lifecycle management ensures efficient use of storage resources and proper cleanup of unused images.
