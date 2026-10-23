
document.addEventListener("DOMContentLoaded", () => {
  // Get website elements
  const article = document.getElementById("article");
  const counter = document.getElementById("counter");
  const report = document.getElementById("analysis");
  const signalsBox = document.getElementById("signalList");
  const analyzeButton = document.getElementById("analyze");
  const copyButton = document.getElementById("copy");
  const examples = document.querySelectorAll(".sample");

  // Check that essential elements exist
  if (!article || !report || !analyzeButton || !signalsBox) {
    console.error(
      "NewsGuard AI: Required HTML elements were not found. Check the IDs in index.html."
    );
    return;
  }

  // Character counter
  function updateCounter() {
    if (counter) {
      counter.textContent =
        `${article.value.length.toLocaleString()} / 12,000`;
    }
  }

  article.addEventListener("input", updateCounter);
  updateCounter();

  // Example buttons
  examples.forEach((button) => {
    button.addEventListener("click", () => {
      article.value = button.dataset.text || "";
      updateCounter();
      article.focus();
    });
  });

  // Analyze text using simple browser-based rules
  function analyzeText(text) {
    const lower = text.toLowerCase();

    const checks = [
      {
        title: "Sensational language",
        terms: [
          "shocking",
          "secret",
          "you won't believe",
          "urgent",
          "miracle",
          "!!!",
          "share this"
        ],
        detail:
          "Emotional or sensational wording can attract attention. It does not prove that a claim is false."
      },
      {
        title: "Absolute promises",
        terms: [
          "everyone will",
          "guaranteed",
          "100% proven",
          "always works",
          "never fails",
          "one million dollars"
        ],
        detail:
          "Broad promises need reliable, specific evidence and context."
      },
      {
        title: "Evidence and attribution",
        terms: [
          "according to",
          "study",
          "researchers",
          "official statement",
          "published by",
          "data shows"
        ],
        detail:
          "Look for the original study, named source, publication date, and supporting evidence."
      },
      {
        title: "Specific details",
        terms: [
          "yesterday",
          "on monday",
          "in 2025",
          "in 2026",
          "percent",
          "university",
          "report"
        ],
        detail:
          "Dates, names, and precise details can help you investigate a claim's original context."
      }
    ];

    const found = checks.map((check) => {
      const matches = check.terms.filter((term) =>
        lower.includes(term)
      );

      let status = matches.length ? "Caution" : "Unknown";

      if (
        check.title === "Evidence and attribution" &&
        matches.length > 0
      ) {
        status = "Positive";
      }

      return {
        ...check,
        status,
        matches
      };
    });

    const cautionCount = found.filter(
      (item) => item.status === "Caution"
    ).length;

    const hasEvidenceWords = found.some(
      (item) =>
        item.title === "Evidence and attribution" &&
        item.matches.length > 0
    );

    let title = "Needs verification";
    let summary =
      "Text alone is not enough to confirm this claim. Check the original publisher and compare the details with independent, reliable sources.";
    let level = "Moderate warning signs";

    if (cautionCount >= 2) {
      title = "Potential warning signs";
      summary =
        "The text contains wording patterns that deserve closer scrutiny. These patterns are not proof of misinformation. Verify the claim using reliable sources.";
      level = "Several wording flags";
    } else if (hasEvidenceWords && cautionCount === 0) {
      title = "More context needed";
      summary =
        "The text includes words that may point to evidence, but the actual sources and supporting facts have not been checked.";
      level = "Some evidence-related wording";
    }

    return {
      title,
      summary,
      level,
      found
    };
  }

  // Analyze button
  analyzeButton.addEventListener("click", () => {
    const text = article.value.trim();

    if (text.length < 20) {
      alert("Please enter a headline or claim of at least 20 characters.");
      article.focus();
      return;
    }

    if (text.length > 12000) {
      alert("Please keep your text within 12,000 characters.");
      article.focus();
      return;
    }

    try {
      const result = analyzeText(text);

      // Update verdict
      const verdictTitle = document.getElementById("verdictTitle");
      const summary = document.getElementById("summary");
      const scoreText = document.getElementById("scoreText");
      const verdictIcon = document.getElementById("verdictIcon");
      const meterFill = document.getElementById("meterFill");
      const timestamp = document.getElementById("timestamp");

      if (verdictTitle) {
        verdictTitle.textContent = result.title;
      }

      if (summary) {
        summary.textContent = result.summary;
      }

      if (scoreText) {
        scoreText.textContent = result.level;
      }

      if (verdictIcon) {
        const hasWarnings =
          result.title === "Potential warning signs";

        verdictIcon.textContent = hasWarnings ? "!" : "?";
        verdictIcon.className =
          "verdict-icon" + (hasWarnings ? " bad" : "");
      }

      if (meterFill) {
        const hasWarnings =
          result.title === "Potential warning signs";

        const needsContext =
          result.title === "More context needed";

        meterFill.className = hasWarnings
          ? "high"
          : needsContext
          ? "low"
          : "";

        meterFill.style.width = hasWarnings
          ? "78%"
          : needsContext
          ? "25%"
          : "48%";
      }

      // Build the signal breakdown safely
      signalsBox.replaceChildren();

      result.found.forEach((item) => {
        const signal = document.createElement("div");
        signal.className = "signal";

        const signalIcon = document.createElement("span");

        const iconClass =
          item.status === "Caution"
            ? "caution"
            : item.status === "Positive"
            ? "good"
            : "";

        const symbol =
          item.status === "Caution"
            ? "!"
            : item.status === "Positive"
            ? "✓"
            : "·";

        signalIcon.className = "signal-icon " + iconClass;
        signalIcon.textContent = symbol;

        const content = document.createElement("div");
        const heading = document.createElement("b");
        const detail = document.createElement("p");

        heading.textContent =
          item.title + " · " + item.status;

        detail.textContent =
          item.detail +
          (item.matches.length
            ? " Matched text pattern(s): " +
              item.matches.join(", ") +
              "."
            : "");

        content.append(heading, detail);
        signal.append(signalIcon, content);
        signalsBox.appendChild(signal);
      });

      if (timestamp) {
        timestamp.textContent =
          "Demo review · " + new Date().toLocaleString();
      }

      // Reveal the report
      report.classList.remove("hidden");

      // Move to the Analysis section
      requestAnimationFrame(() => {
        report.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        // Update the address-bar hash without triggering
        // an additional automatic jump.
        if (window.location.hash !== "#analysis") {
          history.replaceState(null, "", "#analysis");
        }
      });
    } catch (error) {
      console.error("NewsGuard AI analysis error:", error);
      alert(
        "Something went wrong while creating the report. Check your script.js and index.html files."
      );
    }
  });

  // Copy report button
  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const reportText = report.innerText.trim();

      if (!reportText) {
        alert("Please analyze a claim before copying the report.");
        return;
      }

      try {
        await navigator.clipboard.writeText(reportText);

        const originalText = copyButton.textContent;
        copyButton.textContent = "Copied!";

        setTimeout(() => {
          copyButton.textContent = originalText;
        }, 2000);
      } catch (error) {
        console.error("Copy failed:", error);
        alert(
          "Copy was blocked by your browser. Please select and copy the report text manually."
        );
      }
    });
  }

  console.log("NewsGuard AI script loaded successfully.");
});
```
```