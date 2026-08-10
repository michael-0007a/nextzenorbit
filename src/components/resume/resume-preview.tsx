/**
 * Resume Preview — Client Component
 *
 * Live preview that matches the actual LaTeX PDF output.
 * Uses CSS to approximate LaTeX typography and layout.
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResumeContent } from "@/lib/validations/resume";
import { getTemplate } from "@/lib/resume/templates";

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
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(792);

  useEffect(() => {
    setKey(k => k + 1);
  }, [templateId, content]);

  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContentHeight(Math.max(792, entry.contentRect.height));
      }
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [key]);

  const { contact, summary, experience, education, skills, projects, certifications, languages } = content;
  const template = getTemplate(templateId);

  // Letter size dimensions (matches LaTeX US Letter: 612x792 pt)
  const pageWidth = 612;
  const pageHeight = 792;
  const totalPages = Math.max(1, Math.ceil(contentHeight / pageHeight));

  const headerAlign = template.layout.headerStyle === "centered" ? "center" : "left";
  const fontFamily = template.fonts.body === "Helvetica" ? "Arial, sans-serif" : "'Times New Roman', serif";
  const primaryColor = template.colors.primary;
  const accentColor = template.colors.accent;
  const showDividers = template.layout.showDividers;
  const sectionSpacing = template.layout.sectionSpacing;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Paper Page Count Header Bar */}
      <div
        className="flex items-center justify-between rounded-xl border border-border/70 bg-surface/80 px-3 py-2 backdrop-blur-md text-xs shadow-sm"
        style={{ width: pageWidth * scale }}
      >
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <span>Paper Preview (US Letter)</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border",
              totalPages === 1
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : totalPages === 2
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
            )}
          >
            📄 {totalPages} {totalPages === 1 ? "Page" : "Pages"}
          </span>
        </div>
      </div>

      {/* Scaled preview container */}
      <div
        key={`preview-${templateId}-${key}`}
        className="origin-top-left relative overflow-hidden rounded-md border border-slate-200 dark:border-slate-800 transition-all duration-300"
        style={{
          width: pageWidth * scale,
          height: Math.max(792 * totalPages, contentHeight) * scale,
        }}
      >
        {/* Resume Page */}
        <div
          ref={contentRef}
          className="bg-white shadow-lg relative"
          style={{
            width: pageWidth,
            minHeight: pageHeight * totalPages,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            fontFamily,
            fontSize: "11px",
            lineHeight: 1.3,
            color: template.colors.text,
            padding: `${template.layout.margins.top}px ${template.layout.margins.right}px`,
            boxSizing: "border-box",
          }}
        >
          {/* Header */}
          <header style={{ 
            textAlign: headerAlign, 
            marginBottom: `${sectionSpacing}px`,
            display: template.layout.headerStyle === "split" ? "flex" : "block",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h1 style={{
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                margin: "0 0 6px 0",
                color: primaryColor,
              }}>
                {contact.full_name || "Your Name"}
              </h1>

              {/* Contact line */}
              <div style={{ fontSize: "10px", color: template.colors.muted }}>
                {[
                  contact.phone,
                  contact.email,
                  contact.location,
                ].filter(Boolean).join("  •  ")}
              </div>
            </div>

            {/* Links line - In split layout, it goes to the right */}
            {(contact.linkedin_url || contact.github_url || contact.portfolio_url) && (
              <div style={{ 
                fontSize: "10px", 
                color: accentColor, 
                marginTop: template.layout.headerStyle === "split" ? "0" : "4px",
                textAlign: template.layout.headerStyle === "split" ? "right" : headerAlign 
              }}>
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
            <Section title="About Me" primaryColor={primaryColor} showDividers={showDividers}>
              <p style={{ margin: 0, textAlign: "justify", fontSize: "10px", lineHeight: 1.4 }}>
                {summary.text}
              </p>
            </Section>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <Section title="Education" primaryColor={primaryColor} showDividers={showDividers}>
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
            <Section title="Experience" primaryColor={primaryColor} showDividers={showDividers}>
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
            <Section title="Projects" primaryColor={primaryColor} showDividers={showDividers}>
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
            <Section title="Technical Skills" primaryColor={primaryColor} showDividers={showDividers}>
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
            <Section title="Certifications" primaryColor={primaryColor} showDividers={showDividers}>
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
            <Section title="Languages" primaryColor={primaryColor} showDividers={showDividers}>
              <div style={{ fontSize: "10px" }}>
                {languages.map((lang) =>
                  `${lang.name}${lang.proficiency ? ` (${lang.proficiency})` : ""}`
                ).join("  •  ")}
              </div>
            </Section>
          )}

          {/* Visual Paper Breaks and Page Number Footers */}
          {Array.from({ length: totalPages }).map((_, i) => (
            <div key={`page-marker-${i}`}>
              {/* Dashed Paper Break indicator between pages */}
              {i > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: `${i * pageHeight}px`,
                    left: 0,
                    right: 0,
                    height: "24px",
                    marginTop: "-12px",
                    zIndex: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      borderTop: "2px dashed #94a3b8",
                      position: "absolute",
                    }}
                  />
                  <span
                    style={{
                      background: "#0f172a",
                      color: "#f8fafc",
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: "999px",
                      position: "relative",
                      fontFamily: "system-ui, -apple-system, sans-serif",
                      letterSpacing: "0.5px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                    }}
                  >
                    ✂ PAPER BREAK — PAGE {i + 1} OF {totalPages}
                  </span>
                </div>
              )}

              {/* Page Number footer at bottom of each paper page */}
              <div
                style={{
                  position: "absolute",
                  top: `${(i + 1) * pageHeight - 24}px`,
                  right: "40px",
                  fontSize: "9px",
                  color: "#64748b",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  pointerEvents: "none",
                }}
              >
                Page {i + 1} of {totalPages}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Section component matching LaTeX styling
function Section({ 
  title, 
  children, 
  primaryColor, 
  showDividers 
}: { 
  title: string; 
  children: React.ReactNode; 
  primaryColor: string; 
  showDividers: boolean; 
}) {
  return (
    <section style={{ marginBottom: "10px" }}>
      <h2 style={{
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        margin: "0 0 4px 0",
        paddingBottom: "2px",
        borderBottom: showDividers ? `1px solid ${primaryColor}` : "none",
        color: primaryColor,
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

