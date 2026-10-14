import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { ResumeContent } from "@/lib/validations/resume";
import type { ResumeTemplate } from "@/lib/resume/templates";
import { layoutResume, mainWidth, PAPER, type LayoutLine } from "@/lib/resume/layout";

function Line({ line, template }: { line: LayoutLine; template: ResumeTemplate }) {
  return <View style={{ height: line.height, marginTop: line.before, flexDirection: "row", justifyContent: "space-between",
    borderBottomWidth: line.kind === "section" && template.layout.showDividers ? 0.5 : 0,
    borderBottomColor: template.colors.accent }}>
    <Text wrap={false} style={{ fontFamily: line.font, fontSize: line.size, lineHeight: 1, flexGrow: 1,
      color: line.color, textAlign: line.align, paddingLeft: line.indent }}>{line.lead && <Text style={{ fontFamily: template.fonts.heading }}>{line.lead} </Text>}{line.runs ? line.runs.map((run, i) => <Text key={i} style={run.bold ? { fontFamily: template.fonts.heading } : undefined}>{run.text}</Text>) : line.text}</Text>
    {line.right && <Text wrap={false} style={{ fontFamily: line.rightFont, fontSize: line.size, lineHeight: 1, color: template.colors.muted }}>{line.right}</Text>}
  </View>;
}

export function ResumePDF({ content, template }: { content: ResumeContent; template: ResumeTemplate }) {
  const layout = layoutResume(content, template);
  const sidebar = template.layout.sidebar;
  return <Document title={`${content.contact.full_name || "Candidate"} Resume`} author={content.contact.full_name} language="en">
    {layout.pages.map((lines, pageIndex) => {
      const main = lines.filter(line => line.column !== "side");
      const header = sidebar ? main.filter(line => line.kind === "name" || line.kind === "contact") : [];
      return <Page key={pageIndex} size={[PAPER.width, PAPER.height]} wrap={false}
        style={{ backgroundColor: "#ffffff", paddingTop: template.layout.margins.top, paddingBottom: template.layout.margins.bottom,
          paddingLeft: template.layout.margins.left, paddingRight: template.layout.margins.right }}>
        {sidebar ? <>
          {header.map((line, index) => <Line key={`h${index}`} line={line} template={template} />)}
          <View style={{ flexDirection: "row" }}>
            <View style={{ width: sidebar.width, marginRight: sidebar.gap }}>
              {lines.filter(line => line.column === "side" && line.kind !== "spacer").map((line, index) => <Line key={index} line={line} template={template} />)}
            </View>
            <View style={{ width: mainWidth(template) }}>
              {main.filter(line => !header.includes(line)).map((line, index) => <Line key={index} line={line} template={template} />)}
            </View>
          </View>
        </> : lines.map((line, index) => <Line key={index} line={line} template={template} />)}
      </Page>;
    })}
  </Document>;
}
