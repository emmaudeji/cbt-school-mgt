"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useMemo, useState } from "react";
 

type ImageCardProps = {
  src?: string | null;
  alt?: string;
  name?: string; // used for initials
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

const COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-cyan-500",
  "bg-lime-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-zinc-500",
  "bg-slate-500",
  "bg-stone-500",
];

function getInitials(name?: string): string {
  if (!name || !name.trim()) return "??";

  const parts = name.trim().split(/\s+/).filter(Boolean);

  // If multiple words → first + last
  if (parts.length >= 2) {
    return (
      (parts[0][0] || "") +
      (parts[parts.length - 1][0] || "")
    ).toUpperCase();
  }

  // Single word → take first 2 letters
  const word = parts[0];

  if (word.length >= 2) {
    return word.slice(0, 2).toUpperCase();
  }

  // If only 1 character → pad it
  return (word[0] + word[0]).toUpperCase();
}

// 👉 Deterministic color from string
function getColorFromString(str?: string | null) {
  if (!str) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function ImageCard({
  src,
  alt = "image",
  name,
  className,
  imageClassName,
  fallbackClassName,
}: ImageCardProps) {
  const [imgError, setImgError] = useState(false);

  const showImage = src && !imgError;

  const initials = useMemo(() => getInitials(name), [name]);
  const bgColor = useMemo(() => getColorFromString(name || src), [name, src]);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl",
        className
      )}
    >
      {showImage ? (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn("object-cover", imageClassName)}
          onError={() => setImgError(true)}
          sizes="100px"
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center w-full h-full text-white font-semibold",
            bgColor,
            fallbackClassName
          )}
        >
          {initials}
        </div>
      )}
    </div>
  );
}