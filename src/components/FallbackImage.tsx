"use client";

import type { ImgHTMLAttributes } from "react";

const PLACEHOLDER = "/images/placeholder.svg";

export default function FallbackImage({ src, ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || PLACEHOLDER}
      {...rest}
      onError={(e) => {
        if (e.currentTarget.dataset.fallback !== "true") {
          e.currentTarget.dataset.fallback = "true";
          e.currentTarget.src = PLACEHOLDER;
        }
      }}
    />
  );
}
