// Maldives helplines. Every entry was checked against an official source on HELPLINES_CHECKED.
// Never add a number here that you haven't verified: someone in crisis may rely on it.
export type HelplineKind = "emergency" | "mental-health" | "child" | "family" | "youth";

export interface Helpline {
  id: string;
  name: string;
  /** As people say it. */
  number: string;
  /** For tel: links (digits and +). */
  tel: string;
  blurb: string;
  hours: string;
  kind: HelplineKind;
  source: { label: string; url: string };
}

export const HELPLINES_CHECKED = "27 October 2026";

const POLICE = { label: "Maldives Police Service", url: "https://www.police.gov.mv/important-contacts" };

export const HELPLINES: Helpline[] = [
  {
    id: "emergency", name: "National Emergency", number: "911", tel: "911", kind: "emergency",
    blurb: "Police, ambulance, coast guard, and fire & rescue. Call if someone is in immediate danger.",
    hours: "24 hours",
    source: { label: "Maldives Police Service (911 launched 14 Nov 2024)", url: POLICE.url },
  },
  {
    id: "mental-health", name: "National Mental Health Helpline", number: "1677", tel: "1677", kind: "mental-health",
    blurb: "Free, confidential psychological first aid for anyone in distress, including thoughts of self-harm. For Maldivians and residents, all ages.",
    hours: "24 hours",
    source: { label: "Ministry of Health, via the President's Office", url: "https://blogs.presidency.gov.mv/daily-blogs/national-mental-health-helpline-offers-247-confidential-support" },
  },
  {
    id: "child", name: "Child Helpline", number: "1412", tel: "1412", kind: "child",
    blurb: "Child protection and welfare. For children, or anyone worried about a child.",
    hours: "24 hours", source: POLICE,
  },
  {
    id: "social", name: "Social Services & Domestic Violence Helpline", number: "1421", tel: "1421", kind: "family",
    blurb: "Support with social services and domestic violence, from the Ministry of Social and Family Development.",
    hours: "Hours not published",
    source: { label: "Ministry of Social and Family Development", url: "https://msfd.gov.mv/en?p=2160" },
  },
  {
    id: "fpa", name: "Family Protection Authority", number: "+960 301-0551", tel: "+9603010551", kind: "family",
    blurb: "Report domestic violence and child protection concerns.",
    hours: "Hours not published", source: POLICE,
  },
  {
    id: "students", name: "Psychological First Aid for Teachers & Students", number: "1484", tel: "1484", kind: "youth",
    blurb: "A Ministry of Education line staffed by trained school counsellors.",
    hours: "Reported 15:00–21:00, not Fridays (may have changed)",
    source: { label: "Ministry of Education", url: "https://www.moe.gov.mv/en/contact" },
  },
];

export const byId = (id: string) => HELPLINES.find((h) => h.id === id)!;
