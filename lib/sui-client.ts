import { getJsonRpcFullnodeUrl, JsonRpcHTTPTransport, SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

export type SuiNetworkName = 'testnet' | 'mainnet' | 'devnet' | 'localnet';

const configuredNetwork = process.env.NEXT_PUBLIC_SUI_NETWORK;

export const defaultSuiNetwork: SuiNetworkName =
  configuredNetwork === 'mainnet' ||
  configuredNetwork === 'devnet' ||
  configuredNetwork === 'localnet' ||
  configuredNetwork === 'testnet'
    ? configuredNetwork
    : 'testnet';

export const tatumSuiRpcUrl =
  process.env.NEXT_PUBLIC_TATUM_SUI_RPC_URL ||
  process.env.TATUM_SUI_RPC_URL ||
  '';

export const suiRpcUrl =
  process.env.NEXT_PUBLIC_SUI_RPC_URL ||
  getJsonRpcFullnodeUrl(defaultSuiNetwork);

export const suiNetworks = {
  testnet: {
    network: 'testnet',
    url: process.env.NEXT_PUBLIC_SUI_RPC_URL || getJsonRpcFullnodeUrl('testnet'),
    variables: {
      packageId: process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || '',
      registryObjectId: process.env.NEXT_PUBLIC_SUI_REGISTRY_OBJECT_ID || '',
    },
  },
  mainnet: {
    network: 'mainnet',
    url: getJsonRpcFullnodeUrl('mainnet'),
    variables: {
      packageId: '',
      registryObjectId: '',
    },
  },
  devnet: {
    network: 'devnet',
    url: getJsonRpcFullnodeUrl('devnet'),
    variables: {
      packageId: '',
      registryObjectId: '',
    },
  },
  localnet: {
    network: 'localnet',
    url: getJsonRpcFullnodeUrl('localnet'),
    variables: {
      packageId: '',
      registryObjectId: '',
    },
  },
} as const;

export function createSuiClient(network: keyof typeof suiNetworks, config: (typeof suiNetworks)[keyof typeof suiNetworks]) {
  return new SuiJsonRpcClient({
    network,
    transport: new JsonRpcHTTPTransport({
      url: config.url,
    }),
  });
}
