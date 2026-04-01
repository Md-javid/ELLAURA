/**
 * Lookbook Configuration — admin-editable text & metadata for LookbookPage.
 *
 * Data is stored in localStorage so it persists across visits.
 * The admin page writes via saveLookbookConfig(); the LookbookPage reads via loadLookbookConfig().
 */

const LOOKBOOK_KEY = 'ellaura_lookbook_config'

// Default editorial content (shipped with the app)
const DEFAULT_CONFIG = {
  pageTitle: 'Lookbook',
  pageSubtitle: 'Autumn / Winter 2026 Editorial',
  heroTitle: "Dressed for the Life You're Already Living",
  heroSubtitle: 'Ellaura x AW26',
  heroDescription: 'Wearable stories crafted in Mumbai, tailored just for you. Each piece handcrafted, every silhouette a statement.',
  emptyTitle: 'Coming Soon',
  emptyDescription: 'Our curated lookbook will feature handpicked editorial looks once the collection is live.',
  ctaTitle: 'Want Something Unique?',
  ctaSubtitle: 'Your Story, Your Silhouette',
  ctaDescription: "Every Ellaura piece is made-to-measure. Share your vision and we'll bring it to life.",
  ctaButtonLabel: 'WhatsApp Us',
  ctaWhatsAppNumber: '919082527247',
  looks: [
    {
      title: 'The Night Belongs to You',
      subtitle: 'ELLAURA AUTUMN / WINTER 2026',
      description: "Step into rooms and silence them. A velvet silhouette designed for women who don't ask for attention — they command it.",
      mood: 'Dark Romantique',
    },
    {
      title: 'Golden Hour, Your Rules',
      subtitle: 'THE FESTIVE EDIT',
      description: 'Silk so fine it catches every candle. Worn to the celebrations that matter — and the quiet ones only you know about.',
      mood: 'Luxe Festive',
    },
    {
      title: 'Made for the City After Dark',
      subtitle: 'URBAN NIGHTS',
      description: "Sequins that remember every beat. From Bandra cafes to rooftop parties — this is your going-out armour.",
      mood: 'Urban Glam',
    },
    {
      title: 'Corporate Runway',
      subtitle: 'THE POWER DRESSING EDIT',
      description: 'Tailored to command. Soft enough to feel like a second skin, structured enough that every room knows exactly who walked in.',
      mood: 'Power Dressing',
    },
    {
      title: "She's Not Wearing White",
      subtitle: 'THE BRIDAL EDIT',
      description: "Because the real statement is the one that's entirely yours. Blush, ivory, gold — in a cut that starts conversations.",
      mood: 'New Bride',
    },
  ],
}

export const loadLookbookConfig = () => {
  try {
    const raw = localStorage.getItem(LOOKBOOK_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      // Merge with defaults so new keys always exist
      return { ...DEFAULT_CONFIG, ...saved, looks: saved.looks || DEFAULT_CONFIG.looks }
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_CONFIG }
}

export const saveLookbookConfig = (config) => {
  localStorage.setItem(LOOKBOOK_KEY, JSON.stringify(config))
}

export { DEFAULT_CONFIG as LOOKBOOK_DEFAULTS }
