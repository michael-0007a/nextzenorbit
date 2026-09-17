// Regenerate after changing the built-in PDF fonts. AFM advance widths let the
// browser and server share line breaks without loading the PDF renderer in UI.
const fs = require('node:fs');
const path = require('node:path');
const { PDFFont } = require('@react-pdf/pdfkit');
const output = {};
const punctuation = [0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2026, 0x20ac];
for (const name of ['Helvetica', 'Helvetica-Bold', 'Times-Roman', 'Times-Bold']) {
  const font = PDFFont.open(null, name);
  output[name] = {};
  for (const code of [...Array.from({ length: 224 }, (_, i) => i + 32), ...punctuation]) {
    if (font.font.characterToGlyph(code) === '.notdef') continue;
    const character = String.fromCharCode(code);
    output[name][character] = font.encode(character)[1][0].advanceWidth;
  }
}
fs.writeFileSync(path.join(__dirname, '../src/lib/resume/font-widths.json'), JSON.stringify(output));
