const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src', 'LandingPage.jsx');
const content = fs.readFileSync(srcPath, 'utf8');

const compDir = path.join(__dirname, 'src', 'components', 'LandingPage');
if (!fs.existsSync(compDir)) {
  fs.mkdirSync(compDir, { recursive: true });
}

// Helper to extract a block of code between two strings
function extractBlock(startStr, endStr) {
  const start = content.indexOf(startStr);
  let end = content.indexOf(endStr);
  if (start === -1) return null;
  if (end === -1) end = content.length; // fallback
  return content.substring(start, end);
}

const navAndHeroStr = extractBlock('          {/* Navigation */}', '        {/* AI Integration Hero Section */}');
const aiSectionStr = extractBlock('        {/* AI Integration Hero Section */}', '        {/* Feature Highlight Section */}');
const featuresSectionStr = extractBlock('        {/* Feature Highlight Section */}', '        {/* FAQ Section */}');
const faqSectionStr = extractBlock('        {/* FAQ Section */}', '        {/* Bottom CTA Section */}');
const footerStr = extractBlock('        {/* Footer */}', '        {/* Jump to Top Button */}');

// Write LandingHero.jsx
const heroContent = `import React, { useState, useEffect } from 'react';

export default function LandingHero({ showAuthForm, setIsLoginMode, setShowAuthForm, isInstallable, handleInstallClick }) {
  const [simStep, setSimStep] = useState(0);
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    if (!showAuthForm) {
      const timer = setInterval(() => {
        setSimStep((prev) => (prev + 1) % 5);
      }, 6500);
      return () => clearInterval(timer);
    }
  }, [showAuthForm]);

  const fullText =
    'Extract tasks: 1. Redesign homepage by next Friday (@johndoe). 2. Fix login API bug (@jane). 3. Update documentation.';
  useEffect(() => {
    if (simStep === 0) {
      let i = 0;
      setTypedText('');
      const timer = setInterval(() => {
        i++;
        setTypedText(fullText.slice(0, i));
        if (i > fullText.length) clearInterval(timer);
      }, 40);
      return () => clearInterval(timer);
    } else {
      setTypedText(fullText);
    }
  }, [simStep]);

  return (
    <>
${navAndHeroStr}
    </>
  );
}
`;
fs.writeFileSync(path.join(compDir, 'LandingHero.jsx'), heroContent);

// Write LandingAISection.jsx
const aiContent = `import React from 'react';

export default function LandingAISection() {
  return (
    <>
${aiSectionStr}
    </>
  );
}
`;
fs.writeFileSync(path.join(compDir, 'LandingAISection.jsx'), aiContent);

// Write LandingFeatures.jsx (needs features array and render mockup)
const mockupLogic = extractBlock('  const features = [', '  const faqs = [');
const renderMockup = extractBlock('  const renderFeatureMockup = () => {', '  useEffect(() => {\\n    if (!showAuthForm)');
const featuresContent = `import React, { useState, useEffect } from 'react';

export default function LandingFeatures({ showAuthForm }) {
  const [activeFeatureTab, setActiveFeatureTab] = useState('kanban');

  useEffect(() => {
    if (!showAuthForm) {
      const featureIds = ['kanban', 'list', 'timeline', 'calendar', 'analytics'];
      const timer = setInterval(() => {
        setActiveFeatureTab((prev) => {
          const idx = featureIds.indexOf(prev);
          return featureIds[(idx + 1) % featureIds.length];
        });
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [showAuthForm]);

${mockupLogic}
${renderMockup}

  return (
    <>
${featuresSectionStr}
    </>
  );
}
`;
fs.writeFileSync(path.join(compDir, 'LandingFeatures.jsx'), featuresContent);

// Write LandingFAQ.jsx
const faqLogic = extractBlock('  const faqs = [', '  const renderFeatureMockup');
const faqContent = `import React, { useState } from 'react';

export default function LandingFAQ({ setShowAuthForm, setIsLoginMode }) {
  const [activeFaq, setActiveFaq] = useState(null);

${faqLogic}

  return (
    <>
${faqSectionStr}
        {/* Bottom CTA Section */}
${extractBlock('        {/* Bottom CTA Section */}', '        {/* Footer */}')}
    </>
  );
}
`;
fs.writeFileSync(path.join(compDir, 'LandingFAQ.jsx'), faqContent);

// Write LandingFooter.jsx
const footerContent = `import React from 'react';

export default function LandingFooter({ setIsSupportAlertOpen, setIsPrivacyOpen, setIsTermsOpen }) {
  return (
    <>
${footerStr}
    </>
  );
}
`;
fs.writeFileSync(path.join(compDir, 'LandingFooter.jsx'), footerContent);

// Now update LandingPage.jsx itself to compose these components
// We replace the massive return block with the composed components.
let newLandingPage = content;

// Replace the massive section between {/* Navigation */} and {/* Jump to Top Button */} with the components
const sliceStart = content.indexOf('          {/* Navigation */}');
const sliceEnd = content.indexOf('        {/* Jump to Top Button */}');

const compositionStr = `
          <LandingHero showAuthForm={showAuthForm} setIsLoginMode={setIsLoginMode} setShowAuthForm={setShowAuthForm} isInstallable={isInstallable} handleInstallClick={handleInstallClick} />
          <LandingAISection />
          <LandingFeatures showAuthForm={showAuthForm} />
          <LandingFAQ setShowAuthForm={setShowAuthForm} setIsLoginMode={setIsLoginMode} />
          <LandingFooter setIsSupportAlertOpen={setIsSupportAlertOpen} setIsPrivacyOpen={setIsPrivacyOpen} setIsTermsOpen={setIsTermsOpen} />
`;

newLandingPage = newLandingPage.substring(0, sliceStart) + compositionStr + newLandingPage.substring(sliceEnd);

// Add imports for the new components
const importsStr = `import LandingHero from './components/LandingPage/LandingHero';
import LandingAISection from './components/LandingPage/LandingAISection';
import LandingFeatures from './components/LandingPage/LandingFeatures';
import LandingFAQ from './components/LandingPage/LandingFAQ';
import LandingFooter from './components/LandingPage/LandingFooter';\n`;

newLandingPage = newLandingPage.replace('import AuthForms from \'./AuthForms\';', "import AuthForms from './AuthForms';\n" + importsStr);

// Clean up unused state inside LandingPage.jsx (activeFeatureTab, etc)
newLandingPage = newLandingPage.replace(/  const \[activeFeatureTab, setActiveFeatureTab\] = useState\('kanban'\);\n/, '');
newLandingPage = newLandingPage.replace(/  const \[activeFaq, setActiveFaq\] = useState\(null\);\n/, '');
newLandingPage = newLandingPage.replace(/  const \[simStep, setSimStep\] = useState\(0\);\n/, '');
newLandingPage = newLandingPage.replace(/  const \[typedText, setTypedText\] = useState\(''\);\n/, '');
newLandingPage = newLandingPage.replace(mockupLogic, '');
newLandingPage = newLandingPage.replace(renderMockup, '');
newLandingPage = newLandingPage.replace(faqLogic, '');
newLandingPage = newLandingPage.replace(/  useEffect\(\(\) => {\n    if \(\!showAuthForm\) {\n      const featureIds = \['kanban', 'list', 'timeline', 'calendar', 'analytics'\];[\s\S]*?\}, \[showAuthForm\]\);\n/, '');
newLandingPage = newLandingPage.replace(/  useEffect\(\(\) => {\n    if \(\!showAuthForm\) {\n      const timer = setInterval\(\(\) => {\n        setSimStep\(\(prev\) => \(prev \+ 1\) % 5\);\n      \}, 6500\);\n      return \(\) => clearInterval\(timer\);\n    }\n  \}, \[showAuthForm\]\);\n/, '');
newLandingPage = newLandingPage.replace(/  const fullText =[\s\S]*?\}, \[simStep\]\);\n/, '');

fs.writeFileSync(srcPath, newLandingPage);
console.log('Successfully extracted and composed LandingPage components.');
