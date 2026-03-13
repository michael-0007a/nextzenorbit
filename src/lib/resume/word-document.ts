/**
 * Word Document Generator — Nextzen Orbit
 *
 * Generates professional DOCX resumes using the docx library.
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  PageOrientation,
  convertInchesToTwip,
  Packer,
  ExternalHyperlink,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
} from "docx";
import type { ResumeContent } from "@/lib/validations/resume";

interface WordDocumentOptions {
  accentColor?: string;
  fontFamily?: string;
}

function createContactParagraph(contact: ResumeContent["contact"]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Name - centered, uppercase
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: (contact.full_name || "Your Name").toUpperCase(),
          bold: true,
          size: 44, // 22pt
          font: "Times New Roman",
        }),
      ],
    })
  );

  // Contact info line
  const contactParts: (TextRun | ExternalHyperlink)[] = [];

  if (contact.phone) {
    contactParts.push(new TextRun({ text: contact.phone, size: 20, font: "Times New Roman" }));
  }

  if (contact.email) {
    if (contactParts.length > 0) {
      contactParts.push(new TextRun({ text: "  •  ", size: 20 }));
    }
    contactParts.push(new TextRun({ text: contact.email, size: 20, font: "Times New Roman" }));
  }

  if (contact.location) {
    if (contactParts.length > 0) {
      contactParts.push(new TextRun({ text: "  •  ", size: 20 }));
    }
    contactParts.push(new TextRun({ text: contact.location, size: 20, font: "Times New Roman" }));
  }

  if (contactParts.length > 0) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: contactParts,
        spacing: { after: 40 },
      })
    );
  }

  // Links line
  const linkParts: (TextRun | ExternalHyperlink)[] = [];

  if (contact.linkedin_url) {
    linkParts.push(
      new ExternalHyperlink({
        children: [
          new TextRun({
            text: "LinkedIn",
            style: "Hyperlink",
            size: 20,
            font: "Times New Roman",
          }),
        ],
        link: contact.linkedin_url,
      })
    );
  }

  if (contact.github_url) {
    if (linkParts.length > 0) {
      linkParts.push(new TextRun({ text: "  •  ", size: 20 }));
    }
    linkParts.push(
      new ExternalHyperlink({
        children: [
          new TextRun({
            text: "GitHub",
            style: "Hyperlink",
            size: 20,
            font: "Times New Roman",
          }),
        ],
        link: contact.github_url,
      })
    );
  }

  if (contact.portfolio_url) {
    if (linkParts.length > 0) {
      linkParts.push(new TextRun({ text: "  •  ", size: 20 }));
    }
    linkParts.push(
      new ExternalHyperlink({
        children: [
          new TextRun({
            text: "Portfolio",
            style: "Hyperlink",
            size: 20,
            font: "Times New Roman",
          }),
        ],
        link: contact.portfolio_url,
      })
    );
  }

  if (linkParts.length > 0) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: linkParts,
        spacing: { after: 160 },
      })
    );
  }

  return paragraphs;
}

function createSectionHeading(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: 24,
        color: "000000",
        font: "Times New Roman",
      }),
    ],
    border: {
      bottom: {
        color: "000000",
        style: BorderStyle.SINGLE,
        size: 8,
      },
    },
    spacing: { before: 240, after: 100 },
  });
}

function createExperienceEntry(
  position: string,
  company: string,
  location: string | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
  isCurrent: boolean | undefined,
  bullets: string[] | undefined
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // Header row with position and dates
  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: position,
                      bold: true,
                      size: 22,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: `${startDate || ""} – ${isCurrent ? "Present" : endDate || ""}`,
                      italics: true,
                      size: 20,
                      color: "666666",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // Company and location
  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: company,
          italics: true,
          size: 21,
        }),
        ...(location
          ? [
              new TextRun({
                text: `  •  ${location}`,
                size: 21,
                color: "666666",
              }),
            ]
          : []),
      ],
      spacing: { after: 80 },
    })
  );

  // Bullets
  if (bullets && bullets.length > 0) {
    bullets
      .filter((b) => b)
      .forEach((bullet) => {
        elements.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: bullet,
                size: 21,
              }),
            ],
            spacing: { after: 40 },
          })
        );
      });
  }

  // Spacing after entry
  elements.push(
    new Paragraph({
      children: [],
      spacing: { after: 100 },
    })
  );

  return elements;
}

function createEducationEntry(
  degree: string,
  institution: string,
  fieldOfStudy: string | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
  gpa: string | undefined
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: institution,
                      bold: true,
                      size: 22,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: `${startDate || ""} – ${endDate || ""}`,
                      italics: true,
                      size: 20,
                      color: "666666",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: degree + (fieldOfStudy ? ` in ${fieldOfStudy}` : ""),
          italics: true,
          size: 21,
        }),
        ...(gpa
          ? [
              new TextRun({
                text: `  •  GPA: ${gpa}`,
                size: 21,
                color: "666666",
              }),
            ]
          : []),
      ],
      spacing: { after: 120 },
    })
  );

  return elements;
}

export async function generateWordDocument(
  content: ResumeContent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: WordDocumentOptions = {}
): Promise<Buffer> {
  const { contact, summary, experience, education, skills, projects, certifications, languages } =
    content;

  const children: (Paragraph | Table)[] = [];

  // Contact header
  children.push(...createContactParagraph(contact));

  // Summary
  if (summary?.text) {
    children.push(createSectionHeading("Professional Summary"));
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: summary.text,
            size: 21,
          }),
        ],
        spacing: { after: 120 },
      })
    );
  }

  // Experience
  if (experience && experience.length > 0) {
    children.push(createSectionHeading("Experience"));
    experience.forEach((exp) => {
      children.push(
        ...createExperienceEntry(
          exp.position,
          exp.company,
          exp.location,
          exp.start_date,
          exp.end_date,
          exp.is_current,
          exp.bullets
        )
      );
    });
  }

  // Education
  if (education && education.length > 0) {
    children.push(createSectionHeading("Education"));
    education.forEach((edu) => {
      children.push(
        ...createEducationEntry(
          edu.degree,
          edu.institution,
          edu.field_of_study,
          edu.start_date,
          edu.end_date,
          edu.gpa
        )
      );
    });
  }

  // Skills
  if (skills && skills.length > 0) {
    children.push(createSectionHeading("Skills"));
    skills.forEach((skill) => {
      const items = (skill.items || []).filter((i) => i);
      if (items.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: skill.category ? `${skill.category}: ` : "",
                bold: true,
                size: 21,
              }),
              new TextRun({
                text: items.join("  •  "),
                size: 21,
              }),
            ],
            spacing: { after: 80 },
          })
        );
      }
    });
  }

  // Projects
  if (projects && projects.length > 0) {
    children.push(createSectionHeading("Projects"));
    projects.forEach((proj) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: proj.name,
              bold: true,
              size: 22,
            }),
          ],
        })
      );
      if (proj.description) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: proj.description,
                size: 21,
              }),
            ],
            spacing: { after: 40 },
          })
        );
      }
      const techs = (proj.technologies || []).filter((t) => t);
      if (techs.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Technologies: ",
                bold: true,
                size: 20,
                color: "666666",
              }),
              new TextRun({
                text: techs.join(", "),
                size: 20,
                color: "666666",
              }),
            ],
            spacing: { after: 120 },
          })
        );
      }
    });
  }

  // Certifications
  if (certifications && certifications.length > 0) {
    children.push(createSectionHeading("Certifications"));
    certifications.forEach((cert) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cert.name,
              bold: true,
              size: 21,
            }),
            new TextRun({
              text: ` – ${cert.issuer}${cert.date ? ` (${cert.date})` : ""}`,
              size: 21,
            }),
          ],
          spacing: { after: 60 },
        })
      );
    });
  }

  // Languages
  if (languages && languages.length > 0) {
    children.push(createSectionHeading("Languages"));
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: languages
              .map(
                (lang) =>
                  `${lang.name}${lang.proficiency ? ` (${lang.proficiency})` : ""}`
              )
              .join("  •  "),
            size: 21,
          }),
        ],
        spacing: { after: 120 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.6),
              bottom: convertInchesToTwip(0.6),
              left: convertInchesToTwip(0.7),
              right: convertInchesToTwip(0.7),
            },
            size: {
              orientation: PageOrientation.PORTRAIT,
            },
          },
        },
        children,
      },
    ],
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: {
            font: "Calibri",
            size: 22,
          },
        },
      ],
    },
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}


