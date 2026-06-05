const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/services/careers-service.ts',
  'src/services/interview-service.ts',
  'src/services/jobs-service.ts',
  'src/services/notes-service.ts',
  'src/services/projects-service.ts',
  'src/services/roadmaps-service.ts',
  'src/services/youtube-service.ts',
];

filesToFix.forEach(file => {
  const filePath = path.resolve(file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix: `data: data || []` -> `data: data as any || []`
    content = content.replace(/data: data \|\| \[\]/g, 'data: data as any || []');
    
    // Fix: `ok: true, data }` -> `ok: true, data: data as any }`
    content = content.replace(/ok: true, data \}/g, 'ok: true, data: data as any }');
    
    // Fix: `steps: steps || []` -> `steps: steps as any || []`
    content = content.replace(/steps: steps \|\| \[\]/g, 'steps: steps as any || []');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', file);
  }
});
