import { chromium } from "playwright";

const checks = {
  async "my-health-rail"(page) {
    await openMyHealthPreview(page);
    const labels = await page
      .getByLabel("Workspace sections")
      .locator("button")
      .evaluateAll((nodes) => nodes.map((node) => node.textContent));

    return {
      labels,
      hasStartRequest: labels.includes("Start request"),
      hasRecords: labels.includes("Records"),
      lastLabel: labels[labels.length - 1]
    };
  },

  async "my-health-signin-toggle"(page) {
    await page.goto("http://localhost:3001/my-health?layout=workspace&signin=block", { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    const blockDialog = await page.getByRole("dialog", { name: "Sign in to continue" }).isVisible();
    const blockWorkspace = await page.getByRole("region", { name: "Health workspace" }).isVisible().catch(() => false);

    await openMyHealthPreview(page);
    const previewDialog = await page.getByRole("dialog", { name: "Sign in to continue" }).isVisible().catch(() => false);
    const previewWorkspace = await page.getByRole("region", { name: "Health workspace" }).isVisible();
    const previewMode = await page.getByText("Preview mode").isVisible();

    return {
      blockDialog,
      blockWorkspace,
      previewDialog,
      previewWorkspace,
      previewMode
    };
  },

  async "my-health-overview"(page) {
    await openMyHealthPreview(page);
    const overviewDetails = page.getByLabel("Overview details");
    const startRequestLinks = await overviewDetails.getByRole("link", { name: "Start a request" }).count();
    const nextStepLabels = await overviewDetails
      .getByLabel("What do you need help with?")
      .locator(".portal-action-row strong")
      .evaluateAll((nodes) => nodes.map((node) => node.textContent));
    const workspaceHeading = await page.getByRole("heading", { name: "Your workspace" }).isVisible();
    const recentUpdates = await page.getByRole("heading", { name: "Recent updates" }).isVisible();
    const overviewPill = await overviewDetails.locator("span", { hasText: "Overview" }).isVisible().catch(() => false);
    const footerVisible = await page.locator(".site-footer").isVisible().catch(() => false);

    return {
      startRequestLinks,
      nextStepLabels,
      workspaceHeading,
      recentUpdates,
      overviewPill,
      footerVisible
    };
  },

  async "my-health-heading-actions"(page) {
    await openMyHealthPreview(page);
    const sectionNames = ["Records", "Testing", "Follow-up"];
    const pills = {};
    const startRequestButtons = {};

    for (const sectionName of sectionNames) {
      await page.getByLabel("Workspace sections").getByRole("button", { name: sectionName }).click();
      pills[sectionName] = await page
        .getByLabel(`${sectionName} details`)
        .locator("span", { hasText: sectionName })
        .isVisible()
        .catch(() => false);
      startRequestButtons[sectionName] = await page
        .getByLabel(`${sectionName} details`)
        .getByRole("link", { name: "Start a request" })
        .isVisible()
        .catch(() => false);
    }

    return { pills, startRequestButtons };
  },

  async "my-health-records"(page) {
    await openMyHealthPreview(page);
    await page.getByLabel("Workspace sections").getByRole("button", { name: "Records" }).click();

    const intro = await page
      .getByText("Keep your uploaded reports, result reviews, saved testing plans, and care timeline in one place.")
      .isVisible();
    const uploadButtonCount = await page.getByLabel("Records details").getByRole("button", { name: "Upload records" }).count();
    const startRequestButton = await page.getByLabel("Records details").getByRole("link", { name: "Start a request" }).isVisible().catch(() => false);
    const uploadButton = await page
      .locator(".my-health-record-section")
      .filter({ hasText: "Uploaded records" })
      .getByRole("button", { name: "Upload records" })
      .isVisible();
    const sections = {};

    for (const sectionName of ["Uploaded records", "Result reviews", "Saved testing plans", "Timeline"]) {
      sections[sectionName] = await page.getByRole("heading", { name: sectionName }).isVisible();
    }

    const emptyStates = {
      records: await page.getByText("No records uploaded yet.").isVisible(),
      reviews: await page.getByText("No reviews yet.").isVisible(),
      tests: await page.getByText("No saved tests yet.").isVisible(),
      timeline: await page.getByText("No activity yet.").isVisible()
    };

    const recentResultsVisible = await page.getByText("Recent results").isVisible().catch(() => false);
    const followUpQuestionsVisible = await page.getByText("Follow-up questions").isVisible().catch(() => false);

    return {
      intro,
      uploadButton,
      uploadButtonCount,
      startRequestButton,
      sections,
      emptyStates,
      recentResultsVisible,
      followUpQuestionsVisible
    };
  },

  async "my-health-testing"(page) {
    await openMyHealthPreview(page);
    await page.getByLabel("Workspace sections").getByRole("button", { name: "Testing" }).click();
    const heading = await page.getByRole("heading", { name: "Testing options" }).isVisible();
    const helper = await page
      .getByText("Explore labs, genetics, and at-home testing options connected to what you're trying to understand.")
      .isVisible();
    const startQuestion = await page.getByRole("heading", { name: "Start from a question" }).isVisible();
    const startRequestButton = await page.getByLabel("Start from a question").getByRole("link", { name: "Start a request" }).isVisible();
    const rows = await page.locator(".my-health-testing-card h4").evaluateAll((nodes) =>
      nodes.map((node) => node.textContent)
    );
    const browseAvailableTests = await page.getByRole("link", { name: "Browse available tests" }).isVisible();

    return { heading, helper, startQuestion, startRequestButton, rows, browseAvailableTests };
  },

  async "my-health-follow-up"(page) {
    await openMyHealthPreview(page);
    await page.getByLabel("Workspace sections").getByRole("button", { name: "Follow-up" }).click();
    const intro = await page
      .getByText("Get help deciding what to do after results, testing, or a care recommendation.")
      .isVisible();
    const sections = {};

    for (const sectionName of ["Active follow-up", "Guidance", "Care coordination", "Questions to resolve"]) {
      sections[sectionName] = await page.getByRole("heading", { name: sectionName }).isVisible();
    }

    const emptyStates = {
      active: await page.getByText("No follow-up active yet.").isVisible(),
      guidance: await page.getByText("No guidance yet.").isVisible(),
      coordination: await page.getByText("No care coordination active yet.").isVisible(),
      questions: await page.getByText("No open questions yet.").isVisible()
    };

    const forbiddenLabels = {};
    for (const label of ["Clinician updates", "Order updates", "Action reminders", "payment", "shipment", "fulfillment"]) {
      forbiddenLabels[label] = await page.getByText(label, { exact: false }).isVisible().catch(() => false);
    }

    return { intro, sections, emptyStates, forbiddenLabels };
  },

  async "my-health-active"(page) {
    await openMyHealthPreview(page, "&state=active");
    const activeSummary = {
      records: await page.getByRole("button", { name: /Records 3 uploaded/ }).isVisible(),
      testing: await page.getByRole("button", { name: /Testing Plan saved/ }).isVisible(),
      update: await page.getByText("Records uploaded").isVisible()
    };

    await page.getByLabel("Workspace sections").getByRole("button", { name: "Records" }).click();
    const records = {
      uploaded: await page.getByText("3 records uploaded").isVisible(),
      review: await page.getByText("Metabolic panel review").isVisible(),
      timeline: await page.getByText("Latest activity today").isVisible()
    };

    await page.getByLabel("Workspace sections").getByRole("button", { name: "Testing" }).click();
    const testing = {
      savedPlan: await page.getByText("Metabolic follow-up plan").isVisible(),
      genetics: await page.getByText("Medication response panel").isVisible()
    };

    await page.getByLabel("Workspace sections").getByRole("button", { name: "Follow-up" }).click();
    const followUp = {
      active: await page.getByText("Metabolic results follow-up").isVisible(),
      questions: await page.getByText("2 open questions").isVisible()
    };

    return { activeSummary, records, testing, followUp };
  },

  async "my-health-placeholder"(page) {
    await page.goto("http://localhost:3001/my-health?layout=placeholder&signin=preview", { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    const placeholder = await page.getByRole("region", { name: "My Health placeholder" }).isVisible();
    const heading = await page.getByRole("heading", { name: "My Health" }).isVisible();
    const workspaceTabs = await page.getByLabel("Workspace sections").isVisible().catch(() => false);
    const messageLink = await page.getByRole("link", { name: "Message our team" }).getAttribute("href");

    return { placeholder, heading, workspaceTabs, messageLink };
  },

  async "my-health-record-log"(page) {
    await page.goto("http://localhost:3001/my-health?signin=preview", { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    const heading = await page.getByRole("heading", { name: "My Health" }).isVisible();
    const tabs = await page
      .getByLabel("Record sections")
      .locator("button")
      .evaluateAll((nodes) => nodes.map((node) => node.textContent));
    const bottomLauncherCount = await page.locator(".my-health-request-launcher").count();
    await page.locator(".my-health-header-action").click();
    const requestDrawer = page.locator(".my-health-request-drawer");
    const composerPlaceholder = await requestDrawer
      .getByPlaceholder("Ask about symptoms, testing, supplements, results, or what to do next...")
      .isVisible();
    const requestDrawerTitle = await requestDrawer.getByRole("heading", { name: "What do you need help with?" }).isVisible();
    const inPagePromptOpensDrawer = await requestDrawer.isVisible();
    const secondaryActionCount = await page.locator(".my-health-record-secondary-actions .portal-action-row").count();
    const recommendationCards = await page
      .getByLabel("Recommendations")
      .locator(".my-health-recommendation-card")
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          text: node.textContent,
          href: node.getAttribute("href")
        }))
      );
    await requestDrawer.getByRole("button", { name: "Compare products" }).click();
    const chipPrefill = await requestDrawer
      .getByPlaceholder("Ask about symptoms, testing, supplements, results, or what to do next...")
      .inputValue();
    const emptyOverviewRecentRecordsCount = await page.getByLabel("Recent records").count();
    await requestDrawer.getByPlaceholder("Ask about symptoms, testing, supplements, results, or what to do next...").fill("I need help with a thyroid test");
    await requestDrawer.getByRole("button", { name: "Send request" }).click();
    await page.waitForURL(/\/message-team\?request=/);
    const routedRequestText = await page.getByLabel("Message details").locator("textarea").inputValue();

    await page.goto("http://localhost:3001/my-health?signin=preview&state=active", { waitUntil: "networkidle" });
    const recentRecords = await page
      .getByLabel("Recent records")
      .locator(".my-health-record-log-item h3")
      .evaluateAll((nodes) => nodes.map((node) => node.textContent));
    await page.getByLabel("Record sections").getByRole("button", { name: "Records" }).click();
    const allRecords = await page
      .getByLabel("All records")
      .locator(".my-health-record-log-item h3")
      .evaluateAll((nodes) => nodes.map((node) => node.textContent));
    await page.getByLabel("Record sections").getByRole("button", { name: "Messages" }).click();
    const messages = await page
      .getByLabel("Messages panel")
      .locator(".my-health-record-log-item h3")
      .evaluateAll((nodes) => nodes.map((node) => node.textContent));

    await page.goto("http://localhost:3001/my-health?signin=preview&support=composer-first", { waitUntil: "networkidle" });
    const composerFirstSubmit = await page
      .getByLabel("Ask our team prompt")
      .getByRole("button", { name: "Send request" })
      .isVisible();
    await page.goto("http://localhost:3001/my-health?signin=preview&support=utility-bar", { waitUntil: "networkidle" });
    const utilityBarActions = await page
      .getByLabel("My Health quick actions")
      .locator("button,a")
      .evaluateAll((nodes) => nodes.map((node) => node.textContent));
    await page.goto("http://localhost:3001/my-health?signin=preview&support=messages-tab", { waitUntil: "networkidle" });
    await page.getByLabel("Record sections").getByRole("button", { name: "Messages" }).click();
    const messagesTabAction = await page
      .getByLabel("Messages panel")
      .getByRole("button", { name: "Ask our team" })
      .isVisible();
    await page.goto("http://localhost:3001/my-health?signin=preview&state=active&support=empty-state-only", { waitUntil: "networkidle" });
    const activeEmptyStatePromptCount = await page.locator(".my-health-header-action").count();

    return {
      heading,
      tabs,
      composerPlaceholder,
      requestDrawerTitle,
      bottomLauncherCount,
      secondaryActionCount,
      recommendationCards,
      inPagePromptOpensDrawer,
      chipPrefill,
      routedRequestText,
      emptyOverviewRecentRecordsCount,
      recentRecords,
      allRecords,
      messages,
      composerFirstSubmit,
      utilityBarActions,
      messagesTabAction,
      activeEmptyStatePromptCount
    };
  },

  async "message-team"(page) {
    await page.goto("http://localhost:3001/message-team?layout=guided", { waitUntil: "networkidle" });
    const heading = await page.getByRole("heading", { name: "What can we help you with?" }).isVisible();
    const navLinks = await page
      .locator(".consult-overlay-service-bar a:not(.consult-overlay-menu-sign-in)")
      .evaluateAll((nodes) => nodes.map((node) => node.textContent));
    const options = await page.locator(".message-team-option").evaluateAll((nodes) =>
      nodes.map((node) => node.textContent)
    );
    const subtitle = await page
      .getByText("Tell us what you're trying to figure out. We'll help you choose a test, understand results, or decide what to do next.")
      .isVisible();
    await page.getByRole("button", { name: /Understand my results/ }).click();
    const messageBox = await page.getByText("What results do you want help with?").isVisible();
    const selected = await page.getByText("You selected").isVisible();
    const upload = await page.getByText("Have results or documents?").isVisible();
    const contact = await page.getByRole("heading", { name: "Where should we reply?" }).isVisible();
    const reassurance = await page.getByText("Free to send. No obligation. We'll reply with what we think makes sense.").isVisible();
    const send = await page.getByRole("button", { name: "Send message" }).isVisible();
    await page.getByRole("button", { name: /Something else/ }).click();
    const secondaryPrompt = await page.getByText("What would you like to ask us?").isVisible();
    const secondarySelected = await page.getByText("Something else", { exact: true }).isVisible();
    await page.goto("http://localhost:3001/message-team?request=I%20want%20help%20understanding%20my%20bloodwork", {
      waitUntil: "networkidle"
    });
    const prefilledText = await page.getByLabel("Message details").locator("textarea").inputValue();
    const prefillNote = await page.getByText("We started this message from what you clicked. You can edit it before sending.").isVisible();
    const prefilledSelected = await page
      .locator(".message-team-selected")
      .getByText("Understand my results", { exact: true })
      .isVisible();

    return {
      heading,
      navLinks,
      subtitle,
      options,
      selected,
      messageBox,
      upload,
      contact,
      reassurance,
      send,
      secondaryPrompt,
      secondarySelected,
      prefilledText,
      prefillNote,
      prefilledSelected
    };
  },

  async "landing-message-cta"(page) {
    await page.goto("http://localhost:3001/?hero=consult-overlay", { waitUntil: "networkidle" });
    const retiredHeroIgnored = await page
      .getByRole("heading", { name: "Healthcare services without the guesswork." })
      .isVisible();
    const oldCtaCount = await page.getByRole("link", { name: "Message our team" }).count();

    return { retiredHeroIgnored, oldCtaCount };
  },

  async "landing-search-hero"(page) {
    await page.goto("http://localhost:3001/", { waitUntil: "networkidle" });
    const heading = await page.getByRole("heading", { name: "Healthcare services without the guesswork." }).isVisible();
    const subtitleVisible = await page
      .getByText("Tell us what you're trying to figure out, or choose a service to start. We'll help you find the right option for testing, results, and next steps.")
      .isVisible()
      .catch(() => false);
    const searchPlaceholder = await page
      .getByPlaceholder("Search services or describe what you need...")
      .isVisible();
    const assurance = await page
      .getByText("Free to ask. We'll help route you to the right option.")
      .isVisible();
    const cards = await page.locator(".home-hero-search-card").evaluateAll((nodes) =>
      nodes.map((node) => node.textContent)
    );
    const cardTags = await page.locator(".home-hero-search-card").evaluateAll((nodes) =>
      nodes.map((node) => node.tagName)
    );
    const cardHrefs = await page.locator(".home-hero-search-card").evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("href"))
    );
    const searchBarTag = await page.locator(".home-hero-search-bar").evaluate((node) => node.tagName);
    const heroNavButtons = await page
      .getByRole("button", { name: /starting points/i })
      .count();
    await page.getByPlaceholder("Search services or describe what you need...").fill("I want help with thyroid labs");
    await page.getByRole("button", { name: "Ask our team" }).click();
    const requestModalTitle = await page.getByRole("heading", { name: "Ask our team" }).isVisible();
    const modalPrefillText = await page.locator(".services-request-form textarea").inputValue();
    await page.getByRole("button", { name: "Send request" }).click();
    await page.waitForURL("**/message-team?request=I%20want%20help%20with%20thyroid%20labs");
    const routedRequestText = await page.locator("textarea").inputValue();

    return {
      heading,
      subtitleVisible,
      searchPlaceholder,
      assurance,
      cards,
      cardTags,
      cardHrefs,
      searchBarTag,
      heroNavButtons,
      requestModalTitle,
      modalPrefillText,
      routedRequestText
    };
  },

  async "landing-mobile-hero-cards"(page) {
    async function measureLanding(width) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("http://localhost:3001/", { waitUntil: "networkidle" });

      const heroCards = await page.locator(".home-hero-search-card").evaluateAll((nodes) =>
        nodes.map((node) => node.textContent)
      );
      const heroRows = await page.locator(".home-hero-search-card").evaluateAll((nodes) =>
        Array.from(new Set(nodes.map((node) => Math.round(node.getBoundingClientRect().top)))).length
      );
      const sectionCards = await page
        .locator(".home-specific-carousel")
        .first()
        .locator(".home-specific-service-card")
        .evaluateAll((nodes) => nodes.map((node) => node.textContent));
      const sectionRows = await page
        .locator(".home-specific-carousel")
        .first()
        .locator(".home-specific-service-card")
        .evaluateAll((nodes) =>
          Array.from(new Set(nodes.map((node) => Math.round(node.getBoundingClientRect().top)))).length
        );

      return { heroCards, heroRows, sectionCards, sectionRows };
    }

    return {
      phone: await measureLanding(390),
      largePhone: await measureLanding(500),
      tablet: await measureLanding(640),
      smallDesktop: await measureLanding(860)
    };
  },

  async "landing-service-carousels"(page) {
    await page.goto("http://localhost:3001/", { waitUntil: "networkidle" });
    const serviceCards = await page.locator(".home-specific-carousel").first().locator(".home-specific-service-card").evaluateAll((nodes) =>
      nodes.map((node) => node.textContent)
    );
    const servicePriceLabels = await page.locator(".services-catalog-price").count();
    const reviewCards = await page
      .locator(".home-specific-carousel-review")
      .locator(".home-specific-review-card")
      .evaluateAll((nodes) => nodes.map((node) => node.textContent));
    const reviewCardLinks = await page
      .locator(".home-specific-carousel-review")
      .locator(".home-specific-review-card")
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          tag: node.tagName,
          href: node.getAttribute("href")
        }))
      );
    const testsHeading = await page.getByRole("heading", { name: "Tests" }).isVisible();
    const wellnessHeading = await page.getByRole("heading", { name: "Wellness", exact: true }).isVisible();
    const analysisHeading = await page.getByRole("heading", { name: "Analysis", exact: true }).isVisible();
    const careHeading = await page.getByRole("heading", { name: "Care", exact: true }).isVisible();
    const treatmentsHeading = await page.getByRole("heading", { name: "Treatments", exact: true }).isVisible();
    const bloodworkAnalysis = await page.getByText("Bloodwork analysis").isVisible();
    const hormoneAnalysis = await page.getByText("Hormone analysis").isVisible();
    const primaryCare = await page.getByText("Primary care").isVisible();
    const medicationReview = await page.getByText("Medication review").isVisible();
    await page.getByRole("button", { name: "Next tests" }).click();
    await page.getByRole("button", { name: "Next tests" }).click();
    const thyroidTesting = await page.getByText("Thyroid testing").isVisible();
    await page.getByRole("button", { name: "Next analysis categories" }).click();
    const geneticAnalysis = await page.getByText("Genetic analysis").isVisible();
    const viewAllTests = await page.getByRole("link", { name: /View all tests/ }).getAttribute("href");
    const viewAllWellness = await page.getByRole("link", { name: /View all wellness/ }).getAttribute("href");
    const viewAllAnalysis = await page.getByRole("link", { name: /View all analysis/ }).getAttribute("href");

    return {
      serviceCount: serviceCards.length,
      reviewCount: reviewCards.length,
      testsHeading,
      wellnessHeading,
      analysisHeading,
      careHeading,
      treatmentsHeading,
      thyroidTesting,
      bloodworkAnalysis,
      hormoneAnalysis,
      geneticAnalysis,
      primaryCare,
      medicationReview,
      viewAllTests,
      viewAllWellness,
      viewAllAnalysis,
      reviewCardLinks,
      servicePriceLabels
    };
  },

  async "landing-care-section"(page) {
    await page.goto("http://localhost:3001/?clinicians=current", { waitUntil: "networkidle" });
    const heroCards = await page.locator(".home-hero-search-card").evaluateAll((nodes) =>
      nodes.map((node) => node.textContent)
    );
    const careHeading = await page.getByRole("heading", { name: "Care", exact: true }).isVisible();
    const cliniciansHeading = await page.getByRole("heading", { name: "Clinicians", exact: true }).isVisible().catch(() => false);
    const viewAllCare = await page.getByRole("link", { name: "View all care" }).getAttribute("href");
    const nextCare = await page.getByRole("button", { name: "Next care options" }).isVisible();
    const primaryCare = await page.getByText("Primary care").isVisible();

    return { heroCards, careHeading, cliniciansHeading, viewAllCare, nextCare, primaryCare };
  },

  async "library-forum"(page) {
    await page.goto("http://localhost:3001/library", { waitUntil: "networkidle" });
    const navLinks = await page
      .locator(".consult-overlay-service-bar a:not(.consult-overlay-menu-sign-in)")
      .evaluateAll((nodes) => nodes.map((node) => node.textContent));
    const heroVisible = await page.locator(".library-hero").isVisible().catch(() => false);
    const title = await page.locator("#library-forum-title").textContent();
    const categories = await page
      .locator(".library-forum-categories h3")
      .evaluateAll((nodes) => nodes.map((node) => node.textContent));
    const threads = await page
      .locator(".library-forum-threads h4")
      .evaluateAll((nodes) => nodes.map((node) => node.textContent));
    const cta = await page.getByRole("link", { name: "Start a discussion" }).isVisible();

    return {
      title,
      navLinks,
      heroVisible,
      categories,
      threads,
      cta
    };
  },

  async "services-catalog"(page) {
    await page.goto("http://localhost:3001/services", { waitUntil: "networkidle" });
    const heading = await page.getByRole("heading", { name: "Services", exact: true }).isVisible();
    const navLinks = await page
      .locator(".consult-overlay-service-bar a:not(.consult-overlay-menu-sign-in)")
      .evaluateAll((nodes) => nodes.map((node) => node.textContent));
    const categories = await page
      .getByLabel("Service categories")
      .locator("button")
      .evaluateAll((nodes) => nodes.map((node) => node.textContent));
    const initialCards = await page.locator(".services-catalog-card h3").allTextContents();
    const initialPrices = await page.locator(".services-catalog-price").allTextContents();
    await page.locator(".services-request-launcher").click();
    const serviceRequestPopup = await page.getByRole("dialog", { name: "Ask our team" }).isVisible();
    await page.getByRole("button", { name: "Compare services" }).click();
    const serviceRequestPrefill = await page
      .getByPlaceholder("Ask about symptoms, testing, supplements, results, or what to do next...")
      .inputValue();
    await page.getByRole("button", { name: "Close ask our team popup" }).click();
    await page.getByRole("button", { name: "Wellness" }).click();
    const wellnessCards = await page.locator(".services-catalog-card h3").allTextContents();
    const wellnessPrices = await page.locator(".services-catalog-price").allTextContents();
    await page.getByLabel("Search services or describe what you need").fill("hair");
    const filteredCards = await page.locator(".services-catalog-card h3").allTextContents();
    await page.goto("http://localhost:3001/services?category=Care", { waitUntil: "networkidle" });
    const categoryQueryHeading = await page.getByRole("heading", { name: "Care", exact: true }).isVisible();
    const categoryQueryCards = await page.locator(".services-catalog-card h3").allTextContents();

    return {
      heading,
      navLinks,
      categories,
      initialCount: initialCards.length,
      initialPrices,
      serviceRequestPopup,
      serviceRequestPrefill,
      wellnessCards,
      wellnessPrices,
      filteredCards,
      categoryQueryHeading,
      categoryQueryCards
    };
  },

  async "shared-overlay-header"(page) {
    const pages = [
      { name: "landing", path: "/", contentSelector: ".home-hero-consult-search" },
      { name: "services", path: "/services", contentSelector: ".services-catalog-hero" },
      { name: "library", path: "/library", contentSelector: ".library-collection-grid" },
      {
        name: "myHealth",
        path: "/my-health?signin=preview",
        contentSelector: ".my-health-record-log"
      }
    ];
    const measurements = {};

    for (const pageConfig of pages) {
      await page.goto(`http://localhost:3001${pageConfig.path}`, { waitUntil: "networkidle" });
      const header = await page.locator(".consult-overlay-header").boundingBox();
      const bar = await page.locator(".consult-overlay-primary-bar").boundingBox();
      const content = await page.locator(pageConfig.contentSelector).boundingBox();
      const activeLinks = await page
        .locator(".consult-overlay-service-bar a[aria-current='page']")
        .evaluateAll((nodes) => nodes.map((node) => node.textContent));
      const accountIconVisible = await page.locator(".consult-overlay-account-icon").isVisible();

      measurements[pageConfig.name] = {
        header: roundRect(header),
        bar: roundRect(bar),
        content: roundRect(content),
        activeLinks,
        accountIconVisible,
        gapBelowHeader: header && content ? Math.round(content.y - (header.y + header.height)) : null
      };
    }

    return { measurements };
  },

  async "mobile-header-menu"(page) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3001/services", { waitUntil: "networkidle" });
    const topBarSignIn = await page.locator(".consult-overlay-mobile-sign-in").isVisible().catch(() => false);
    const accountIconVisible = await page.locator(".consult-overlay-account-icon").isVisible();
    await page.getByRole("button", { name: "Toggle navigation menu" }).click();
    const menuLinks = await page
      .locator(".consult-overlay-service-bar a")
      .evaluateAll((nodes) => nodes.map((node) => ({ text: node.textContent, visible: !!node.offsetParent })));
    const signInVisible = await page.locator(".consult-overlay-menu-sign-in").isVisible();

    return { topBarSignIn, accountIconVisible, menuLinks, signInVisible };
  },

  async "product-detail-preview"(page) {
    await page.goto("http://localhost:3001/products/general-health-check-labs?signin=preview", { waitUntil: "networkidle" });
    const heading = await page.getByRole("heading", { name: "General Health Check Labs" }).isVisible();
    const previewDescription = await page
      .getByText("A design preview for a baseline lab panel")
      .isVisible();
    const assessmentCta = await page.getByRole("link", { name: "Start Assessment" }).isVisible();
    const backendError = await page.getByText("Product not found").isVisible().catch(() => false);

    return { heading, previewDescription, assessmentCta, backendError };
  },

  async "product-intake-preview"(page) {
    await page.goto("http://localhost:3001/intake/general-health-check-labs", { waitUntil: "networkidle" });
    const heading = await page.getByRole("heading", { name: "General Health Check Labs intake" }).isVisible();
    const firstQuestion = await page.getByText("What are you trying to understand?").isVisible();
    await page.getByLabel("What are you trying to understand?").selectOption("baseline");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Submit Assessment" }).click();
    const reviewRequired = await page.getByText("Review required").isVisible();
    const backendError = await page.getByText("Program not found").isVisible().catch(() => false);
    const authGate = await page.getByRole("heading", { name: "Save your assessment" }).isVisible().catch(() => false);

    return { heading, firstQuestion, reviewRequired, backendError, authGate };
  }
};

async function openMyHealthPreview(page, extraParams = "") {
  await page.goto(`http://localhost:3001/my-health?layout=workspace&signin=preview${extraParams}`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
}

function roundRect(rect) {
  if (!rect) {
    return null;
  }

  return Object.fromEntries(Object.entries(rect).map(([key, value]) => [key, Math.round(value)]));
}

const checkName = process.argv[2] ?? "my-health-rail";

if (!checks[checkName]) {
  console.error(`Unknown check "${checkName}". Available checks: ${Object.keys(checks).join(", ")}`);
  process.exit(2);
}

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const result = await checks[checkName](page);
  console.log(JSON.stringify({ check: checkName, ...result }));
} finally {
  await browser.close();
}
