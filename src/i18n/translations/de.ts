import nl from './nl';

// German translations — falls back to Dutch for all keys until translated.
// Override individual keys when real translations are ready.
const de: typeof nl = { ...nl };

export default de;
