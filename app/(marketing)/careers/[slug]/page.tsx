import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/careers/markdown";
import { ApplicationForm } from "@/components/careers/application-form";
import { JOBS, jobBySlug } from "@/content/careers";

export function generateStaticParams() {
  return JOBS.map((j) => ({ slug: j.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const job = jobBySlug(params.slug);
  if (!job) return { title: "Role not found · Hill Country Consultants" };
  return {
    title: `${job.title} — Careers · Hill Country Consultants`,
    description: job.summary,
  };
}

export default function JobPage({ params }: { params: { slug: string } }) {
  const job = jobBySlug(params.slug);
  if (!job) notFound();

  return (
    <div className="shell py-14">
      <Link href="/careers" className="text-[13px] text-forest hover:underline">← All open roles</Link>

      <header className="mt-4 max-w-[52em]">
        <p className="kicker">{job.tagline}</p>
        <h1 className="mt-2 font-fraunces text-[40px] leading-[1.1] text-forest">{job.title}</h1>
        <span className="rule-gold mb-4 mt-4 block" />
        <p className="text-[14px] prose-muted">{job.type} · {job.location}</p>
        <p className="mt-1 text-[15px] font-medium text-charcoal">{job.pay}</p>
        <div className="mt-5">
          <a href="#apply" className="btn-gold text-[15px]">Apply for this role</a>
        </div>
      </header>

      {/* Full posting */}
      <article className="mt-8">
        <Markdown source={job.body} />
      </article>

      {/* Application */}
      <section id="apply" className="mt-14 scroll-mt-24 border-t border-line-warm pt-10">
        <h2 className="font-fraunces text-[28px] text-forest">Apply — {job.title}</h2>
        <p className="mb-6 mt-1 max-w-[46em] text-[15px] prose-muted">
          Fill out the employment application below. Fields marked with * are required; attach your résumé and any credentials or
          certifications. We review every application and reply by email if there&apos;s a fit.
        </p>
        <div className="max-w-[52em]">
          <ApplicationForm role={job.title} />
        </div>
      </section>
    </div>
  );
}
