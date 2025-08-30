# Bilingual Features - Goat Farm Management App

## Overview
The Goat Farm Management application now supports both **English** and **Marathi** languages, providing a localized experience for users in Maharashtra and other Marathi-speaking regions.

## Language Support

### Supported Languages
- **English (en)** - Default language
- **Marathi (मराठी)** - Native language of Maharashtra

### Language Toggle
- A language toggle button is available in the top header
- Click to switch between English and Marathi
- The toggle shows "म" for Marathi and "EN" for English
- Language preference is maintained during the session

## Implementation Details

### Translation System
- **Translation Files**: Located in `frontend/src/translations/`
  - `en.js` - English translations
  - `mr.js` - Marathi translations
  - `index.js` - Translation utilities

### Language Context
- **LanguageContext**: Manages language state across the application
- **useLanguage Hook**: Provides language information and toggle function
- **getTranslation Function**: Retrieves translated text based on current language

### Components with Translations
- **Layout**: Navigation menu, header, sidebar
- **Dashboard**: Statistics, charts, overview text
- **GoatDetail**: All labels, statuses, tab names
- **Navigation**: Menu items, page titles
- **Forms**: Input labels, buttons, messages

## Key Features

### Dynamic Content
- All user-facing text automatically updates when language changes
- Status badges (Active, Inactive, Pregnant, etc.) are translated
- Form labels and validation messages support both languages
- Navigation and breadcrumbs are localized

### Cultural Adaptation
- **Marathi**: Uses Devanagari script with proper Marathi terminology
- **English**: Standard English terminology for goat farming
- **Units**: Both metric (kg, liters) and localized terms

### User Experience
- Seamless language switching without page reload
- Consistent terminology across all modules
- Accessible for both English and Marathi speakers
- Maintains professional farming terminology

## Usage Examples

### Switching Languages
```javascript
import { useLanguage } from '../contexts/LanguageContext';

const { language, toggleLanguage } = useLanguage();

// Get translated text
const label = getTranslation(language, 'goatManagement');
```

### Adding New Translations
1. Add English text to `frontend/src/translations/en.js`
2. Add Marathi text to `frontend/src/translations/mr.js`
3. Use `getTranslation(language, 'key')` in components

## Benefits

### For Users
- **Local Language Support**: Native Marathi speakers can use the app comfortably
- **Professional Terminology**: Proper farming terms in both languages
- **Accessibility**: Better understanding of farm management concepts

### For Farm Operations
- **Local Staff Training**: Marathi-speaking workers can easily learn the system
- **Documentation**: Records can be maintained in preferred language
- **Compliance**: Meets local language requirements

## Technical Notes

### Performance
- Translations are loaded once and cached
- No additional API calls for language switching
- Minimal impact on application performance

### Maintenance
- Centralized translation management
- Easy to add new languages in the future
- Consistent translation keys across components

### Future Enhancements
- Language persistence across sessions
- Additional regional languages
- Dynamic language detection based on user location
- Voice commands in local languages

## Conclusion
The bilingual implementation makes the Goat Farm Management application more accessible and user-friendly for the diverse farming community in Maharashtra, while maintaining professional standards and technical excellence. 