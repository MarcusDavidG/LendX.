
import { NFT } from '../hooks/useNFTData';

export const mockNFTs: NFT[] = [
  {
    id: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D-1',
    name: 'Bored Ape #1',
    image: '/images/mock/ape1.png',
    collection: 'Bored Ape Yacht Club',
    estimatedValue: 45000,
    tokenId: '1',
    contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
    rarity: 'Rare',
    attributes: [
      { trait_type: 'Background', value: 'Orange' },
      { trait_type: 'Eyes', value: 'Crazy' },
    ],
  },
  {
    id: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D-2',
    name: 'Bored Ape #2',
    image: '/images/mock/ape2.png',
    collection: 'Bored Ape Yacht Club',
    estimatedValue: 52000,
    tokenId: '2',
    contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
    rarity: 'Epic',
    attributes: [
      { trait_type: 'Background', value: 'Blue' },
      { trait_type: 'Eyes', value: 'Sad' },
    ],
  },
  {
    id: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6-1',
    name: 'Mutant Ape #1',
    image: '/images/mock/mutant1.png',
    collection: 'Mutant Ape Yacht Club',
    estimatedValue: 21000,
    tokenId: '1',
    contractAddress: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6',
    rarity: 'Uncommon',
    attributes: [
      { trait_type: 'Background', value: 'Purple' },
      { trait_type: 'Mouth', value: 'Grin' },
    ],
  },
  {
    id: '0xbd3531da5cf5857e76f19d8e483db3798a34c7b2-1',
    name: 'Pudgy Penguin #1',
    image: '/images/mock/penguin1.png',
    collection: 'Pudgy Penguins',
    estimatedValue: 15000,
    tokenId: '1',
    contractAddress: '0xbd3531da5cf5857e76f19d8e483db3798a34c7b2',
    rarity: 'Common',
    attributes: [
        { trait_type: 'Background', value: 'Green' },
        { trait_type: 'Body', value: 'Turtleneck' },
    ],
  },
];
