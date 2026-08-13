import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking/booking-flow";

export const metadata: Metadata = {
  title: "Book & Pay",
  description:
    "Book fixed-rate services and pay in full or a 50% deposit, or request a written quote for scoped work. Class bookings pick a date from our business-hours calendar.",
  alternates: { canonical: "/book" },
  openGraph: {
    title: "Book & Pay · Hill Country Consultants",
    description:
      "Book fixed-rate services and pay in full or a 50% deposit, or request a written quote for scoped work. Class bookings pick a date from our business-hours calendar.",
    url: "/book",
  },
};

export default function BookPage({
  searchParams,
}: {
  searchParams: { add?: string; quote?: string; class?: string };
}) {
  return (
    <BookingFlow
      initialAdd={searchParams.add ?? ""}
      initialQuotes={searchParams.quote ?? ""}
      initialClass={searchParams.class ?? ""}
    />
  );
}
