import { normalizeResumeTypography } from '@/lib/resume/layout';
export async function renderCoverLetter(content:string,format:'pdf'|'docx'):Promise<Buffer> {
 const paragraphs=content.split('\n\n').map(p=>p.trim().replace(/\n/g,' ')).filter(Boolean);
 if(format==='docx'){
  const {Document,Packer,Paragraph,TextRun}=await import('docx');
  return Packer.toBuffer(new Document({sections:[{children:paragraphs.map(text=>new Paragraph({children:[new TextRun({text,font:'Times New Roman',size:24})],spacing:{after:240}}))}]}));
 }
 const [{Document,Page,Text,renderToBuffer},{createElement}]=await Promise.all([import('@react-pdf/renderer'),import('react')]);
 return Buffer.from(await renderToBuffer(createElement(Document,{},createElement(Page,{size:'LETTER',style:{padding:72,fontFamily:'Times-Roman',fontSize:11}},...paragraphs.map((p,i)=>createElement(Text,{key:i,style:{lineHeight:1.5,marginBottom:12}},normalizeResumeTypography(p)))))));
}
