export const NETWORKS = {
  sonicTestnet: {
    chainId: 57054,
    name: 'Sonic Testnet',
    rpcUrl: 'https://rpc.blaze.soniclabs.com',
    blockExplorer: 'https://testnet.soniclabs.com',
    nativeCurrency: {
      name: 'Sonic',
      symbol: 'S',
      decimals: 18
    },
    testnet: true
  }
};

export const DEFAULT_NETWORK = NETWORKS.sonicTestnet;
