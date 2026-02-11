"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Google (veya OAuth) ile giriş yapıp profilinde ad soyad olmayan kullanıcıyı
 * ayarlar sayfasına yönlendirir; böylece isim soyisim bilgisi istenmiş olur.
 */
export function ProfileCompleteGuard() {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    // Profil tablosundaki ad-soyad veya Google metadata'dan gelen isim
    const nameFromProfile = profile?.full_name?.trim() || '';
    const nameFromMetadata =
      (user.user_metadata?.full_name || user.user_metadata?.name || '').trim();
    const name = nameFromProfile || nameFromMetadata;
    if (name) return;
    if (pathname === "/settings") return;
    router.replace("/settings?complete=1");
  }, [loading, user, profile?.full_name, pathname, router]);

  return null;
}
