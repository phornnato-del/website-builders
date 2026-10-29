"use client";

import { useState } from "react";

import { safeImageUrl } from "@/lib/editor-utils";

type ImageCarouselProps = {
  images: string[];
  label: string;
  backgroundColor: string;
};

export function ImageCarousel({
  images,
  label,
  backgroundColor,
}: ImageCarouselProps) {
  const slides = images
    .map((image) => safeImageUrl(image))
    .filter((image): image is string => image !== null);
  const imageKey = slides.join("\0");
  const [selection, setSelection] = useState({ imageKey, index: 0 });
  const activeIndex =
    selection.imageKey === imageKey &&
    selection.index < Math.max(1, slides.length)
      ? selection.index
      : 0;

  function showSlide(index: number) {
    setSelection({
      imageKey,
      index: (activeIndex + index + slides.length) % slides.length,
    });
  }

  return (
    <div
      aria-label={label || "Image slideshow"}
      className="relative h-full w-full overflow-hidden rounded-3xl border border-white/70 shadow-xl ring-1 ring-slate-900/5"
      style={{ backgroundColor }}
    >
      {slides.length > 0 ? (
        <div
          aria-label={`${label || "Slideshow"} image ${activeIndex + 1} of ${slides.length}`}
          className="absolute inset-0 bg-cover bg-center transition-[background-image] duration-300"
          role="img"
          style={{ backgroundImage: `url("${slides[activeIndex]}")` }}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-slate-50 to-indigo-100/80 p-6 text-center">
          <div className="rounded-2xl border border-white/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
            <span className="mb-2 block text-2xl text-indigo-500" aria-hidden="true">
              ▧
            </span>
            <span className="text-sm font-medium text-slate-600">
              Add up to three images
            </span>
          </div>
        </div>
      )}

      {slides.length > 1 && (
        <>
          <button
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-white/85 text-lg text-slate-800 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            onClick={(event) => {
              event.stopPropagation();
              showSlide(-1);
            }}
            onPointerDown={(event) => event.stopPropagation()}
            type="button"
          >
            ‹
          </button>
          <button
            aria-label="Next slide"
            className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-white/85 text-lg text-slate-800 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            onClick={(event) => {
              event.stopPropagation();
              showSlide(1);
            }}
            onPointerDown={(event) => event.stopPropagation()}
            type="button"
          >
            ›
          </button>
          <div
            aria-label="Choose slide"
            className="absolute inset-x-0 bottom-3 flex justify-center gap-2"
            role="group"
          >
            {slides.map((_, index) => (
              <button
                aria-label={`Show slide ${index + 1}`}
                aria-pressed={activeIndex === index}
                className={`size-2.5 rounded-full border border-white shadow transition ${
                  activeIndex === index
                    ? "scale-110 bg-indigo-600"
                    : "bg-white/80 hover:bg-white"
                }`}
                key={`${index}-${slides[index]}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelection({ imageKey, index });
                }}
                onPointerDown={(event) => event.stopPropagation()}
                type="button"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
