"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { CustomerBrand } from "../../src/components/CustomerBrand";
import { CustomerNav } from "../../src/components/CustomerNav";

const messagePrimaryOptions = [
  {
    title: "Find the right test",
    detail: "For labs, genetics, fertility, hormones, STI testing, or general screening.",
    prompt: "What are you trying to test or figure out?",
    placeholder:
      'For example: "I want a general health panel," "I\'m worried about fertility," "I want STI testing," or "I\'m not sure what tests make sense."',
    uploadMode: "secondary"
  },
  {
    title: "Understand my results",
    detail: "Upload reports and get help making sense of what they mean.",
    prompt: "What results do you want help with?",
    placeholder:
      'For example: "I have bloodwork and don\'t know what\'s abnormal," or "I want a second look at my genetic results."',
    uploadMode: "prominent"
  },
  {
    title: "Talk through a concern",
    detail: "Tell us what's going on and we'll help you think through next steps.",
    prompt: "What is going on?",
    placeholder:
      'For example: "I\'ve had fatigue for months," "I\'m worried about a symptom," or "I want to know what next step makes sense."',
    uploadMode: "secondary"
  },
  {
    title: "I'm not sure what I need",
    detail: "Start with a quick message and we'll point you in the right direction.",
    prompt: "Tell us what you're trying to figure out.",
    placeholder:
      'For example: "I don\'t know whether I need testing, a doctor visit, or just someone to look at my records."',
    uploadMode: "secondary"
  }
] as const;

const messageSecondaryOption = {
  title: "Something else?",
  selectedTitle: "Something else",
  detail: "Ask about services, pricing, timing, or anything else.",
  prompt: "What would you like to ask us?",
  placeholder:
    'Example: "How does this work?", "How much does it cost?", "Can you help with this kind of test?", or "Do you work with people in my state?"',
  uploadMode: "secondary"
} as const;

const messageStartOptions = [...messagePrimaryOptions, messageSecondaryOption] as const;

const messageLayoutValues = ["guided"] as const;

function pickLayout(value: string | null): (typeof messageLayoutValues)[number] {
  return messageLayoutValues.includes(value as (typeof messageLayoutValues)[number])
    ? (value as (typeof messageLayoutValues)[number])
    : "guided";
}

function MessageTeamContent() {
  const searchParams = useSearchParams();
  const layout = pickLayout(searchParams.get("layout"));
  const initialRequestText = searchParams.get("request") ?? "";
  const [selectedOption, setSelectedOption] = useState<(typeof messageStartOptions)[number] | null>(
    initialRequestText ? messagePrimaryOptions[3] : null
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main className={`shell message-team-page message-team-page-${layout}`}>
      <section className="topbar site-header" aria-label="Message team navigation">
        <CustomerBrand />
        <div className="nav-actions">
          <CustomerNav primaryHref="/my-health" primaryLabel="My Health" />
        </div>
      </section>

      <section className="message-team-workspace" aria-labelledby="message-team-title">
        <div className="message-team-heading">
          <p className="eyebrow">Message our team</p>
          <h1 id="message-team-title">What can we help you with?</h1>
          <p>
            Tell us what you're trying to figure out. We'll help you choose a test, understand results, or
            decide what to do next.
          </p>
        </div>

        <div className="message-team-option-grid" aria-label="Choose a starting point">
          {messagePrimaryOptions.map((option) => (
            <button
              aria-pressed={selectedOption === option}
              className={selectedOption === option ? "message-team-option active" : "message-team-option"}
              key={option.title}
              type="button"
              onClick={() => setSelectedOption(option)}
            >
              <strong>{option.title}</strong>
              <span>{option.detail}</span>
            </button>
          ))}
        </div>

        <button
          aria-pressed={selectedOption === messageSecondaryOption}
          className={
            selectedOption === messageSecondaryOption
              ? "message-team-option message-team-secondary-option active"
              : "message-team-option message-team-secondary-option"
          }
          type="button"
          onClick={() => setSelectedOption(messageSecondaryOption)}
        >
          <strong>{messageSecondaryOption.title}</strong>
          <span>{messageSecondaryOption.detail}</span>
        </button>

        {selectedOption ? (
          <form className="message-team-form" aria-label="Message details" onSubmit={handleSubmit}>
            <div className="message-team-selected">
              <span>You selected</span>
              <strong>{"selectedTitle" in selectedOption ? selectedOption.selectedTitle : selectedOption.title}</strong>
            </div>

            <label className="message-team-field">
              <span>{selectedOption.prompt}</span>
              <textarea defaultValue={initialRequestText} placeholder={selectedOption.placeholder} rows={5} />
            </label>

            <section
              className={
                selectedOption.uploadMode === "prominent"
                  ? "message-team-upload message-team-upload-prominent"
                  : "message-team-upload"
              }
              aria-labelledby="message-upload-title"
            >
              <div>
                <h2 id="message-upload-title">Have results or documents?</h2>
                <p>Optional. You can add them now or later.</p>
              </div>
              <label>
                <span>Optional upload</span>
                <input type="file" />
              </label>
            </section>

            <section className="message-team-contact" aria-labelledby="message-contact-title">
              <h2 id="message-contact-title">Where should we reply?</h2>
              <div className="message-team-contact-grid">
                <label>
                  <span>Email</span>
                  <input type="email" />
                </label>
                <label>
                  <span>Phone</span>
                  <input type="tel" />
                </label>
              </div>
            </section>

            <p className="message-team-reassurance">
              Free to send. No obligation. We'll reply with what we think makes sense.
            </p>

            <button className="message-team-submit" type="submit">
              Send message
            </button>
          </form>
        ) : null}

        <Link className="message-team-back-link" href="/">
          Back to home
        </Link>
      </section>
    </main>
  );
}

export default function MessageTeamPage() {
  return (
    <Suspense fallback={null}>
      <MessageTeamContent />
    </Suspense>
  );
}
