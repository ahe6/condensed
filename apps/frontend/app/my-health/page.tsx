"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ConsultOverlayHeader } from "../../src/components/ConsultOverlayHeader";
import { getMe } from "../../src/lib/api";
import { getSession, isAuthConfigured, startLogin } from "../../src/lib/auth";

const recordSections = [
  {
    title: "Uploaded records",
    detail: "Lab reports, PDFs, screenshots, and notes you've added.",
    empty: "No records uploaded yet."
  },
  {
    title: "Result reviews",
    detail: "Saved interpretations and written guidance from your health team.",
    empty: "No reviews yet."
  },
  {
    title: "Saved testing plans",
    detail: "Tests you're considering or have discussed.",
    empty: "No saved tests yet."
  },
  {
    title: "Timeline",
    detail: "Requests, uploads, reviews, and follow-up steps in order.",
    empty: "No activity yet."
  }
] as const;

const testingModules = [
  {
    title: "Lab testing",
    detail: "Bloodwork and diagnostic testing options when available."
  },
  {
    title: "Genetic testing",
    detail: "Genetics options for inherited risk, medication response, and long-term planning."
  },
  {
    title: "At-home kits",
    detail: "Testing that can be collected from home."
  },
  {
    title: "Saved testing plans",
    detail: "Tests you're considering or have discussed will appear here."
  }
] as const;

const followUpSections = [
  {
    title: "Active follow-up",
    empty: "No follow-up active yet.",
    detail: "Start a request, review results, or plan testing to create a next step."
  },
  {
    title: "Guidance",
    empty: "No guidance yet.",
    detail: "Written next steps and care recommendations will appear here when they are ready."
  },
  {
    title: "Care coordination",
    empty: "No care coordination active yet.",
    detail: "Clinician review, referrals, specialist routing, or scheduling support can be tracked here when needed."
  },
  {
    title: "Questions to resolve",
    empty: "No open questions yet.",
    detail: "Questions that still need a decision will be grouped here so they do not get lost."
  }
] as const;

const activeRecordSections = {
  "Uploaded records": {
    summary: "3 records uploaded",
    items: ["June lab panel.pdf", "Thyroid results screenshot", "Medication notes"]
  },
  "Result reviews": {
    summary: "1 review saved",
    items: ["Metabolic panel review"]
  },
  "Saved testing plans": {
    summary: "2 tests saved",
    items: ["Vitamin D recheck", "A1c and fasting insulin"]
  },
  Timeline: {
    summary: "Latest activity today",
    items: ["Records uploaded", "Testing plan saved", "Follow-up question drafted"]
  }
} as const;

const activeTestingDetails = {
  "Lab testing": {
    summary: "2 lab options saved",
    items: ["A1c and fasting insulin", "Vitamin D recheck"]
  },
  "Genetic testing": {
    summary: "1 genetics option discussed",
    items: ["Medication response panel"]
  },
  "At-home kits": {
    summary: "No kit selected yet",
    items: ["Available when a testing plan needs home collection"]
  },
  "Saved testing plans": {
    summary: "Metabolic follow-up plan",
    items: ["Compare recent results", "Review timing with care team"]
  }
} as const;

const activeFollowUpSections = {
  "Active follow-up": {
    summary: "Metabolic results follow-up",
    detail: "Review recent lab changes and decide whether another test or care visit is needed."
  },
  Guidance: {
    summary: "Written guidance in progress",
    detail: "Your health team is preparing next steps for the uploaded lab panel."
  },
  "Care coordination": {
    summary: "No referral needed yet",
    detail: "Referral or scheduling support can be added if the guidance recommends it."
  },
  "Questions to resolve": {
    summary: "2 open questions",
    detail: "Clarify whether to repeat fasting labs and what to discuss with your clinician."
  }
} as const;

const activeRecentUpdates = [
  {
    title: "Records uploaded",
    detail: "Three files were added to Records for review.",
    meta: "Today"
  },
  {
    title: "Testing plan saved",
    detail: "A metabolic follow-up plan is ready to review.",
    meta: "Yesterday"
  }
] as const;

const recordLogItems = [
  {
    type: "Upload",
    title: "June lab panel.pdf",
    detail: "Added to your health record for review.",
    meta: "Today"
  },
  {
    type: "Review",
    title: "Metabolic panel review",
    detail: "Saved interpretation and written guidance from your health team.",
    meta: "Today"
  },
  {
    type: "Testing",
    title: "A1c and fasting insulin plan",
    detail: "Testing option saved for future follow-up.",
    meta: "Yesterday"
  },
  {
    type: "Question",
    title: "Follow-up question drafted",
    detail: "Open question about whether to repeat fasting labs.",
    meta: "Yesterday"
  },
  {
    type: "Note",
    title: "Medication notes",
    detail: "Personal notes added to keep context with your records.",
    meta: "Jun 12"
  }
] as const;

const recordLogMessages = [
  {
    type: "Request",
    title: "Bloodwork review request",
    detail: "A request thread for uploaded lab results, review notes, and next-step questions.",
    meta: "Today"
  },
  {
    type: "Reply",
    title: "Testing plan follow-up",
    detail: "Messages about the saved metabolic follow-up plan will stay grouped here.",
    meta: "Yesterday"
  }
] as const;

const recordLogTabs = [
  { id: "overview", label: "Overview" },
  { id: "records", label: "Records" },
  { id: "messages", label: "Messages" }
] as const;

const recordLogQuickChips = [
  "Find a test",
  "Compare products",
  "Review lab results",
  "Ask about symptoms",
  "Not sure what I need"
] as const;

const recordLogRecommendations = [
  {
    title: "General health panel",
    detail: "A starting point for energy, metabolism, inflammation, and organ function questions.",
    href: "/services?category=Tests",
    meta: "Testing"
  },
  {
    title: "Bloodwork analysis",
    detail: "Review abnormal values, borderline markers, trends, and what to consider next.",
    href: "/services?category=Analysis",
    meta: "Results"
  },
  {
    title: "Daily supplement packs",
    detail: "Routine wellness support for nutrient questions and everyday health goals.",
    href: "/services?category=Wellness",
    meta: "Wellness"
  }
] as const;

const overviewActionModules = [
  {
    title: "Start a request",
    detail: "Not sure where to start? Describe what's going on and we'll help route the next step.",
    href: "/message-team",
    action: "Start request",
    priority: "Primary"
  },
  {
    title: "Review results",
    detail: "Upload labs, reports, or documents and get help understanding what to consider next.",
    section: "documents-results",
    action: "Upload records",
    priority: "Records"
  },
  {
    title: "Find testing options",
    detail: "Tell us what you're trying to learn and explore relevant lab, genetic, or at-home testing paths.",
    section: "testing",
    action: "Plan testing",
    priority: "Testing"
  },
  {
    title: "Plan follow-up",
    detail: "Get help deciding what to do after a result, symptom, or care recommendation.",
    section: "messages-updates",
    action: "Request follow-up",
    priority: "Follow-up"
  }
] as const;

const newWorkspaceSections = [
  {
    id: "overview",
    label: "Overview",
    eyebrow: "Today",
    title: "Health workspace",
    detail: "A single place to track results, testing, follow-up, and questions that need a next step."
  },
  {
    id: "documents-results",
    label: "Records",
    eyebrow: "Records",
    title: "Records",
    detail: "Keep your uploaded reports, result reviews, saved testing plans, and care timeline in one place."
  },
  {
    id: "testing",
    label: "Testing",
    eyebrow: "Testing",
    title: "Testing options",
    detail: "Explore labs, genetics, and at-home testing options connected to what you're trying to understand."
  },
  {
    id: "messages-updates",
    label: "Follow-up",
    eyebrow: "Follow-up",
    title: "Follow-up",
    detail: "Get help deciding what to do after results, testing, or a care recommendation."
  }
] as const;

type WorkspaceSectionId = (typeof newWorkspaceSections)[number]["id"];
type MyHealthLayout = "workspace" | "placeholder" | "record-log";
type RecordLogTabId = (typeof recordLogTabs)[number]["id"];

function MyHealthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const layoutParam = searchParams.get("layout");
  const selectedLayout: MyHealthLayout =
    layoutParam === "workspace" || layoutParam === "placeholder" || layoutParam === "record-log"
      ? layoutParam
      : "record-log";
  const selectedSignInBehavior = searchParams.get("signin") === "block" ? "block" : "preview";
  const selectedWorkspaceState = searchParams.get("state") === "active" ? "active" : "empty";
  const [activeWorkspaceSection, setActiveWorkspaceSection] = useState<WorkspaceSectionId>("overview");
  const [activeRecordLogTab, setActiveRecordLogTab] = useState<RecordLogTabId>("overview");
  const [recordRequestText, setRecordRequestText] = useState("");
  const [isRecordRequestOpen, setIsRecordRequestOpen] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canPreviewWithoutSignIn =
    process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_VARIANTS === "true";

  const activeSection =
    newWorkspaceSections.find((section) => section.id === activeWorkspaceSection) ?? newWorkspaceSections[0];
  const isSignInPreview = canPreviewWithoutSignIn && selectedSignInBehavior === "preview";
  const isActiveWorkspacePreview = canPreviewWithoutSignIn && selectedWorkspaceState === "active";
  const shouldShowSignInDialog = needsSignIn && !isSignInPreview;
  const canShowHealthContent = !needsSignIn || isSignInPreview;

  function handleRecordRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedRequest = recordRequestText.trim();
    const requestQuery = trimmedRequest ? `?request=${encodeURIComponent(trimmedRequest)}` : "";

    router.push(`/message-team${requestQuery}`);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      setError(null);

      if (!isAuthConfigured() || !getSession()) {
        if (isMounted) {
          setNeedsSignIn(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        await getMe();

        if (isMounted) {
          setNeedsSignIn(false);
        }
      } catch (caught) {
        if (isMounted) {
          setNeedsSignIn(true);
          setError(caught instanceof Error ? caught.message : "Could not load patient portal");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="shell my-health-shell overlay-header-page">
      <ConsultOverlayHeader lineVariant="full" />

      {error ? <p className="error global-error">{error}</p> : null}

      {isLoading ? (
        <section className="panel">
          <div className="empty-state compact">Loading patient portal</div>
        </section>
      ) : null}

      {!isLoading && shouldShowSignInDialog ? (
        <section className="my-health-sign-in-stage" aria-label="Sign in required">
          <div className="my-health-sign-in-dialog" role="dialog" aria-modal="true" aria-labelledby="my-health-sign-in-title">
            <p className="eyebrow">My Health</p>
            <h1 id="my-health-sign-in-title">Sign in to continue</h1>
            <p>Use your account to view My Health.</p>
            <div className="my-health-sign-in-actions">
              <button type="button" onClick={() => void startLogin()}>
                Sign In
              </button>
              <Link className="nav-link" href="/message-team">
                Message our team
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {!isLoading && canShowHealthContent && selectedLayout === "placeholder" ? (
        <section className="my-health-placeholder" aria-label="My Health placeholder">
          <p className="eyebrow">My Health</p>
          <h1>My Health</h1>
          <p>Your health workspace is being set up. Results, testing plans, follow-up, and messages will appear here.</p>
          <Link className="nav-link primary-link" href="/message-team">
            Message our team
          </Link>
        </section>
      ) : null}

      {!isLoading && canShowHealthContent && selectedLayout === "record-log" ? (
        <section className="my-health-record-log" aria-label="Health records overview">
          <div className="my-health-record-log-top">
            <div className="my-health-record-log-title">
              <h1>My Health</h1>
              <p>Ask health questions, save records, and track testing, products, and follow-ups.</p>
            </div>

            <nav className="my-health-section-tabs" aria-label="Record sections">
              {recordLogTabs.map((tab) => (
                <button
                  aria-current={activeRecordLogTab === tab.id ? "page" : undefined}
                  className={activeRecordLogTab === tab.id ? "active" : undefined}
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveRecordLogTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {activeRecordLogTab === "overview" ? (
            <>
              <section className="my-health-record-log-card my-health-recommendations-card" aria-label="Recommendations">
                <div className="panel-heading">
                  <div>
                    <h2>Recommendations</h2>
                    <p>Services that may be useful based on common starting points.</p>
                  </div>
                </div>
                <div className="my-health-recommendation-grid">
                  {recordLogRecommendations.map((recommendation) => (
                    <Link className="my-health-recommendation-card" href={recommendation.href} key={recommendation.title}>
                      <span>{recommendation.meta}</span>
                      <strong>{recommendation.title}</strong>
                      <p>{recommendation.detail}</p>
                    </Link>
                  ))}
                </div>
              </section>

              <div className="my-health-record-log-summary" aria-label="Record summary">
                <article>
                  <span>Total records</span>
                  <strong>{isActiveWorkspacePreview ? recordLogItems.length : 0}</strong>
                  <p>Uploads, reviews, testing plans, questions, and notes.</p>
                </article>
                <article>
                  <span>Latest record</span>
                  <strong>{isActiveWorkspacePreview ? "Today" : "None yet"}</strong>
                  <p>{isActiveWorkspacePreview ? "Most recent activity is saved to your record." : "New activity will appear here."}</p>
                </article>
              </div>

              <section className="my-health-record-log-card" aria-label="Recent records">
                <div className="panel-heading">
                  <div>
                    <h2>Recent records</h2>
                    <p>A simple history of what has happened in My Health.</p>
                  </div>
                </div>
                {isActiveWorkspacePreview ? (
                  <div className="my-health-record-log-list">
                    {recordLogItems.slice(0, 3).map((record) => (
                      <article className="my-health-record-log-item" key={`${record.type}-${record.title}`}>
                        <span>{record.type}</span>
                        <div>
                          <h3>{record.title}</h3>
                          <p>{record.detail}</p>
                        </div>
                        <small>{record.meta}</small>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="my-health-record-log-empty">
                    <strong>No records yet.</strong>
                    <p>Uploads, requests, result reviews, testing plans, and follow-up notes will appear here as records.</p>
                  </div>
                )}
              </section>
            </>
          ) : null}

          {activeRecordLogTab === "records" ? (
            <section className="my-health-record-log-card" aria-label="All records">
              <div className="panel-heading">
                <div>
                  <h2>Records</h2>
                  <p>All activity is shown as a record, newest first.</p>
                </div>
              </div>
              {isActiveWorkspacePreview ? (
                <div className="my-health-record-log-list">
                  {recordLogItems.map((record) => (
                    <article className="my-health-record-log-item" key={`${record.type}-${record.title}`}>
                      <span>{record.type}</span>
                      <div>
                        <h3>{record.title}</h3>
                        <p>{record.detail}</p>
                      </div>
                      <small>{record.meta}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="my-health-record-log-empty">
                  <strong>No records yet.</strong>
                  <p>When you upload documents, start requests, save testing plans, or get guidance, each item will be added here.</p>
                </div>
              )}
            </section>
          ) : null}

          {activeRecordLogTab === "messages" ? (
            <section className="my-health-record-log-card" aria-label="Messages panel">
              <div className="panel-heading">
                <div>
                  <h2>Messages</h2>
                  <p>Requests, team replies, and review notes stay grouped here.</p>
                </div>
              </div>
              {isActiveWorkspacePreview ? (
                <div className="my-health-record-log-list">
                  {recordLogMessages.map((message) => (
                    <article className="my-health-record-log-item" key={`${message.type}-${message.title}`}>
                      <span>{message.type}</span>
                      <div>
                        <h3>{message.title}</h3>
                        <p>{message.detail}</p>
                      </div>
                      <small>{message.meta}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="my-health-record-log-empty">
                  <strong>No messages yet.</strong>
                  <p>When you send a request or your health team replies, messages and review notes will appear here.</p>
                </div>
              )}
            </section>
          ) : null}
        </section>
      ) : null}

      {!isLoading && canShowHealthContent && selectedLayout === "record-log" ? (
        <aside
          className={`my-health-request-float${isRecordRequestOpen ? " open" : ""}`}
          aria-label="Ask our team"
        >
          {isRecordRequestOpen ? (
            <section
              className="my-health-request-drawer"
              role="dialog"
              aria-modal="false"
              aria-labelledby="my-health-request-drawer-title"
            >
              <div className="my-health-request-drawer-heading">
                <div>
                  <h2 id="my-health-request-drawer-title">What do you need help with?</h2>
                  <p>Tell us what you're looking for, and we'll help route the next step.</p>
                </div>
                <button
                  aria-label="Close request drawer"
                  className="my-health-request-drawer-close"
                  type="button"
                  onClick={() => setIsRecordRequestOpen(false)}
                >
                  x
                </button>
              </div>

              <form className="my-health-request-composer my-health-request-drawer-form" onSubmit={handleRecordRequestSubmit}>
                <label>
                  <span className="sr-only">Request message</span>
                  <textarea
                    value={recordRequestText}
                    rows={3}
                    placeholder="Ask about symptoms, testing, supplements, results, or what to do next..."
                    onChange={(event) => setRecordRequestText(event.target.value)}
                  />
                </label>
                <div className="my-health-request-composer-footer">
                  <div className="my-health-request-chip-row" aria-label="Quick request prompts">
                    {recordLogQuickChips.map((chip) => (
                      <button key={chip} type="button" onClick={() => setRecordRequestText(chip)}>
                        {chip}
                      </button>
                    ))}
                  </div>
                  <button className="my-health-request-submit" type="submit">
                    Send request
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          <button
            className="my-health-request-launcher"
            type="button"
            onClick={() => setIsRecordRequestOpen((isOpen) => !isOpen)}
          >
            Ask our team
          </button>
        </aside>
      ) : null}

      {!isLoading && canShowHealthContent && selectedLayout === "workspace" ? (
        <section className="my-health-workspace" aria-label="Health workspace">
          <section className="my-health-workspace-panel" aria-label={`${activeSection.label} details`}>
            <div className="my-health-workspace-heading">
              <div>
                <h2>Health workspace</h2>
                <p>A single place to track results, testing, follow-up, and questions that need a next step.</p>
              </div>
            </div>

            <nav className="my-health-section-tabs" aria-label="Workspace sections">
              {newWorkspaceSections.map((section) => (
                <button
                  aria-current={activeWorkspaceSection === section.id ? "page" : undefined}
                  className={activeWorkspaceSection === section.id ? "active" : undefined}
                  key={section.id}
                  type="button"
                  onClick={() => setActiveWorkspaceSection(section.id)}
                >
                  {section.label}
                </button>
              ))}
            </nav>

            {activeWorkspaceSection !== "overview" ? (
              <div className="my-health-section-intro">
                <p className="eyebrow">{activeSection.eyebrow}</p>
                <h3>{activeSection.title}</h3>
                <p>{activeSection.detail}</p>
              </div>
            ) : null}

            {activeWorkspaceSection === "overview" ? (
              <>
                <section className="my-health-detail-section my-health-overview-actions-card" aria-label="What do you need help with?">
                  <div className="panel-heading">
                    <div>
                      <h3>What do you need help with?</h3>
                      <p>Start from a question, an existing result, or a testing goal.</p>
                    </div>
                  </div>
                  <div className="portal-action-list">
                    {overviewActionModules.map((item) => (
                      "href" in item ? (
                        <Link
                          className="portal-action-row my-health-primary-action-row"
                          href={item.href}
                          key={`${item.priority}-${item.title}`}
                        >
                          <span>{item.priority}</span>
                          <div>
                            <strong>{item.title}</strong>
                            <p>{item.detail}</p>
                          </div>
                          <small>{item.action}</small>
                        </Link>
                      ) : (
                        <button
                          className="portal-action-row"
                          key={`${item.priority}-${item.title}`}
                          type="button"
                          onClick={() => setActiveWorkspaceSection(item.section)}
                        >
                          <span>{item.priority}</span>
                          <div>
                            <strong>{item.title}</strong>
                            <p>{item.detail}</p>
                          </div>
                          <small>{item.action}</small>
                        </button>
                      )
                    ))}
                  </div>
                </section>

                <div className="my-health-overview-section-heading">
                  <h3>Your workspace</h3>
                </div>

                <div className="my-health-summary-grid" aria-label="Workspace summary">
                  <button className="my-health-summary-item" type="button" onClick={() => setActiveWorkspaceSection("documents-results")}>
                    <span>Records</span>
                    <strong>{isActiveWorkspacePreview ? "3 uploaded" : "Ready"}</strong>
                    <small>{isActiveWorkspacePreview ? "Results and documents" : "Results and documents"}</small>
                  </button>
                  <button className="my-health-summary-item" type="button" onClick={() => setActiveWorkspaceSection("testing")}>
                    <span>Testing</span>
                    <strong>{isActiveWorkspacePreview ? "Plan saved" : "Available"}</strong>
                    <small>{isActiveWorkspacePreview ? "Labs and genetics" : "Labs and genetics"}</small>
                  </button>
                  <div className="my-health-summary-item">
                    <span>Last update</span>
                    <strong>{isActiveWorkspacePreview ? "Today" : "None yet"}</strong>
                    <small>Messages and status changes</small>
                  </div>
                </div>

                <section className="my-health-detail-section my-health-recent-updates-card" aria-label="Recent updates">
                  <div className="panel-heading">
                    <div>
                      <h3>Recent updates</h3>
                    </div>
                  </div>
                  {isActiveWorkspacePreview ? (
                    <div className="my-health-card-item-list">
                      {activeRecentUpdates.map((update) => (
                        <div className="my-health-card-item" key={update.title}>
                          <span>{update.meta}</span>
                          <div>
                            <strong>{update.title}</strong>
                            <p>{update.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="my-health-empty-update">
                      <strong>No active request yet.</strong>
                      <p>Start a request to get help with results, testing options, or follow-up.</p>
                    </div>
                  )}
                </section>
              </>
            ) : null}

            {activeWorkspaceSection === "documents-results" ? (
              <>
                <div className="my-health-record-grid">
                  {recordSections.map((section) => (
                    <article className="my-health-record-section" key={section.title}>
                      <div>
                        <h4>{section.title}</h4>
                        <p>{section.detail}</p>
                      </div>
                      {isActiveWorkspacePreview ? (
                        <div className="my-health-card-item-list compact">
                          <strong>{activeRecordSections[section.title].summary}</strong>
                          {activeRecordSections[section.title].items.map((item) => (
                            <p key={item}>{item}</p>
                          ))}
                          {section.title === "Uploaded records" ? (
                            <button className="my-health-record-link" type="button">
                              Upload records
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <div className="my-health-record-empty">
                          <strong>{section.empty}</strong>
                          {section.title === "Uploaded records" ? (
                            <button className="my-health-record-link" type="button">
                              Upload records
                            </button>
                          ) : null}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </>
            ) : null}

            {activeWorkspaceSection === "testing" ? (
              <>
                <section className="my-health-detail-section my-health-testing-question" aria-label="Start from a question">
                  <div>
                    <h3>Start from a question</h3>
                    <p>Not sure what to test? Tell us what you're trying to understand and we'll help organize the options.</p>
                  </div>
                  <Link className="nav-link primary-link" href="/message-team">
                    Start a request
                  </Link>
                </section>

                <div className="my-health-record-grid">
                  {testingModules.map((module) => (
                    <article className="my-health-record-section my-health-testing-card" key={module.title}>
                      <div>
                        <h4>{module.title}</h4>
                        <p>{module.detail}</p>
                      </div>
                      {isActiveWorkspacePreview ? (
                        <div className="my-health-card-item-list compact">
                          <strong>{activeTestingDetails[module.title].summary}</strong>
                          {activeTestingDetails[module.title].items.map((item) => (
                            <p key={item}>{item}</p>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>

                <div className="my-health-secondary-action">
                  <Link href="/message-team">Browse available tests</Link>
                </div>
              </>
            ) : null}

            {activeWorkspaceSection === "messages-updates" ? (
              <div className="my-health-record-grid">
                {followUpSections.map((section) => (
                  <article className="my-health-record-section" key={section.title}>
                    <div>
                      <h4>{section.title}</h4>
                      <p>{section.detail}</p>
                    </div>
                    {isActiveWorkspacePreview ? (
                      <div className="my-health-record-empty">
                        <strong>{activeFollowUpSections[section.title].summary}</strong>
                        <p>{activeFollowUpSections[section.title].detail}</p>
                      </div>
                    ) : (
                      <div className="my-health-record-empty">
                        <strong>{section.empty}</strong>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </section>
      ) : null}

    </main>
  );
}

export default function MyHealthPage() {
  return (
    <Suspense
      fallback={
        <main className="shell">
          <section className="panel">
            <div className="empty-state compact">Loading patient portal</div>
          </section>
        </main>
      }
    >
      <MyHealthPageContent />
    </Suspense>
  );
}
