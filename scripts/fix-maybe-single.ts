import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string, callback: (filepath: string) => void) {
    fs.readdirSync(dir).forEach(file => {
        let filepath = path.join(dir, file);
        let stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            walk(filepath, callback);
        } else if (stat.isFile() && (filepath.endsWith('.ts') || filepath.endsWith('.tsx'))) {
            callback(filepath);
        }
    });
}

const targetStr = `.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle()`;
const replaceStr = `.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle()`;

walk('c:/Users/micha/Documents/Github/nextzenorbit/src/app/api', (filepath) => {
    let content = fs.readFileSync(filepath, 'utf8');
    if (content.includes(targetStr)) {
        console.log(`Fixing ${filepath}`);
        let newContent = content.replace(new RegExp(targetStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replaceStr);
        fs.writeFileSync(filepath, newContent, 'utf8');
    }
});
