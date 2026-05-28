import { Transaction } from '@mysten/sui/transactions';
import {
  defaultSuiNetwork,
  suiRpcUrl,
  tatumSuiRpcUrl,
  type SuiNetworkName,
} from './sui-client';

interface MemoryProofTransactionParams {
  sender: string;
}

export function validateSuiProofConfig() {
  return {
    valid: Boolean(suiRpcUrl),
    rpcUrl: suiRpcUrl,
    network: defaultSuiNetwork,
    tatumRpcUrl: tatumSuiRpcUrl,
    missing: suiRpcUrl ? [] : ['NEXT_PUBLIC_SUI_RPC_URL'],
  };
}

export function createMemoryProofTransaction({ sender }: MemoryProofTransactionParams) {
  const tx = new Transaction();
  tx.setSender(sender);
  const [proofCoin] = tx.splitCoins(tx.gas, [1]);
  tx.transferObjects([proofCoin], sender);
  return tx;
}

export function formatSuiExplorerTxUrl(digest: string, network: SuiNetworkName = defaultSuiNetwork) {
  const explorerNetwork = network === 'mainnet' ? 'mainnet' : network;
  return `https://suiscan.xyz/${explorerNetwork}/tx/${digest}`;
}
