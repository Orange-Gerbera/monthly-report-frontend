const fs = require('fs');
const path = require('path');

// ==========================================
// ★ 設定
// ==========================================
const props = {
    year: '2026',
    owner: 'Tai Naoyuki & Kagoshima Takuho'
};

const TARGET_DIR = './src';
const EXTENSION = '.ts';

// ==========================================
// ★ LICENSE読み込み（改行そのまま維持）
// ==========================================
let licenseRaw = fs.readFileSync('./LICENSE', 'utf8');

// BOM除去
if (licenseRaw.charCodeAt(0) === 0xFEFF) {
    licenseRaw = licenseRaw.slice(1);
}

// 改行コードを検出（最初に見つかったものを採用）
function detectEOL(text) {
    const match = text.match(/\r\n|\n/);
    return match ? match[0] : '\n';
}

const EOL = detectEOL(licenseRaw);

// 変数置換
let licenseBody = licenseRaw
    .replace(/\${year}/g, props.year)
    .replace(/\${owner}/g, props.owner);

// 行ごと整形（改行はそのまま使う）
const licenseHeader =
    '/**' + EOL +
    licenseBody
        .split(/\r\n|\n/)
        .map(line => ` * ${line.trimEnd()}`)
        .join(EOL) +
    EOL +
    ' */' + EOL + EOL;

// ==========================================
// ★ ファイル処理
// ==========================================
function walkAndAddLicense(dir) {
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!['node_modules', 'environments', 'assets'].includes(file)) {
                walkAndAddLicense(fullPath);
            }
            return;
        }

        if (path.extname(fullPath) !== EXTENSION) return;

        let content = fs.readFileSync(fullPath, 'utf8');

        // BOM除去
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }

        // 既存改行コードを検出
        const fileEOL = detectEOL(content);

        // ライセンスが既にあるか
        if (content.includes('Project: Orange Gerbera')) {
            console.log(`Skip (already has license): ${fullPath}`);
            return;
        }

        console.log(`Add license safely: ${fullPath}`);

        // ★ 改行コードを壊さず挿入
        const normalizedHeader = licenseHeader.replace(/\r\n|\n/g, fileEOL);

        fs.writeFileSync(fullPath, normalizedHeader + content, 'utf8');
    });
}

console.log('Starting SAFE license injection (no EOL destruction)...');
walkAndAddLicense(TARGET_DIR);
console.log('Complete! No line endings were harmed.');