const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'frontend', 'task-manager');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.vue'));
for (const f of files) {
  const s = fs.readFileSync(path.join(dir, f), 'utf8');
  const open = (s.match(/<template>/g) || []).length;
  const close = (s.match(/<\/template>/g) || []).length;
  const openScript = (s.match(/<script>/g) || []).length;
  const closeScript = (s.match(/<\/script>/g) || []).length;
  const openStyle = (s.match(/<style[^>]*>/g) || []).length;
  const closeStyle = (s.match(/<\/style>/g) || []).length;
  if (open !== close || openScript !== closeScript || openStyle !== closeStyle) {
    console.log(f, {open, close, openScript, closeScript, openStyle, closeStyle});
  }
}
