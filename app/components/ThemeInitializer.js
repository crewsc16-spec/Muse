'use client';

import { useEffect } from 'react';
import { applyScheme, getSavedScheme } from '@/app/lib/color-schemes';

export default function ThemeInitializer() {
  useEffect(() => {
    applyScheme(getSavedScheme());
  }, []);
  return null;
}
