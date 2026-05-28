'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { ReactNode, useState } from 'react';
import { createSuiClient, defaultSuiNetwork, suiNetworks } from '@/lib/sui-client';

interface SuiProviderProps {
  children: ReactNode;
}

export function SuiProvider({ children }: SuiProviderProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={suiNetworks}
        defaultNetwork={defaultSuiNetwork}
        createClient={createSuiClient}
      >
        <WalletProvider autoConnect preferredWallets={['Slush', 'Sui Wallet']}>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
