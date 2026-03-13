/**
 * Resume PDF Document — Nextzen Orbit
 *
 * React-PDF components for generating professional resume PDFs.
 * Supports multiple templates with dynamic styling.
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { ResumeContent } from "@/lib/validations/resume";
import type { ResumeTemplate } from "@/lib/resume/templates";

// Register fonts (using built-in Helvetica for reliability)
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
    { src: "Helvetica-Oblique", fontStyle: "italic" },
  ],
});

interface ResumePDFProps {
  content: ResumeContent;
  template: ResumeTemplate;
}

// Create dynamic styles based on template
function createStyles(template: ResumeTemplate) {
  const { colors, layout, fonts } = template;

  return StyleSheet.create({
    page: {
      backgroundColor: colors.background,
      paddingTop: layout.margins.top,
      paddingRight: layout.margins.right,
      paddingBottom: layout.margins.bottom,
      paddingLeft: layout.margins.left,
      fontFamily: fonts.body,
      fontSize: 10,
      color: colors.text,
      lineHeight: 1.4,
    },
    // Header styles
    header: {
      marginBottom: layout.sectionSpacing + 4,
      textAlign: layout.headerStyle === "centered" ? "center" : "left",
    },
    headerSplit: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: layout.sectionSpacing + 4,
    },
    name: {
      fontSize: 20,
      fontFamily: fonts.heading,
      color: colors.primary,
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    contactInfo: {
      fontSize: 9,
      color: colors.muted,
      marginBottom: 2,
      maxWidth: 200,
    },
    contactRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: layout.headerStyle === "centered" ? "center" : "flex-start",
      marginBottom: 2,
    },
    contactSeparator: {
      fontSize: 9,
      color: colors.muted,
      marginHorizontal: 4,
    },
    // Section styles
    section: {
      marginBottom: layout.sectionSpacing,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: fonts.heading,
      color: colors.accent,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
      paddingBottom: layout.showDividers ? 4 : 0,
      borderBottomWidth: layout.showDividers ? 1 : 0,
      borderBottomColor: colors.muted,
    },
    // Entry styles (experience, education, etc.)
    entry: {
      marginBottom: 10,
    },
    entryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 2,
    },
    entryTitle: {
      fontSize: 11,
      fontFamily: fonts.heading,
      color: colors.primary,
      maxWidth: 350,
    },
    entrySubtitle: {
      fontSize: 10,
      color: colors.secondary,
      marginBottom: 2,
      maxWidth: 350,
    },
    entryDate: {
      fontSize: 9,
      color: colors.muted,
      textAlign: "right",
      minWidth: 80,
    },
    entryLocation: {
      fontSize: 9,
      color: colors.muted,
    },
    // Bullet points
    bulletList: {
      marginTop: 4,
      paddingLeft: 8,
    },
    bullet: {
      flexDirection: "row",
      marginBottom: 3,
    },
    bulletDot: {
      width: 12,
      fontSize: 10,
      color: colors.muted,
    },
    bulletText: {
      flex: 1,
      fontSize: 9,
      color: colors.text,
      lineHeight: 1.5,
    },
    // Skills
    skillsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    skillCategory: {
      marginBottom: 6,
      width: "100%",
    },
    skillCategoryTitle: {
      fontSize: 9,
      fontFamily: fonts.heading,
      color: colors.secondary,
      marginBottom: 2,
    },
    skillItems: {
      fontSize: 9,
      color: colors.text,
      lineHeight: 1.4,
    },
    // Summary
    summary: {
      fontSize: 10,
      color: colors.text,
      lineHeight: 1.5,
    },
    // Certifications & Languages
    certificationItem: {
      marginBottom: 4,
    },
    certName: {
      fontSize: 10,
      fontFamily: fonts.heading,
      color: colors.primary,
    },
    certDetails: {
      fontSize: 9,
      color: colors.muted,
    },
    // Links
    link: {
      color: colors.accent,
      textDecoration: "none",
    },
    // Projects
    projectTech: {
      fontSize: 8,
      color: colors.muted,
      marginTop: 2,
    },
  });
}

export function ResumePDF({ content, template }: ResumePDFProps) {
  const styles = createStyles(template);
  const { contact, summary, experience, education, skills, projects, certifications, languages } = content;

  // Helper to format URL to display text
  const formatUrl = (url: string, type: "linkedin" | "github" | "portfolio"): string => {
    if (!url) return "";
    try {
      const parsed = new URL(url);
      if (type === "linkedin") {
        const match = parsed.pathname.match(/\/in\/([^/]+)/);
        return match ? `linkedin.com/in/${match[1]}` : parsed.hostname + parsed.pathname;
      }
      if (type === "github") {
        return parsed.pathname.replace(/^\//, "") || parsed.hostname;
      }
      return parsed.hostname + (parsed.pathname !== "/" ? parsed.pathname : "");
    } catch {
      return url.replace(/^https?:\/\//, "").slice(0, 40);
    }
  };

  const renderHeader = () => {
    if (template.layout.headerStyle === "split") {
      return (
        <View style={styles.headerSplit}>
          <View>
            <Text style={styles.name}>{contact.full_name || "Your Name"}</Text>
            {contact.email && <Text style={styles.contactInfo}>{contact.email}</Text>}
          </View>
          <View style={{ textAlign: "right" }}>
            {contact.phone && <Text style={styles.contactInfo}>{contact.phone}</Text>}
            {contact.location && <Text style={styles.contactInfo}>{contact.location}</Text>}
            {contact.linkedin_url && <Text style={styles.contactInfo}>{formatUrl(contact.linkedin_url, "linkedin")}</Text>}
          </View>
        </View>
      );
    }

    // Collect contact items
    const contactItems: string[] = [];
    if (contact.email) contactItems.push(contact.email);
    if (contact.phone) contactItems.push(contact.phone);
    if (contact.location) contactItems.push(contact.location);

    const linkItems: string[] = [];
    if (contact.linkedin_url) linkItems.push(formatUrl(contact.linkedin_url, "linkedin"));
    if (contact.github_url) linkItems.push(formatUrl(contact.github_url, "github"));
    if (contact.portfolio_url) linkItems.push(formatUrl(contact.portfolio_url, "portfolio"));

    return (
      <View style={styles.header}>
        <Text style={styles.name}>{contact.full_name || "Your Name"}</Text>
        {contactItems.length > 0 && (
          <Text style={styles.contactInfo}>
            {contactItems.join("  •  ")}
          </Text>
        )}
        {linkItems.length > 0 && (
          <Text style={styles.contactInfo}>
            {linkItems.join("  •  ")}
          </Text>
        )}
      </View>
    );
  };

  const renderSummary = () => {
    if (!summary?.text) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Summary</Text>
        <Text style={styles.summary}>{summary.text}</Text>
      </View>
    );
  };

  const renderExperience = () => {
    if (!experience?.length) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experience</Text>
        {experience.map((exp) => (
          <View key={exp.id} style={styles.entry}>
            <View style={styles.entryHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryTitle}>{exp.position}</Text>
                <Text style={styles.entrySubtitle}>
                  {exp.company}
                  {exp.location ? ` • ${exp.location}` : ""}
                </Text>
              </View>
              <Text style={styles.entryDate}>
                {exp.start_date} — {exp.is_current ? "Present" : exp.end_date}
              </Text>
            </View>
            {exp.bullets?.length > 0 && (
              <View style={styles.bulletList}>
                {exp.bullets.filter(b => b).map((bullet, i) => (
                  <View key={i} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderEducation = () => {
    if (!education?.length) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Education</Text>
        {education.map((edu) => (
          <View key={edu.id} style={styles.entry}>
            <View style={styles.entryHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryTitle}>{edu.degree}</Text>
                <Text style={styles.entrySubtitle}>
                  {edu.institution}
                  {edu.field_of_study ? ` — ${edu.field_of_study}` : ""}
                </Text>
              </View>
              <View>
                <Text style={styles.entryDate}>
                  {edu.start_date && edu.end_date ? `${edu.start_date} — ${edu.end_date}` : edu.end_date || edu.start_date}
                </Text>
                {edu.gpa && <Text style={styles.entryLocation}>GPA: {edu.gpa}</Text>}
              </View>
            </View>
            {edu.bullets?.length > 0 && (
              <View style={styles.bulletList}>
                {edu.bullets.filter(b => b).map((bullet, i) => (
                  <View key={i} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderSkills = () => {
    if (!skills?.length) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills</Text>
        <View>
          {skills.map((skill) => (
            <View key={skill.id} style={styles.skillCategory}>
              {skill.category && (
                <Text style={styles.skillCategoryTitle}>{skill.category}:</Text>
              )}
              <Text style={styles.skillItems}>
                {skill.items.filter(i => i).join(" • ")}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderProjects = () => {
    if (!projects?.length) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Projects</Text>
        {projects.map((proj) => (
          <View key={proj.id} style={styles.entry}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryTitle}>{proj.name}</Text>
            </View>
            {proj.description && (
              <Text style={styles.entrySubtitle}>{proj.description}</Text>
            )}
            {proj.technologies?.length > 0 && (
              <Text style={styles.entryLocation}>
                Tech: {proj.technologies.filter(t => t).join(", ")}
              </Text>
            )}
            {proj.bullets?.length > 0 && (
              <View style={styles.bulletList}>
                {proj.bullets.filter(b => b).map((bullet, i) => (
                  <View key={i} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderCertifications = () => {
    if (!certifications?.length) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Certifications</Text>
        {certifications.map((cert) => (
          <View key={cert.id} style={styles.certificationItem}>
            <Text style={styles.certName}>{cert.name}</Text>
            <Text style={styles.certDetails}>
              {cert.issuer}
              {cert.date ? ` • ${cert.date}` : ""}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderLanguages = () => {
    if (!languages?.length) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Languages</Text>
        <Text style={styles.skillItems}>
          {languages.map((lang) =>
            `${lang.name}${lang.proficiency ? ` (${lang.proficiency})` : ""}`
          ).join(" • ")}
        </Text>
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {renderHeader()}
        {renderSummary()}
        {renderExperience()}
        {renderEducation()}
        {renderSkills()}
        {renderProjects()}
        {renderCertifications()}
        {renderLanguages()}
      </Page>
    </Document>
  );
}

