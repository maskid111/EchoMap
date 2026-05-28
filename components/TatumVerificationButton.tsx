'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TatumVerificationButtonProps {
  digest: string;
  compact?: boolean;
}

type VerificationState = 'idle' | 'loading' | 'verified' | 'failed';

export function TatumVerificationButton({ digest, compact = false }: TatumVerificationButtonProps) {
  const [state, setState] = useState<VerificationState>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const verify = async () => {
    setState('loading');
    setMessage(null);

    try {
      const response = await fetch(`/api/tatum/sui/transaction?digest=${encodeURIComponent(digest)}`);
      const payload = await response.json() as { ok?: boolean; status?: string; error?: string };

      if (!response.ok || !payload.ok) {
        setState('failed');
        setMessage(payload.error || 'Verification failed');
        return;
      }

      setState(payload.status === 'success' ? 'verified' : 'failed');
      setMessage(payload.status === 'success' ? 'Verified via Tatum' : `Verification returned ${payload.status || 'unknown'}`);
    } catch (error) {
      setState('failed');
      setMessage(error instanceof Error ? error.message : 'Verification failed');
    }
  };

  return (
    <div className={cn('flex flex-col gap-1', compact ? 'items-start' : 'items-start')}>
      <button
        type="button"
        onClick={verify}
        disabled={state === 'loading'}
        className="inline-flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-200 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ShieldCheck className="h-4 w-4" />
        {state === 'loading' ? 'Loading...' : 'Verify with Tatum'}
      </button>
      {message && (
        <p
          className={cn(
            'text-xs',
            state === 'verified' ? 'text-cyan-300' : 'text-yellow-200'
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
