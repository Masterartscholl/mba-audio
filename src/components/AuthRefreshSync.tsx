"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * OAuth callback'ten dönüldüğünde URL'de auth_refresh=1 gelir.
 * Client ilk yüklemede session cookie'yi bazen henüz okumadığı için
 * profil/kullanıcı görünmeyebilir. Bu bileşen auth_refresh varken
 * sayfayı bir kez yenileyerek session'ın kesin yüklenmesini sağlar.
 */
export function AuthRefreshSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (searchParams.get("auth_refresh") !== "1") return;

    // Google ile girişte ad soyad için ayarlar sayfasına git
    const match = document.cookie.match(/redirect_after_auth=([^;]+)/);
    const redirectTo = match ? decodeURIComponent(match[1].trim()) : null;
    if (redirectTo) {
      document.cookie = "redirect_after_auth=; path=/; max-age=0";
      window.location.replace(redirectTo);
      return;
    }

    // Parametreyi kaldırıp aynı sayfayı yeniden yükle; cookie artık gönderilir, useAuth session'ı görür
    const url = pathname || "/";
    window.location.replace(url);
  }, [pathname, searchParams]);

  return null;
}
