// Site-wide settings. Edit freely: every page reads from here.

export const site = {
  couple: 'Ally & Mark',
  first: 'Ally',
  second: 'Mark',

  /** Wedding day (local date in Athens, GA). */
  date: '2027-04-24',
  dateLong: 'Saturday, April 24, 2027',
  dateKicker: 'Saturday · April 24 · 2027',

  venue: 'The State Botanical Garden of Georgia',
  city: 'Athens, Georgia',
  address: '2450 S. Milledge Avenue, Athens, GA 30605',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=State+Botanical+Garden+of+Georgia%2C+2450+S+Milledge+Ave%2C+Athens%2C+GA+30605',

  /**
   * Courtesy password for the Details & RSVP pages. This is NOT security;
   * it just keeps casual visitors out of the schedule. Set to '' to remove
   * the prompt entirely. The invitation QR can unlock it with ?key=<password>.
   */
  detailsPassword: 'greenhouse',

  /** Shown in the FAQ and footer once filled in. */
  contactEmail: '',

  /**
   * Google Apps Script web-app URL for guest photo uploads and song requests
   * (setup: apps-script/README.md). Until it's set, those forms say "opening soon".
   */
  guestEndpoint: 'https://script.google.com/macros/s/AKfycbxE41oUVWB28-4elEBQx9dPsSssTMD0rCp0W8QiNRe0rs3sIdBevpr6NLrpgUgZm8MQ/exec',

  /** Your Spotify playlist link (https://open.spotify.com/playlist/…), shown on the Songs page. */
  spotifyPlaylistUrl: '',

  /**
   * Chip-in handles for the Secret Registry. Leave '' to hide that
   * button. Venmo: your username without "@"; PayPal: your paypal.me name.
   */
  venmoHandle: '',
  paypalHandle: '',

  /** Footer credit for the engagement photos, e.g. 'Engagement photos by …'. */
  photoCredit: '',

  registryOpens: 'December',
  invitationsSend: 'early 2027',

  description:
    'Ally & Mark are getting married on April 24, 2027, under glass at the State Botanical Garden of Georgia in Athens.',
} as const;

export const nav = [
  { href: '/', label: 'Home' },
  { href: '/our-story/', label: 'Our Story' },
  { href: '/travel/', label: 'Travel' },
  { href: '/registry/', label: 'Registry' },
  { href: '/faq/', label: 'FAQ' },
  { href: '/details/', label: 'Details & RSVP', locked: true },
] as const;

/** Guest participation pages (footer + home page). */
export const guestLinks = [
  { href: '/share-a-photo/', label: 'Share a photo' },
  { href: '/songs/', label: 'Request a song' },
] as const;
