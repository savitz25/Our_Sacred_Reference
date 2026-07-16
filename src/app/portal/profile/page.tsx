"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { mockClient } from "@/lib/mock-data";

export default function PortalProfilePage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: mockClient.name,
    email: mockClient.email,
    phone: "",
    timezone: "America/Los_Angeles",
    notifications: true,
    recordingConsent: true,
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-forest">
          Profile & settings
        </h1>
        <p className="mt-2 text-ink-soft">
          Account management, intake preferences, and notification settings.
          Member since {mockClient.memberSince}.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <h2 className="font-serif text-xl text-forest mb-5">Account</h2>
          <div className="space-y-4">
            <Field
              label="Full name"
              id="name"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            />
            <Field
              label="Email"
              id="email"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            />
            <Field
              label="Phone"
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            />
            <div>
              <label
                htmlFor="timezone"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Timezone
              </label>
              <select
                id="timezone"
                value={form.timezone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, timezone: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-cream/40 px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
              >
                <option value="America/Los_Angeles">Pacific (US)</option>
                <option value="America/Denver">Mountain (US)</option>
                <option value="America/Chicago">Central (US)</option>
                <option value="America/New_York">Eastern (US)</option>
                <option value="Europe/London">London</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-xl text-forest mb-5">Preferences</h2>
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.notifications}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notifications: e.target.checked }))
                }
                className="mt-1 h-4 w-4 rounded border-border text-teal focus:ring-teal"
              />
              <span className="text-sm text-ink-soft">
                Email reminders for upcoming sessions and when new videos are
                added to my library.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.recordingConsent}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    recordingConsent: e.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 rounded border-border text-teal focus:ring-teal"
              />
              <span className="text-sm text-ink-soft">
                I consent to session recording for my private portal library
                (practitioner-controlled).
              </span>
            </label>
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-xl text-forest mb-2">Intake forms</h2>
          <p className="text-sm text-muted mb-4">
            Placeholder for secure intake documents and consents (Phase 2 —
            Supabase storage).
          </p>
          <Button type="button" variant="outline" size="sm" disabled>
            Upload form (coming soon)
          </Button>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" variant="primary">
            Save changes
          </Button>
          {saved && (
            <p className="text-sm text-teal" role="status">
              Preferences saved (mock).
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  id,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-cream/40 px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
      />
    </div>
  );
}
