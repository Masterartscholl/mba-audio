"use client";

import { useEffect } from "react";
import { startVisibleViewportTracking } from "@/utils/visibleViewport";

/**
 * Wix iframe'inde (mobil) fixed öğelerin kullanıcının görebildiği alana oturması için
 * görünür alan ölçümünü başlatır. Ayrıntı: utils/visibleViewport.ts
 */
export function VisibleViewportSync() {
  useEffect(() => startVisibleViewportTracking(), []);
  return null;
}
