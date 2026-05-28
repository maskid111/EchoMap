import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    rpcConfigured: Boolean(
      process.env.TATUM_SUI_RPC_URL?.trim() ||
      process.env.NEXT_PUBLIC_TATUM_SUI_RPC_URL?.trim()
    ),
    apiKeyConfigured: Boolean(process.env.TATUM_API_KEY?.trim()),
  });
}
