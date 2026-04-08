import nl from './nl';

// English translations — falls back to Dutch for all keys until translated.
// Override individual keys when real translations are ready.
const en: typeof nl = { ...nl };

export default en;
