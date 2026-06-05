import type { AutofillProfile } from "../../shared/profile";
import type { FieldMatch, FieldType } from "../detectors/base";

function dispatchInputEvents(element: HTMLElement) {
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function setValue(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string
) {
  if (element instanceof HTMLSelectElement) {
    const option = Array.from(element.options).find((opt) =>
      opt.text.toLowerCase().includes(value.toLowerCase())
    );
    if (option) {
      element.value = option.value;
      dispatchInputEvents(element);
    }
    return;
  }

  element.value = value;
  dispatchInputEvents(element);
}

function valueForField(type: FieldType, profile: AutofillProfile) {
  switch (type) {
    case "fullName":
      return profile.fullName;
    case "firstName":
      return profile.fullName.split(" ")[0] || profile.fullName;
    case "lastName":
      return profile.fullName.split(" ").slice(1).join(" ");
    case "email":
      return profile.email;
    case "phone":
      return profile.phone;
    case "linkedinUrl":
      return profile.linkedinUrl;
    case "githubUrl":
      return profile.githubUrl;
    case "portfolioUrl":
      return profile.portfolioUrl;
    case "location":
      return "";
    case "skills":
      return profile.skills.join(", ");
    case "education":
      return profile.education
        .map((edu) => `${edu.degree} ${edu.fieldOfStudy} ${edu.institution}`.trim())
        .join("; ");
    case "experience":
      return profile.experience
        .map((exp) => `${exp.position} at ${exp.company}`.trim())
        .join("; ");
    case "resume":
      return "";
    default:
      return "";
  }
}

export function autofillFields(
  matches: Map<FieldType, FieldMatch>,
  profile: AutofillProfile
) {
  matches.forEach((match) => {
    const element = match.element;

    if (element instanceof HTMLInputElement && element.type === "file") {
      element.setAttribute("data-nextzen-autofill", "resume");
      return;
    }

    const value = valueForField(match.type, profile);
    if (!value) {
      return;
    }

    setValue(element, value);
    element.setAttribute("data-nextzen-autofill", "filled");
  });
}
