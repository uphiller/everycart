export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  badge?: string;
};

export const products: Product[] = [
  {
    id: '1',
    name: '우유식빵 프리미엄',
    price: 4800,
    category: 'bread',
    badge: 'BEST',
    image:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
  },
  {
    id: '2',
    name: '버터 크루아상 4입',
    price: 12000,
    category: 'best',
    badge: 'HOT',
    image:
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
  },
  {
    id: '3',
    name: '생크림 카스테라',
    price: 28000,
    category: 'cake',
    badge: 'NEW',
    image:
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80',
  },
  {
    id: '4',
    name: '호두 파운드케이크',
    price: 18500,
    category: 'cake',
    image:
      'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600&q=80',
  },
  {
    id: '5',
    name: '치즈 베이글 세트',
    price: 9900,
    category: 'bread',
    image:
      'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&q=80',
  },
  {
    id: '6',
    name: '명절 선물 세트 A',
    price: 52000,
    category: 'gift',
    badge: '선물',
    image:
      'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=600&q=80',
  },
  {
    id: '7',
    name: '소금빵 6입 (냉동)',
    price: 15000,
    category: 'seasonal',
    image:
      'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=600&q=80',
  },
  {
    id: '8',
    name: '통밀 산딸기 잼 식빵',
    price: 6500,
    category: 'subscribe',
    image:
      'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&q=80',
  },
];
