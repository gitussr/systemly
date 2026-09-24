/**
 * Build-time switch for reviewing unapproved content.
 * Drafts are shown in `astro dev`, and in any build run with SHOW_DRAFTS=true
 * (used for review previews). Production builds never set it.
 */
export const SHOW_DRAFTS: boolean = import.meta.env.DEV || process.env.SHOW_DRAFTS === 'true';
