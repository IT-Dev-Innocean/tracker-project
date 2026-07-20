const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src', 'LandingPage.jsx');
let content = fs.readFileSync(srcPath, 'utf8');

const compDir = path.join(__dirname, 'src', 'components', 'LandingPage');

// FAQ extraction
const faqsStart = content.indexOf('  const faqs = [');
const faqsEnd = content.indexOf('  ];\n\n  const renderFeatureMockup') + 4;
const faqsBlock = content.substring(faqsStart, faqsEnd);

const faqSectionStart = content.indexOf('        {/* FAQ Section */}');
const faqSectionEnd = content.indexOf('        {/* Bottom CTA Section */}');
const faqSectionJSX = content.substring(faqSectionStart, faqSectionEnd);

const faqComponentStr = `import React, { useState } from 'react';

export default function LandingFAQ({ setShowAuthForm, setIsLoginMode }) {
  const [activeFaq, setActiveFaq] = useState(null);

${faqsBlock}

  return (
    <>
${faqSectionJSX}
    </>
  );
}
`;

fs.writeFileSync(path.join(compDir, 'LandingFAQ.jsx'), faqComponentStr);

// CTA Section extraction
const ctaSectionStart = content.indexOf('        {/* Bottom CTA Section */}');
const ctaSectionEnd = content.indexOf('        {/* Footer */}');
const ctaSectionJSX = content.substring(ctaSectionStart, ctaSectionEnd);

const ctaComponentStr = `import React from 'react';

export default function LandingCTA({ setShowAuthForm, setIsLoginMode }) {
  return (
    <>
${ctaSectionJSX}
    </>
  );
}
`;
fs.writeFileSync(path.join(compDir, 'LandingCTA.jsx'), ctaComponentStr);

// Update LandingPage.jsx to remove these
content = content.replace(faqsBlock, '');
content = content.replace(/  const \[activeFaq, setActiveFaq\] = useState\(null\);\n/, '');

const newComposition = `        <LandingFAQ setShowAuthForm={setShowAuthForm} setIsLoginMode={setIsLoginMode} />
        <LandingCTA setShowAuthForm={setShowAuthForm} setIsLoginMode={setIsLoginMode} />
`;
const oldComposition = content.substring(faqSectionStart, ctaSectionEnd);
content = content.replace(oldComposition, newComposition);

content = content.replace("import LandingFooter from './components/LandingPage/LandingFooter';", "import LandingFooter from './components/LandingPage/LandingFooter';\nimport LandingFAQ from './components/LandingPage/LandingFAQ';\nimport LandingCTA from './components/LandingPage/LandingCTA';");

fs.writeFileSync(srcPath, content);
console.log('FAQ and CTA extracted');
