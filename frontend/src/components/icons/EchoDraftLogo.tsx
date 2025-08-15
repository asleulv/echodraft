"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";

type Props = Omit<
  React.ComponentProps<typeof Image>,
  "src" | "alt" | "width" | "height"
>;

export default function EchoDraftLogo(props: Props) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const logoSrc =
    theme === "dark"
      ? "/logo/echodraft-lightbrown.svg"
      : "/logo/echodraft-brown.svg";

  return (
    <Image
      {...props}
      src={logoSrc}
      alt="EchoDraft Logo"
      width={109}
      height={209}
    />
  );
}
