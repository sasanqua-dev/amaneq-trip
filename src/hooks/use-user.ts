"use client";

import { useEffect, useState } from "react";

interface AppUser {
  sub: string;
  email: string;
  name: string;
  picture: string;
  dbId: string;
}

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  return { user, isLoading };
}
