import food01 from '../assets/dates/food-01.jpg';
import food02 from '../assets/dates/food-02.jpg';
import food03 from '../assets/dates/food-03.jpg';
import food04 from '../assets/dates/food-04.jpg';
import food05 from '../assets/dates/food-05.jpg';

import javi01 from '../assets/dates/javi-01.jpg';
import javi02 from '../assets/dates/javi-02.jpg';
import javi03 from '../assets/dates/javi-03.jpg';
import javi04 from '../assets/dates/javi-04.jpg';
import javi05 from '../assets/dates/javi-05.jpg';

export interface DateMatch {
  id: number;
  /** Food / restaurant photo. */
  food: string;
  /** Maridito outfit photo. */
  outfit: string;
  /** CSS object-position for food photo (default: 'center') */
  foodPosition?: string;
  /** CSS object-position for outfit photo (default: 'center top') */
  outfitPosition?: string;
}

// Pairing rule: number N always matches number N.
// foodPosition / outfitPosition control CSS object-position so we can frame
// each photo to show restaurant AND Javi's outfit clearly.
export const DATE_MATCHES: DateMatch[] = [
  {
    id: 1,
    food: food01,
    outfit: javi01,
    foodPosition: 'center',
    outfitPosition: 'center top',
  },
  {
    id: 2,
    food: food02,
    outfit: javi02,
    foodPosition: 'center',
    outfitPosition: 'center top',
  },
  {
    id: 3,
    food: food03,
    outfit: javi03,
    foodPosition: 'center',
    outfitPosition: 'center top',
  },
  {
    id: 4,
    food: food04,
    outfit: javi04,
    foodPosition: 'center',
    outfitPosition: 'center top',
  },
  {
    id: 5,
    food: food05,
    outfit: javi05,
    foodPosition: 'center',
    outfitPosition: 'center top',
  },
];
