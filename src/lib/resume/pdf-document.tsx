import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { ResumeContent } from "@/lib/validations/resume";
import type { ResumeTemplate } from "@/lib/resume/templates";
import { layoutResume, PAPER } from "@/lib/resume/layout";

export function ResumePDF({ content, template }: { content: ResumeContent; template: ResumeTemplate }) {
  const layout = layoutResume(content, template);
  return <Document title={`${content.contact.full_name || "Candidate"} Resume`} author={content.contact.full_name} language="en">
    {layout.pages.map((lines, pageIndex) => <Page key={pageIndex} size={[PAPER.width, PAPER.height]} wrap={false}
      style={{ backgroundColor: "#ffffff", paddingTop: template.layout.margins.top, paddingBottom: template.layout.margins.bottom,
        paddingLeft: template.layout.margins.left, paddingRight: template.layout.margins.right }}>
      {lines.map((line, index) => <View key={index} style={{ height: line.height, marginTop: line.before,
        borderBottomWidth: line.kind === "section" && template.layout.showDividers ? 0.5 : 0,
        borderBottomColor: template.colors.accent }}>
        <Text wrap={false} style={{ fontFamily: line.font, fontSize: line.size, lineHeight: 1,
          color: line.color, textAlign: line.align, paddingLeft: line.indent }}>{line.text}</Text>
      </View>)}
    </Page>)}
  </Document>;
}
