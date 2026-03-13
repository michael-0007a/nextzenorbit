/**
 * Resume Preview — Client Component
 *
 * Live preview that matches the actual LaTeX PDF output.
 * Uses CSS to approximate LaTeX typography and layout.
 */

"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ResumeContent } from "@/lib/validations/resume";

interface ResumePreviewProps {
  content: ResumeContent;
  templateId?: string;
  className?: string;
  scale?: number;
}

export function ResumePreview({
  content,
  templateId = "software-engineer",
  className,
  scale = 0.55,
}: ResumePreviewProps) {
  // Force re-render when template or content changes
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(k => k + 1);
  }, [templateId, content]);

  const { contact, summary, experience, education, skills, projects, certifications, languages } = content;

  // Letter size dimensions (matches LaTeX)
  const pageWidth = 612;

  return (
    <div
      key={`preview-${templateId}-${key}`}
      className={cn("origin-top-left", className)}
      style={{
        width: pageWidth * scale,
        transformOrigin: "top left",
      }}
    >
      {/* Resume Page - mimics LaTeX output exactly */}
      <div
        className="bg-white shadow-lg"
        style={{
          width: pageWidth,
          minHeight: 792,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          fontFamily: "'Times New Roman', 'Computer Modern', Georgia, serif",
          fontSize: "11px",
          lineHeight: 1.3,
          color: "#000",
          padding: "36px 54px",
        }}
      >
        {/* Header - Centered name with small caps style */}
        <header style={{ textAlign: "center", marginBottom: "8px" }}>
          <h1 style={{
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
            margin: "0 0 6px 0",
            fontVariant: "small-caps",
          }}>
            {contact.full_name || "Your Name"}
          </h1>

          {/* Contact line with separators */}
          <div style={{ fontSize: "10px", color: "#333" }}>
            {[
              contact.phone,
              contact.email,
              contact.location,
            ].filter(Boolean).join("  •  ")}
          </div>

          {/* Links line */}
          {(contact.linkedin_url || contact.github_url || contact.portfolio_url) && (
            <div style={{ fontSize: "10px", color: "#0066cc", marginTop: "2px" }}>
              {[
                contact.linkedin_url ? "LinkedIn" : null,
                contact.github_url ? "GitHub" : null,
                contact.portfolio_url ? "Portfolio" : null,
              ].filter(Boolean).join("  •  ")}
            </div>
          )}
        </header>

        {/* About Me / Summary */}
        {summary?.text && (
          <Section title="About Me">
            <p style={{ margin: 0, textAlign: "justify", fontSize: "10px", lineHeight: 1.4 }}>
              {summary.text}
            </p>
          </Section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <Section title="Education">
            {education.map((edu, idx) => (
              <div key={edu.id || idx} style={{ marginBottom: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700 }}>{edu.institution}</span>
                  <span style={{ fontStyle: "italic" }}>
                    {edu.end_date ? `— ${edu.end_date}` : ""}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                  <span style={{ fontStyle: "italic" }}>
                    {edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ""}
                  </span>
                  {edu.gpa && <span>GPA: {edu.gpa}</span>}
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <Section title="Experience">
            {experience.map((exp, idx) => (
              <div key={exp.id || idx} style={{ marginBottom: "10px" }}>
                {/* Company & Role line */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{exp.company}</span>
                    {exp.position && (
                      <span style={{ fontStyle: "italic", marginLeft: "6px" }}>— {exp.position}</span>
                    )}
                  </div>
                  <span style={{ fontSize: "10px", whiteSpace: "nowrap" }}>
                    {exp.start_date} — {exp.is_current ? "Present" : exp.end_date}
                  </span>
                </div>
                {/* Location line */}
                {exp.location && (
                  <div style={{ fontSize: "10px", fontStyle: "italic", textAlign: "right", marginTop: "-2px" }}>
                    {exp.location}
                  </div>
                )}
                {/* Bullets */}
                {exp.bullets && exp.bullets.filter(b => b).length > 0 && (
                  <ul style={{
                    margin: "4px 0 0 0",
                    paddingLeft: "18px",
                    fontSize: "10px",
                    lineHeight: 1.4,
                  }}>
                    {exp.bullets.filter(b => b).map((bullet, i) => (
                      <li key={i} style={{ marginBottom: "2px" }}>— {bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <Section title="Projects">
            {projects.map((proj, idx) => (
              <div key={proj.id || idx} style={{ marginBottom: "8px" }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{proj.name}</span>
                  {proj.technologies && proj.technologies.filter(t => t).length > 0 && (
                    <span style={{ fontSize: "10px", color: "#555" }}>
                      {" | "}{proj.technologies.filter(t => t).join(", ")}
                    </span>
                  )}
                </div>
                {proj.description && (
                  <div style={{ fontSize: "10px", marginLeft: "12px" }}>
                    — {proj.description}
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Technical Skills */}
        {skills && skills.length > 0 && (
          <Section title="Technical Skills">
            <div style={{ fontSize: "10px", lineHeight: 1.5 }}>
              {skills.map((skill, idx) => (
                <div key={skill.id || idx} style={{ marginBottom: "2px" }}>
                  <span style={{ fontWeight: 700 }}>{skill.category}: </span>
                  <span>{skill.items.filter(i => i).join(", ")}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <Section title="Certifications">
            <div style={{ fontSize: "10px" }}>
              {certifications.map((cert, idx) => (
                <div key={cert.id || idx} style={{ marginBottom: "2px" }}>
                  <span style={{ fontWeight: 700 }}>{cert.name}</span>
                  {cert.issuer && <span> — {cert.issuer}</span>}
                  {cert.date && <span style={{ color: "#666" }}> ({cert.date})</span>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <Section title="Languages">
            <div style={{ fontSize: "10px" }}>
              {languages.map((lang) =>
                `${lang.name}${lang.proficiency ? ` (${lang.proficiency})` : ""}`
              ).join("  •  ")}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// Section component matching LaTeX styling
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "10px" }}>
      <h2 style={{
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        margin: "0 0 4px 0",
        paddingBottom: "2px",
        borderBottom: "1px solid #000",
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

