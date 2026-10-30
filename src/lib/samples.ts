export type Sample = {
  id: string;
  title: string;
  blurb: string;
  image: string;
  thumb: string;
};

// Blank templates drawn for this project. They contain no personal data.
export const SAMPLES: Sample[] = [
  {
    id: "visa",
    title: "Visa application",
    blurb: "Short-stay visitor visa form",
    image: "/samples/visa.png",
    thumb: "/samples/thumbs/visa.webp",
  },
  {
    id: "hospital",
    title: "Hospital intake",
    blurb: "New patient registration",
    image: "/samples/hospital.png",
    thumb: "/samples/thumbs/hospital.webp",
  },
  {
    id: "rental",
    title: "Rental agreement",
    blurb: "Page 1 of a lease",
    image: "/samples/rental.png",
    thumb: "/samples/thumbs/rental.webp",
  },
];

export function cachedResultUrl(id: string, lang: string) {
  return `/samples/results/${id}.${lang}.json`;
}
