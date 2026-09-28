import React from 'react';
import { Document as PDFDocument,Page,Text,renderToBuffer } from '@react-pdf/renderer';
import { Document,Paragraph,TextRun,Packer } from 'docx';
import { requireAdmin,isAuthError } from '@/lib/admin/guards';
import { adminDocumentSchema } from '@/lib/admin/documents/schema';
import { ResumePDF } from '@/lib/resume/pdf-document';
import { generateWordDocument } from '@/lib/resume/word-document';
import { getTemplate } from '@/lib/resume/templates';
import { normalizeResumeTypography,unsupportedPdfCharacters } from '@/lib/resume/layout';
import { z } from 'zod';
import { createEmptyResumeContent } from '@/lib/validations/resume';
const schema=adminDocumentSchema.extend({format:z.enum(['pdf','docx'])});
export async function POST(request:Request){
 const auth=await requireAdmin();if(isAuthError(auth))return auth;
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:{message:'Check the document before exporting.'}},{status:400});
 const {kind,payload,format,title}=parsed.data,template=getTemplate(payload.templateId);
 try{
  let buffer:Buffer;
  if(kind==='resume'){
   if(format==='pdf'&&unsupportedPdfCharacters(payload.resume,template).length)return Response.json({error:{message:'Some characters require a different PDF font. Use Word to preserve them.'}},{status:422});
   buffer=format==='pdf'?Buffer.from(await renderToBuffer(ResumePDF({content:payload.resume,template}))):await generateWordDocument(payload.resume,{template});
  }else{
   if(!payload.letter.trim())return Response.json({error:{message:'Write or generate the letter first.'}},{status:400});
   const paragraphs=payload.letter.split(/\n\s*\n/).filter(p=>p.trim());
   if(format==='docx')buffer=await Packer.toBuffer(new Document({sections:[{children:paragraphs.map(p=>new Paragraph({children:p.split('\n').map((line,i)=>new TextRun({text:line,break:i?1:0,font:'Arial',size:22})),spacing:{after:200}}))}]}));
   else{
    if(unsupportedPdfCharacters({...createEmptyResumeContent(),summary:{text:payload.letter}},getTemplate('modern')).length)return Response.json({error:{message:'Some characters need Word export to preserve their spelling.'}},{status:422});
    buffer=Buffer.from(await renderToBuffer(React.createElement(PDFDocument,{title},React.createElement(Page,{size:'A4',style:{padding:54,fontFamily:'Helvetica',fontSize:11}},...paragraphs.map((p,i)=>React.createElement(Text,{key:i,style:{marginBottom:12,lineHeight:1.4}},normalizeResumeTypography(p)))))));
   }
  }
  return new Response(new Uint8Array(buffer),{headers:{'Content-Type':format==='pdf'?'application/pdf':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','Content-Disposition':`attachment; filename="${title.replace(/[^a-zA-Z0-9_-]/g,'_')||'document'}.${format}"`,'Cache-Control':'private, no-store'}});
 }catch{return Response.json({error:{message:'Export failed. Your editable draft is still available.'}},{status:500});}
}
