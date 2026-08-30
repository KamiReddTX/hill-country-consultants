"use client";
import { useState } from "react";

/** Turn a known share URL into an embeddable player URL. Returns null when the
 *  provider isn't recognized (we fall back to a "Watch recording" button). */
function embedUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") { const id = u.searchParams.get("v"); return id ? `https://www.youtube.com/embed/${id}` : null; }
    if (host === "youtu.be") { const id = u.pathname.slice(1); return id ? `https://www.youtube.com/embed/${id}` : null; }
    if (host === "vimeo.com") { const id = u.pathname.split("/").filter(Boolean)[0]; return id ? `https://player.vimeo.com/video/${id}` : null; }
    if (host.endsWith("loom.com")) { const id = u.pathname.split("/share/")[1]?.split("/")[0] || u.pathname.split("/embed/")[1]; return id ? `https://www.loom.com/embed/${id}` : null; }
    return null;
  } catch { return null; }
}

/** Collapsible "Onboarding call" panel on the client dashboard: watch the
 *  recording inline and open the transcript PDF in a new tab. */
export function OnboardingRecording({ videoUrl, hasTranscript, clientId, recordedAt }: { videoUrl: string | null; hasTranscript: boolean; clientId: string; recordedAt?: string | null }) {
  const [open, setOpen] = useState(false);
  const embed = videoUrl ? embedUrl(videoUrl) : null;

  return (
    <section>
      <div className="border border-line-warm bg-white">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
          <span>
            <span className="font-fraunces text-[20px] text-forest">Onboarding call recording</span>
            {recordedAt && <span className="ml-2 text-[12px] text-ink-faint">· {new Date(recordedAt).toLocaleDateString()}</span>}
            <span className="mt-0.5 block text-[13px] prose-muted">Watch your onboarding call and open the transcript.</span>
          </span>
          <span className="text-[13px] text-forest">{open ? "▲ Hide" : "▼ Show"}</span>
        </button>
        {open && (
          <div className="flex flex-col gap-3 border-t border-line-soft p-5">
            {embed ? (
              <div className="relative w-full overflow-hidden rounded-[var(--r,14px)] border border-line-soft" style={{ paddingTop: "56.25%" }}>
                <iframe src={embed} title="Onboarding call recording" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen className="absolute inset-0 h-full w-full" />
              </div>
            ) : videoUrl ? (
              <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="btn-gold self-start text-[14px]">Watch the recording</a>
            ) : (
              <p className="text-[14px] prose-muted">The video will appear here once your team uploads it.</p>
            )}
            {hasTranscript && (
              <a href={`/api/onboarding-transcript/${clientId}`} target="_blank" rel="noopener noreferrer" className="btn-outline self-start text-[13px]">Open transcript (PDF)</a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
