const PRODUCT = {
  iuPerDrop: 5000,
  k2PerDropUg: 100,
  daysPerDrop: 5,
};

const form = document.querySelector("#dose-form");
const leadForm = document.querySelector("#lead-form");
const steps = [...document.querySelectorAll(".step")];
const progress = [...document.querySelectorAll(".progress span")];
const prevButton = document.querySelector("#prev-step");
const nextButton = document.querySelector("#next-step");
const submitButton = document.querySelector("#submit-check");
const result = document.querySelector("#result");
const resultTitle = document.querySelector("#result-title");
const resultCopy = document.querySelector("#result-copy");
const resultList = document.querySelector("#result-list");
const labFields = document.querySelector("#lab-fields");
const validationMessage = document.querySelector("#validation-message");
const leadSection = document.querySelector("#lead-section");
let currentStep = 0;

function showStep(index) {
  currentStep = index;
  steps.forEach((step, stepIndex) => step.classList.toggle("is-active", stepIndex === index));
  progress.forEach((item, stepIndex) => item.classList.toggle("is-active", stepIndex <= index));
  prevButton.style.visibility = index === 0 ? "hidden" : "visible";
  nextButton.style.display = index === steps.length - 1 ? "none" : "inline-flex";
  submitButton.style.display = index === steps.length - 1 ? "inline-flex" : "none";
}

function getData() {
  const data = new FormData(form);
  return {
    age: Number(data.get("age")),
    pregnant: data.has("pregnant"),
    bloodThinner: data.has("bloodThinner"),
    kidney: data.has("kidney"),
    calcium: data.has("calcium"),
    sarcoidosis: data.has("sarcoidosis"),
    otherD: data.has("otherD"),
    knownLab: data.get("knownLab"),
    labValue: Number(data.get("labValue")),
    labUnit: data.get("labUnit"),
    weight: Number(data.get("weight")),
    sun: data.get("sun"),
    goal: data.get("goal"),
    currentIntake: data.get("currentIntake"),
  };
}

function ngMlValue(data) {
  if (data.knownLab !== "yes" || !data.labValue) return null;
  return data.labUnit === "nmol" ? data.labValue / 2.5 : data.labValue;
}

function riskReasons(data) {
  const reasons = [];
  if (!data.age || data.age < 18) reasons.push("unter 18 Jahre");
  if (data.pregnant) reasons.push("Schwangerschaft oder Stillzeit");
  if (data.bloodThinner) reasons.push("blutgerinnungshemmende Medikamente");
  if (data.kidney) reasons.push("Nierenerkrankung oder Nierensteine");
  if (data.calcium) reasons.push("erhöhte Calciumwerte");
  if (data.sarcoidosis) reasons.push("Sarkoidose oder Nebenschilddrüsen-Erkrankung");
  if (data.otherD || data.currentIntake === "high") reasons.push("bereits hohe Vitamin-D-Einnahme");
  return reasons;
}

function buildResult(data) {
  const risks = riskReasons(data);
  const ng = ngMlValue(data);
  const averageDaily = Math.round(PRODUCT.iuPerDrop / PRODUCT.daysPerDrop);

  if (risks.length) {
    return {
      title: "Bitte nicht selbst dosieren",
      copy: "Bei deinen Angaben gibt es mindestens einen kritischen Punkt. SonnVita sollte in diesem Fall nur nach ärztlicher oder apothekerlicher Rücksprache verwendet werden.",
      items: [
        `Kritischer Punkt: ${risks.join(", ")}.`,
        "Nimm diese Angaben zum Arzt- oder Apothekengespräch mit.",
        "Bei Langzeiteinnahme sollten Calciumwerte und Nierenfunktion geprüft werden.",
      ],
    };
  }

  if (ng === null) {
    const interval = data.sun === "high" ? "eher kein Start ohne Blutwert oder nur nach Rücksprache" : "1 Tropfen alle 5 Tage als Packungs-Intervall";
    return {
      title: "Erst Blutwert klären",
      copy: "Ohne 25-OH-D-Blutwert ist keine persönliche Dosierung sauber ableitbar. Die sichere Orientierung ist deshalb: Blutwert bestimmen und die Packungsangabe nicht überschreiten.",
      items: [
        `Packungs-Intervall: ${interval}.`,
        `1 Tropfen alle 5 Tage entspricht durchschnittlich ca. ${averageDaily} I.E. Vitamin D3 pro Tag.`,
        "Wenn du wenig Sonne bekommst oder einen Mangel vermutest: 25-OH-D im Labor testen lassen.",
      ],
    };
  }

  if (ng < 10) {
    return {
      title: "Sehr niedriger Wert: Arzt-Plan sinnvoll",
      copy: "Dein Wert liegt deutlich niedrig. Eine Aufsättigung sollte nicht über einen QR-Rechner festgelegt werden, sondern mit Blutwert-Kontrolle.",
      items: [
        `Gemessener Wert: ${ng.toFixed(1)} ng/ml.`,
        "Besprich eine zeitlich begrenzte Aufsättigung und Kontrollmessung.",
        "Bis zur Klärung die angegebene Tagesdosis nicht überschreiten.",
      ],
    };
  }

  if (ng < 20) {
    return {
      title: "Niedriger Wert: gezielt abklären",
      copy: "Dein Wert ist niedrig. Das Packungs-Intervall kann eine Orientierung sein, die konkrete Aufsättigung sollte aber ärztlich festgelegt werden.",
      items: [
        `Gemessener Wert: ${ng.toFixed(1)} ng/ml.`,
        "Orientierung für das Gespräch: 1 Tropfen alle 5 Tage, sofern keine Gegenanzeigen bestehen.",
        "Nach 8 bis 12 Wochen Blutwert, Calcium und bei Bedarf Nierenfunktion kontrollieren lassen.",
      ],
    };
  }

  if (ng < 30) {
    const weightNote = data.weight >= 95 ? "Bei höherem Körpergewicht kann der Bedarf größer sein; bitte mit Blutwertkontrolle klären." : "Körpergewicht unauffällig für die Standard-Orientierung.";
    return {
      title: "Unterer Bereich: Standard-Intervall prüfen",
      copy: "Dein Wert liegt im unteren Bereich. Als Orientierung passt die Fünf-Tagesdosierung, sofern Arzt oder Apotheke keine andere Empfehlung geben.",
      items: [
        `Gemessener Wert: ${ng.toFixed(1)} ng/ml.`,
        `Orientierung: 1 Tropfen alle ${PRODUCT.daysPerDrop} Tage.`,
        weightNote,
      ],
    };
  }

  if (ng <= 50) {
    const sunNote = data.sun === "high" ? "Bei viel Sonne kann eine Pause oder ein längeres Intervall sinnvoll sein." : "Das Packungs-Intervall ist als Erhaltungs-Orientierung plausibel.";
    return {
      title: "Zielbereich: eher erhalten",
      copy: "Dein Wert liegt in einem häufig genutzten Orientierungsbereich. Jetzt geht es eher um Erhaltung als um Hochdosierung.",
      items: [
        `Gemessener Wert: ${ng.toFixed(1)} ng/ml.`,
        `Maximale Orientierung ohne Sonderplan: 1 Tropfen alle ${PRODUCT.daysPerDrop} Tage.`,
        sunNote,
      ],
    };
  }

  return {
    title: "Hoher Wert: keine Hochdosierung",
    copy: "Dein Wert ist bereits hoch genug für eine vorsichtige Einordnung. Nimm zusätzliches hochdosiertes Vitamin D nur nach Rücksprache.",
    items: [
      `Gemessener Wert: ${ng.toFixed(1)} ng/ml.`,
      "Keine Steigerung der Einnahme über diesen Check.",
      "Bei weiterer Einnahme Calciumwerte und Nierenfunktion kontrollieren lassen.",
    ],
  };
}

function renderResult(outcome) {
  resultTitle.textContent = outcome.title;
  resultCopy.textContent = outcome.copy;
  resultList.innerHTML = "";
  outcome.items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    resultList.append(li);
  });
  result.hidden = false;
  leadSection.hidden = false;
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

function validateVisibleStep() {
  const inputs = [...steps[currentStep].querySelectorAll("input[required], select[required]")];
  const invalid = inputs.find((input) => !input.checkValidity());
  if (invalid) {
    validationMessage.textContent = "Bitte fülle zuerst das markierte Feld aus.";
    invalid.reportValidity();
    invalid.focus();
    return false;
  }
  validationMessage.textContent = "";
  return true;
}

document.querySelectorAll("input[name='knownLab']").forEach((input) => {
  input.addEventListener("change", () => {
    labFields.style.display = input.value === "no" && input.checked ? "none" : "grid";
  });
});

nextButton.addEventListener("click", () => {
  if (!validateVisibleStep()) return;
  showStep(Math.min(currentStep + 1, steps.length - 1));
});

prevButton.addEventListener("click", () => {
  showStep(Math.max(currentStep - 1, 0));
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderResult(buildResult(getData()));
});

leadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const note = document.querySelector("#lead-note");
  note.textContent = "Danke. Im Prototyp wurde der Kontakt lokal bestätigt; für Live-Betrieb wird hier dein Marketing-Tool angebunden.";
  leadForm.reset();
});

showStep(0);
