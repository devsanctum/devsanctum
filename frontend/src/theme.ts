import { theme } from '@primer/react';
import deepmerge from 'deepmerge';

/**
 * DevSanctum custom theme — extends Primer React's default light theme.
 *
 * Palette:
 *   Header      #09637E  — deep teal, app header background
 *   Primary     #088395  — main accent (buttons, links, active states)
 *   Secondary   #7AB2B2  — muted teal (badges, secondary highlights)
 *   Background  #EBF4F6  — page canvas background
 */
export const customTheme = deepmerge(theme, {
  colorSchemes: {
    light: {
      colors: {
        // ── Canvas (page backgrounds) ──────────────────────────────────
        canvas: {
          default: '#EBF4F6',  // main page background
          subtle:  '#ddeef2',  // slightly darker for cards / inset areas
          inset:   '#ddeef2',
          overlay: '#ffffff',
        },

        // ── Accent (primary brand color) ──────────────────────────────
        accent: {
          fg:        '#088395',  // links, active nav items, focus rings
          emphasis:  '#09637E',  // darker variant — headings, hover states
          muted:     'rgba(8, 131, 149, 0.15)',
          subtle:    '#EBF4F6',
        },

        // ── Header component tokens ───────────────────────────────────
        header: {
          bg:    '#09637E',
          text:  '#ffffff',
          logo:  '#ffffff',
          divider: 'rgba(255,255,255,0.15)',
          search: {
            bg:    'rgba(255,255,255,0.12)',
            focus: {
              bg:     '#ffffff',
              border: '#088395',
            },
          },
          item: {
            text: 'rgba(255,255,255,0.85)',
            hover: {
              bg:   'rgba(255,255,255,0.15)',
              text: '#ffffff',
            },
            focus: {
              bg: 'rgba(255,255,255,0.20)',
            },
          },
        },
      },
    },
  },
}) as typeof theme;

export default customTheme;
