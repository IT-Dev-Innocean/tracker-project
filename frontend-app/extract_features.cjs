const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src', 'LandingPage.jsx');
let content = fs.readFileSync(srcPath, 'utf8');

// Normalize newlines to \n
content = content.replace(/\r\n/g, '\n');

const compDir = path.join(__dirname, 'src', 'components', 'LandingPage');

// Features extraction
const stateStart = content.indexOf('  const [activeFeatureTab, setActiveFeatureTab] = useState(\'kanban\');');
if(stateStart === -1) throw new Error('stateStart not found');

const featuresStart = content.indexOf('  const features = [');
if(featuresStart === -1) throw new Error('featuresStart not found');

const renderMockupEnd = content.indexOf('  useEffect(() => {\n    if (!showAuthForm) {\n      const observer = new IntersectionObserver(');
if(renderMockupEnd === -1) throw new Error('renderMockupEnd not found');

const featuresBlock1 = content.substring(featuresStart, renderMockupEnd);

const effectStart = content.indexOf('  useEffect(() => {\n    if (!showAuthForm) {\n      const featureIds = [\'kanban\', \'list\', \'timeline\', \'calendar\', \'analytics\'];');
if(effectStart === -1) throw new Error('effectStart not found');

const effectBlockEnd = content.indexOf('  }, [showAuthForm]);', effectStart) + 22;
const effectBlock = content.substring(effectStart, effectBlockEnd);

const featureSectionStart = content.indexOf('        {/* Feature Highlight Section */}');
if(featureSectionStart === -1) throw new Error('featureSectionStart not found');

// In my manual edit, the next line after Feature Highlight Section ends is <LandingFAQ />
const featureSectionEnd = content.indexOf('        <LandingFAQ />');
if(featureSectionEnd === -1) throw new Error('featureSectionEnd not found');

const featureSectionJSX = content.substring(featureSectionStart, featureSectionEnd);

const featuresComponentStr = `import React, { useState, useEffect } from 'react';

export default function LandingFeatures({ showAuthForm }) {
  const [activeFeatureTab, setActiveFeatureTab] = useState('kanban');

${effectBlock}

${featuresBlock1}

  return (
    <>
${featureSectionJSX}
    </>
  );
}
`;
fs.writeFileSync(path.join(compDir, 'LandingFeatures.jsx'), featuresComponentStr);

// Update LandingPage.jsx
content = content.replace(featuresBlock1, '');
content = content.replace(effectBlock, '');
content = content.replace(/  const \[activeFeatureTab, setActiveFeatureTab\] = useState\('kanban'\);\n/, '');

const newComposition = `        <LandingFeatures showAuthForm={showAuthForm} />\n`;
content = content.replace(featureSectionJSX, newComposition);

content = content.replace("import LandingFAQ from './components/LandingPage/LandingFAQ';", "import LandingFeatures from './components/LandingPage/LandingFeatures';\nimport LandingFAQ from './components/LandingPage/LandingFAQ';");

// Restore Windows newlines if preferred, but writing \n on Windows is fine for prettier/eslint usually.
fs.writeFileSync(srcPath, content);
console.log('Features extracted successfully');
