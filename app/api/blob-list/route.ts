import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export async function GET() {
  try {
    const { blobs } = await list();
    
    // Transform blob data into our required format
    const images = blobs.map(blob => {
      // Extract project name and sequence number from filename
      const filenameParts = blob.pathname.split('/').pop()?.split('-') || [];
      const projectName = filenameParts[0] || 'unknown';
      const sequenceNumber = parseInt(filenameParts[1] || '0', 10);

      return {
        id: blob.pathname,
        blobUrl: blob.url,
        prompt: blob.pathname, // We could store this in metadata if needed
        timestamp: new Date(blob.uploadedAt).getTime(),
        projectName,
        sequenceNumber
      };
    });

    // Sort by timestamp descending (newest first)
    images.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error listing blobs:', error);
    return NextResponse.json(
      { error: 'Failed to list images' },
      { status: 500 }
    );
  }
} 