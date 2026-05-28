import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface SuiRpcError {
  code?: number;
  message?: string;
}

function getTatumRpcUrl() {
  return (
    process.env.TATUM_SUI_RPC_URL?.trim() ||
    process.env.NEXT_PUBLIC_TATUM_SUI_RPC_URL?.trim() ||
    ''
  );
}

function extractStatus(result: Record<string, unknown>) {
  const effects = result.effects as { status?: { status?: string; error?: string } } | undefined;
  return effects?.status?.status || 'unknown';
}

function extractGasUsed(result: Record<string, unknown>) {
  const effects = result.effects as { gasUsed?: Record<string, string> } | undefined;
  return effects?.gasUsed || null;
}

export async function GET(request: NextRequest) {
  const digest = request.nextUrl.searchParams.get('digest')?.trim();

  if (!digest) {
    return NextResponse.json(
      { ok: false, error: 'Missing transaction digest.' },
      { status: 400 }
    );
  }

  const rpcUrl = getTatumRpcUrl();

  if (!rpcUrl) {
    return NextResponse.json(
      { ok: false, digest, error: 'Tatum Sui RPC URL is not configured.' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.TATUM_API_KEY?.trim()
          ? { 'x-api-key': process.env.TATUM_API_KEY.trim() }
          : {}),
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'sui_getTransactionBlock',
        params: [
          digest,
          {
            showEffects: true,
            showEvents: true,
            showInput: true,
            showObjectChanges: true,
          },
        ],
      }),
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => null) as {
      result?: Record<string, unknown>;
      error?: SuiRpcError;
    } | null;

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          digest,
          error: `Tatum RPC request failed with status ${response.status}.`,
          details: payload?.error?.message,
        },
        { status: 502 }
      );
    }

    if (payload?.error) {
      return NextResponse.json(
        {
          ok: false,
          digest,
          error: payload.error.message || 'Tatum RPC returned an error.',
          code: payload.error.code,
        },
        { status: 502 }
      );
    }

    if (!payload?.result) {
      return NextResponse.json(
        { ok: false, digest, error: 'Tatum RPC returned no transaction result.' },
        { status: 502 }
      );
    }

    const result = payload.result;

    return NextResponse.json({
      ok: true,
      digest,
      status: extractStatus(result),
      timestamp: result.timestampMs || null,
      gasUsed: extractGasUsed(result),
      raw: {
        digest: result.digest,
        effects: result.effects,
        events: result.events,
        objectChanges: result.objectChanges,
        transaction: result.transaction,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        digest,
        error: error instanceof Error ? error.message : 'Unable to reach Tatum RPC.',
      },
      { status: 502 }
    );
  }
}
