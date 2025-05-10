import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { blobUrl } = await request.json();
    
    if (!blobUrl) {
      return NextResponse.json(
        { error: 'Blob URL is required' },
        { status: 400 }
      );
    }

    // Extract the filename from the URL
    // Vercel Blob URLs are in the format: https://{store}.{region}.{base}/{filename}
    const urlParts = blobUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    if (!filename) {
      return NextResponse.json(
        { error: 'Invalid Blob URL format' },
        { status: 400 }
      );
    }
    
    // Delete the image from Vercel Blob
    await del(filename);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
      deletedUrl: blobUrl
    });
    
  } catch (error: any) {
    console.error('Error deleting image from Blob:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
} 