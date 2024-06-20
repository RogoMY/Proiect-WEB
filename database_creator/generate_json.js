const fs = require('fs');
const path = require('path');

const keywords = [
    "game", "graphics", "animation", "arduino", "web", "canvas", "3d", "2d", "algebra", "audio",
    "visual", "mac", "win", "math", "coding", "generative", "generation", "shader", "physics",
    "particle", "vector", "projects", "shepherding", "design", "code", "explain", "processing",
    "geometry", "ray", "artist", "music", "interactive", "framework", "linux", "cross-platform"
];

const programmingLanguages = [
    "javascript", "python", "c++", "ruby", "php", "c#", "swift", "kotlin", "rust", "typescript",
    "html", "css", "js", "pearl", "haskell"
];

const platforms = ["Win", "Mac", "iOS", "Cross-platform", "Linux", "iPhone", "iPad", "Cross-platform/Web", "Multi-platform", "macOS"];

function processLine(line, currentScope) {
    const book = {};
//get title
    const titleStart = line.indexOf('[') + 1;
    const titleEnd = line.indexOf(']');
    const title = line.substring(titleStart, titleEnd);
//get link
    const hrefStart = line.indexOf('(') + 1;
    const hrefEnd = line.indexOf(')');
    const href = line.substring(hrefStart, hrefEnd);
//optional: get platforms
    const platformStart = line.indexOf(' [', hrefEnd) + 2;
    const platformEnd = line.indexOf(']', platformStart);
    let platformsString = '';
    if (platformStart > 1 && platformEnd > platformStart) {
        platformsString = line.substring(platformStart, platformEnd);
    }
//get description
    const descriptionStart = line.indexOf(" - ") + 3;
    const description = line.substring(descriptionStart);

    book.title = title;
    book.href = href;
    book.description = description;
    book.category = currentScope;
//get scopes
    const scopes = new Set();
    scopes.add(currentScope.toLowerCase());
    keywords.forEach(keyword => {
        if (description.toLowerCase().includes(keyword.toLowerCase()) || title.toLowerCase().includes(keyword.toLowerCase())) {
            scopes.add(keyword);
        }
    });
//get prog_langs
    const languages = new Set();
    programmingLanguages.forEach(language => {
        if (description.toLowerCase().includes(language.toLowerCase()) || title.toLowerCase().includes(language.toLowerCase())) {
            languages.add(language);
        }
    });
//get and split platforms
    const detectedPlatforms = new Set();
    platformsString.split(',').forEach(platform => {
        platform = platform.trim();
        if (platforms.includes(platform)) {
            detectedPlatforms.add(platform);
        }
    });

    book.scopes = Array.from(scopes);
    book.programming_languages = Array.from(languages);
    book.platforms = Array.from(detectedPlatforms);

    return book;
}

function generateJSON() {
    const filePath = path.join(__dirname, 'creative_coding.txt');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const contentList = [];
    let currentScope = '';

    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith("#")) {
            currentScope = line;
        } else if (line.startsWith("- [")) {
            const item = processLine(line, currentScope);
            if (item) {
                contentList.push(item);
            }
        }
    });

    fs.writeFileSync('contents.json', JSON.stringify(contentList, null, 2), 'utf8');
    console.log('contents.json file created.');
}

generateJSON();
