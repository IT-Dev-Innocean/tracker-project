const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src', 'LandingPage.jsx');
let content = fs.readFileSync(srcPath, 'utf8');
content = content.replace(/\r\n/g, '\n');

const compDir = path.join(__dirname, 'src', 'components', 'LandingPage');

// AISection extraction
const aiSectionStart = content.indexOf('        {/* AI Integration Hero Section */}');
if(aiSectionStart === -1) throw new Error('aiSectionStart not found');

const aiSectionEnd = content.indexOf('        <LandingFeatures showAuthForm={showAuthForm} />');
if(aiSectionEnd === -1) throw new Error('aiSectionEnd not found');

const aiSectionJSX = content.substring(aiSectionStart, aiSectionEnd);

const aiComponentStr = `import React from 'react';

export default function LandingAISection() {
  return (
    <>
${aiSectionJSX}
    </>
  );
}
`;
fs.writeFileSync(path.join(compDir, 'LandingAISection.jsx'), aiComponentStr);

// Update LandingPage.jsx
const newComposition = `        <LandingAISection />\n`;
content = content.replace(aiSectionJSX, newComposition);

content = content.replace("import LandingFeatures from './components/LandingPage/LandingFeatures';", "import LandingAISection from './components/LandingPage/LandingAISection';\nimport LandingFeatures from './components/LandingPage/LandingFeatures';");

fs.writeFileSync(srcPath, content);
console.log('AISection extracted successfully');
