const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src', 'LandingPage.jsx');
let content = fs.readFileSync(srcPath, 'utf8');
content = content.replace(/\r\n/g, '\n');

const compDir = path.join(__dirname, 'src', 'components', 'LandingPage');

// Hero extraction
const simStepStart = content.indexOf('  const [simStep, setSimStep] = useState(0);');
if(simStepStart === -1) throw new Error('simStepStart not found');

const scrollEffectEnd = content.indexOf('  }, []);\n\n') + 10;
const heroStatesBlock = content.substring(simStepStart, scrollEffectEnd);

const heroSectionStart = content.indexOf('        <div className="min-h-screen flex flex-col relative z-10">');
if(heroSectionStart === -1) throw new Error('heroSectionStart not found');

const heroSectionEnd = content.indexOf('        <LandingAISection />');
if(heroSectionEnd === -1) throw new Error('heroSectionEnd not found');

const heroSectionJSX = content.substring(heroSectionStart, heroSectionEnd);

const heroComponentStr = `import React, { useState, useEffect } from 'react';

export default function LandingHero({ showAuthForm, setIsLoginMode, setShowAuthForm, isInstallable, handleInstallClick, showScrollTop, setShowScrollTop }) {
${heroStatesBlock}

  return (
    <>
${heroSectionJSX}
    </>
  );
}
`;
fs.writeFileSync(path.join(compDir, 'LandingHero.jsx'), heroComponentStr);

// Update LandingPage.jsx
content = content.replace(heroStatesBlock, '');

const newComposition = `        <LandingHero
          showAuthForm={showAuthForm}
          setIsLoginMode={setIsLoginMode}
          setShowAuthForm={setShowAuthForm}
          isInstallable={isInstallable}
          handleInstallClick={handleInstallClick}
          showScrollTop={showScrollTop}
          setShowScrollTop={setShowScrollTop}
        />\n`;
content = content.replace(heroSectionJSX, newComposition);

content = content.replace("import LandingAISection from './components/LandingPage/LandingAISection';", "import LandingHero from './components/LandingPage/LandingHero';\nimport LandingAISection from './components/LandingPage/LandingAISection';");

fs.writeFileSync(srcPath, content);
console.log('Hero extracted successfully');
