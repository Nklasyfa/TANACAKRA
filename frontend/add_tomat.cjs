const fs = require('fs');
let c = fs.readFileSync('src/services/api.ts', 'utf8');

c = c.replace(/(\{ month: '202[2-6]-\d{2}'.*?)( \})/g, (m, p1, p2) => {
    if(p1.includes('Tomat')) return m;
    const ym = p1.match(/month: '([^']+)'/)[1];
    const y = parseInt(ym.split('-')[0]);
    const mo = parseInt(ym.split('-')[1]);
    const p = 12000 + (y - 2022) * 1000 + (mo % 6) * 500;
    return p1 + `, 'Tomat': ${p}` + p2;
});

fs.writeFileSync('src/services/api.ts', c);
