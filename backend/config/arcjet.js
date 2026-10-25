import arcjet, { detectBot, shield, tokenBucket } from '@arcjet/node';
import { ARCJET_KEY } from './env.js';

const aj = ARCJET_KEY
  ? arcjet({
      key: ARCJET_KEY,
      rules: [
        shield({ mode: 'LIVE' }),
        detectBot({ mode: 'LIVE', allow: ['CATEGORY:SEARCH_ENGINE,POSTMAN'] }),
        tokenBucket({ mode: 'LIVE', refillRate: 1, interval: 5, capacity: 5 }),
      ],
    })
  : null;

export default aj;
