"use client";
import { useEffect, useState } from "react";

export function DocumentImages({ offer, contract }: { offer: File | string; contract: File | string }) {
  const [images, setImages] = useState<string[]>([]);
  useEffect(() => {
    const sources = [offer, contract].map((image) => typeof image === "string" ? image : URL.createObjectURL(image));
    setImages(sources);
    return () => sources.forEach((src) => { if (src.startsWith("blob:")) URL.revokeObjectURL(src); });
  }, [offer, contract]);
  return (
    <section aria-label="Documents used" className="mt-10 border-t border-line pt-8">
      <h2 className="text-xl font-bold">Documents used</h2>
      <p className="mt-3 leading-relaxed text-muted">Check the values and quotes against these images.</p>
      <div className="mt-5 grid grid-cols-2 gap-4">
        {images.map((src, index) => <figure key={src} className="min-w-0">
          <figcaption className="mb-3 font-bold">{index === 0 ? "Your offer" : "Your contract"}</figcaption>
          {/* Native images support temporary browser-only object URLs. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={index === 0 ? "Job offer document" : "Employment contract document"} className="h-auto w-full rounded-lg border border-line bg-white" />
        </figure>)}
      </div>
    </section>
  );
}
