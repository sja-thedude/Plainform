export type Sample = {
  id: string;
  title: string;
  blurb: string;
  image: string;
};

// Blank templates drawn for this project. They contain no personal data.
export const SAMPLES: Sample[] = [
  {
    id: "visa",
    title: "Visa application",
    blurb: "Short-stay visitor visa form",
    image: "/samples/visa.png",
  },
  {
    id: "hospital",
    title: "Hospital intake",
    blurb: "New patient registration",
    image: "/samples/hospital.png",
  },
  {
    id: "rental",
    title: "Rental agreement",
    blurb: "Page 1 of a lease",
    image: "/samples/rental.png",
  },
];

export function cachedResultUrl(id: string, lang: string) {
  return `/samples/results/${id}.${lang}.json`;
}
