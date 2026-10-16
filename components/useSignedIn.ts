"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Supabase keeps the session in cookies named sb-<project>-auth-token (split into .0, .1 when large).
const SESSION_COOKIE = /(?:^|;\s*)sb-[^=]+-auth-token(?:\.\d+)?=/;

/** True when a visitor has a sign-in session. Re-checked on every page change; no Supabase code loaded. */
export function useSignedIn() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => setSignedIn(SESSION_COOKIE.test(document.cookie)), [pathname]);
  return signedIn;
}
