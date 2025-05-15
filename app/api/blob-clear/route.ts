import { NextResponse } from "next/server";
import { list, del } from "@vercel/blob";

export async function POST() {
  try {
    const { blobs } = await list();
    
    // Delete all blobs in parallel
    await Promise.all(blobs.map(blob => del(blob.pathname)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing blobs:', error);
    return NextResponse.json(
      { error: 'Failed to clear images' },
      { status: 500 }
    );
  }
} 