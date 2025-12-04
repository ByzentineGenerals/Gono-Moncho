import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Arweave Upload API Endpoint
 * 
 * In production, this would integrate with:
 * 1. Bundlr/Irys for uploading to Arweave
 * 2. IPFS via services like NFT.Storage or Pinata
 * 
 * For now, we simulate the upload and return a mock hash
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const jsonData = formData.get('json') as string | null;

    if (!file && !jsonData) {
      return NextResponse.json(
        { error: 'No file or JSON data provided' },
        { status: 400 }
      );
    }

    let content: string;
    let contentType: string;
    let filename: string;

    if (file) {
      // Handle file upload
      content = await file.text();
      contentType = file.type;
      filename = file.name;
    } else if (jsonData) {
      // Handle JSON data
      content = jsonData;
      contentType = 'application/json';
      filename = 'metadata.json';
    } else {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    // TODO: In production, upload to Arweave using Bundlr/Irys
    // Example with Bundlr:
    // const bundlr = new Bundlr(...);
    // const result = await bundlr.upload(content, {
    //   tags: [
    //     { name: 'Content-Type', value: contentType },
    //     { name: 'App-Name', value: 'Gono-Moncho' },
    //   ]
    // });
    // const arweaveHash = result.id;

    // For now, generate a mock Arweave transaction ID
    const mockArweaveId = generateMockArweaveId();

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const metadata = {
      arweaveId: mockArweaveId,
      arweaveUrl: `https://arweave.net/${mockArweaveId}`,
      ipfsHash: `Qm${mockArweaveId.substring(0, 44)}`, // Mock IPFS hash
      ipfsUrl: `https://ipfs.io/ipfs/Qm${mockArweaveId.substring(0, 44)}`,
      filename,
      contentType,
      size: content.length,
      uploadedAt: new Date().toISOString(),
      preview: content.substring(0, 500)
    };

    return NextResponse.json({
      success: true,
      ...metadata
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Generate a mock Arweave transaction ID
 * Real Arweave IDs are 43 characters of base64url
 */
function generateMockArweaveId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let i = 0; i < 43; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * GET endpoint - Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    mode: 'development',
    message: 'Arweave upload API is ready. In production, this will upload to Arweave network.',
    info: {
      supportedFormats: ['text/plain', 'application/json', 'image/*', 'video/*'],
      maxSize: '100MB',
      network: 'Arweave Mainnet (via Bundlr/Irys)'
    }
  });
}
