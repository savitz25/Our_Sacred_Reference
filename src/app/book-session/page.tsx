"use client";

import { useState } from "react";
import { Section } from "@/components/ui/Section";
import { CalendarPlaceholder } from "@/components/booking/CalendarPlaceholder";
import { IntakeForm } from "@/components/booking/IntakeForm";

export default function BookSessionPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  return (
    <>
      <section className="relative bg-sacred-gradient py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="text-gold-soft text-sm font-medium tracking-[0.15em] uppercase mb-4">
            Book free session
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-cream max-w-2xl leading-tight">
            Schedule your free discovery session
          </h1>
          <p className="mt-5 max-w-xl text-cream/80 leading-relaxed">
            Choose a time that works for you, complete a brief intake, and
            receive portal access with your session link.
          </p>
        </div>
      </section>

      <Section className="bg-cream">
        <ol className="mb-10 flex flex-wrap gap-4 sm:gap-8 text-sm">
          {["Select date & time", "Complete intake", "Confirm & access portal"].map(
            (step, i) => (
              <li key={step} className="flex items-center gap-2 text-ink-soft">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-cream text-xs font-medium">
                  {i + 1}
                </span>
                {step}
              </li>
            )
          )}
        </ol>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <CalendarPlaceholder
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelectSlot={(date, time) => {
              setSelectedDate(date);
              setSelectedTime(time);
            }}
          />
          <IntakeForm
            selectedDate={selectedDate}
            selectedTime={selectedTime}
          />
        </div>
      </Section>
    </>
  );
}
