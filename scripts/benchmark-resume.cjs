const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const modules=new Map();
function load(file){const filename=path.resolve(file);if(modules.has(filename))return modules.get(filename);const m=new Module(filename,module);m.filename=filename;m.paths=module.paths;modules.set(filename,m.exports);m.require=name=>name.startsWith('@/')?load('src/'+name.slice(2)+'.ts'):name.endsWith('.json')?require(path.resolve(path.dirname(filename),name)):require(name);m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);modules.set(filename,m.exports);return m.exports;}
const {layoutResume}=load('src/lib/resume/layout.ts'),{getTemplate}=load('src/lib/resume/templates.ts'),{createEmptyResumeContent}=load('src/lib/validations/resume.ts');
const percentile=(values,p)=>values.sort((a,b)=>a-b)[Math.ceil(values.length*p)-1];
const results=[];
for(const roles of [2,10,25]){
 const content=createEmptyResumeContent({full_name:'Synthetic benchmark',email:'benchmark@example.com'});
 content.experience=Array.from({length:roles},(_,i)=>({id:String(i),company:'Example company',position:'Engineer',start_date:'2020',end_date:'2024',bullets:Array.from({length:8},()=> 'Built reliable application services using Python and SQL. Investigated production failures and documented repeatable deployment checks for engineering teams.')}));
 const template=getTemplate('classic'),serialization=[],layout=[];
 let pages=0;for(let i=0;i<60;i++){let start=performance.now();JSON.stringify(content);serialization.push(performance.now()-start);start=performance.now();pages=layoutResume(content,template).pages.length;layout.push(performance.now()-start);}
 results.push({roles,pages,contentBytes:Buffer.byteLength(JSON.stringify(content)),serializationP95Ms:+percentile(serialization,.95).toFixed(2),layoutP50Ms:+percentile(layout,.5).toFixed(2),layoutP95Ms:+percentile(layout,.95).toFixed(2)});
}
const report={measuredAt:new Date().toISOString(),environment:'Local Node.js; not a phone typing/paint measurement',samplesPerFixture:60,results};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
