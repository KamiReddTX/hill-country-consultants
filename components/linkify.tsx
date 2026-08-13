import { Fragment, type ReactNode } from "react";

const EMAIL = "info@hillcountryconsultants.com";

/**
 * Render a plain string, turning any bare mention of our email address into a
 * clickable mailto link so a click opens a new message to us.
 */
export function linkifyEmail(text: string): ReactNode {
  const parts = text.split(EMAIL);
  if (parts.length === 1) return text;
  return parts.map((p, i) => (
    <Fragment key={i}>
      {p}
      {i < parts.length - 1 ? (
        <a href={`mailto:${EMAIL}`} className="link-underline">
          {EMAIL}
        </a>
      ) : null}
    </Fragment>
  ));
}
