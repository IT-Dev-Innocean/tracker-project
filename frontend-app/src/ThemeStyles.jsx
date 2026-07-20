import React from 'react';

export default function AppThemes({ appTheme }) {
  return (
    <>
      {appTheme === 'gamer' && (
        <style>{`
          /* Gamer (Steam) Dark Mode Overrides */
          .dark body { background-color: #171a21 !important; color: #c6d4df !important; }
          .dark .dark\\:bg-neutral-950, .dark .dark\\:bg-slate-800, .dark .dark\\:bg-slate-950 { background-color: #171a21 !important; border-color: #2a475e !important; }
          .dark .dark\\:bg-neutral-900, .dark .dark\\:bg-slate-900 { background-color: #1b2838 !important; border-color: #2a475e !important; }
          .dark .dark\\:bg-neutral-800, .dark .dark\\:bg-slate-700 { background-color: #2a475e !important; border-color: #3d6a8a !important; }
          .dark .dark\\:bg-black { background-color: #101822 !important; border-color: #1b2838 !important; }
          
          .dark .text-indigo-600, .dark .dark\\:text-indigo-400, .dark .text-blue-600, .dark .dark\\:text-blue-400 { color: #66c0f4 !important; }
          .dark .bg-indigo-600, .dark .bg-blue-600 { background: linear-gradient(to right, #47bfff 0%, #1a44c2 100%) !important; color: white !important; border: 1px solid #1a44c2 !important; }
          .dark .bg-indigo-50, .dark .dark\\:bg-indigo-900\\/30, .dark .bg-blue-50, .dark .dark\\:bg-blue-900\\/30 { background-color: rgba(102, 192, 244, 0.1) !important; border-color: rgba(102, 192, 244, 0.3) !important; }
          
          .dark .dark\\:text-white, .dark .dark\\:text-slate-200, .dark .dark\\:text-slate-100 { color: #c6d4df !important; }
          .dark .dark\\:text-slate-300, .dark .dark\\:text-slate-400, .dark .text-neutral-500, .dark .text-neutral-400 { color: #8f98a0 !important; }
          
          .dark .dark\\:bg-white.dark\\:text-black, .dark .bg-black.text-white { 
            background: linear-gradient(to bottom, #66c0f4 5%, #1a44c2 95%) !important; 
            color: white !important; 
            border: 1px solid #2a475e !important; 
            box-shadow: 0 4px 15px rgba(26,68,194,0.4);
          }
          .dark .dark\\:bg-white.dark\\:text-black:hover, .dark .bg-black.text-white:hover {
            background: linear-gradient(to bottom, #66c0f4 5%, #2b5ede 95%) !important;
          }

          .dark [class*="border-neutral-7"], .dark [class*="border-neutral-8"], .dark [class*="border-slate-7"], .dark [class*="border-slate-8"] { border-color: #2a475e !important; }
          .dark [class*="divide-neutral-7"] > :not([hidden]) ~ :not([hidden]), .dark [class*="divide-neutral-8"] > :not([hidden]) ~ :not([hidden]), .dark [class*="divide-slate-7"] > :not([hidden]) ~ :not([hidden]), .dark [class*="divide-slate-8"] > :not([hidden]) ~ :not([hidden]) { border-color: #2a475e !important; }
          .dark .dark\\:border-transparent { border-color: transparent !important; }
          
          .dark ::-webkit-scrollbar-thumb { background-color: #2a475e !important; border-radius: 10px; }
          .dark ::-webkit-scrollbar-track { background-color: #171a21 !important; }
        `}</style>
      )}

      {appTheme === 'minimal' && (
        <style>{`
          /* Minimal (Google Material) Light Mode Overrides */
          html:not(.dark) body { background-color: #f8f9fa !important; color: #202124 !important; }
          html:not(.dark) body .bg-neutral-50, html:not(.dark) body .bg-slate-50, html:not(.dark) body .bg-neutral-100\\/50 { background-color: #f8f9fa !important; }
          html:not(.dark) body .bg-white { background-color: #ffffff !important; }
          html:not(.dark) body [class*="border-neutral-1"], html:not(.dark) body [class*="border-neutral-2"], html:not(.dark) body [class*="border-slate-1"], html:not(.dark) body [class*="border-slate-2"] { border-color: #dadce0 !important; }
          html:not(.dark) body [class*="divide-slate-1"] > :not([hidden]) ~ :not([hidden]), html:not(.dark) body [class*="divide-neutral-1"] > :not([hidden]) ~ :not([hidden]) { border-color: #dadce0 !important; }
          
          html:not(.dark) body .text-indigo-600, html:not(.dark) body .text-indigo-500, html:not(.dark) body .text-blue-600, html:not(.dark) body .text-blue-500 { color: #1a73e8 !important; }
          html:not(.dark) body .bg-indigo-600, html:not(.dark) body .bg-blue-600, html:not(.dark) body .bg-black.text-white { 
            background: #1a73e8 !important; 
            color: #ffffff !important; 
            border: none !important; 
          }
          html:not(.dark) body .bg-indigo-600:hover, html:not(.dark) body .bg-blue-600:hover, html:not(.dark) body .bg-black.text-white:hover {
            background: #1b66c9 !important;
            box-shadow: 0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15) !important;
          }
          
          html:not(.dark) body .bg-indigo-50, html:not(.dark) body .bg-blue-50 { background-color: #e8f0fe !important; border-color: #d2e3fc !important; }
          html:not(.dark) body .text-slate-800, html:not(.dark) body .text-black { color: #202124 !important; }
          html:not(.dark) body .text-slate-500, html:not(.dark) body .text-neutral-500, html:not(.dark) body .text-neutral-400 { color: #5f6368 !important; }
          html:not(.dark) body .shadow-sm { box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15) !important; }
          html:not(.dark) body .shadow-md, html:not(.dark) body .shadow-lg { box-shadow: 0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15) !important; }
          html:not(.dark) body .shadow-2xl { box-shadow: 0 4px 5px 0 rgba(60,64,67,0.3), 0 1px 10px 0 rgba(60,64,67,0.15) !important; }
          html:not(.dark) body .bg-neutral-100, html:not(.dark) body .bg-slate-100 { background-color: #f1f3f4 !important; border-color: #f1f3f4 !important; color: #202124 !important; }
          html:not(.dark) body .hover\\:bg-neutral-200:hover, html:not(.dark) body .hover\\:bg-slate-200:hover { background-color: #e8eaed !important; }
        `}</style>
      )}

      {appTheme === 'sunset' && (
        <style>{`
          /* Sunset (Instagram) Glassmorphism Overrides */
          html:not(.dark) body .bg-neutral-50:not(.min-h-screen), html:not(.dark) body .bg-slate-50:not(.min-h-screen), html:not(.dark) body .bg-neutral-100\\/50:not(.min-h-screen) { background-color: rgba(255,255,255,0.5) !important; backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-color: rgba(255,255,255,0.4) !important; }
          html:not(.dark) body .bg-white:not(.min-h-screen) { background-color: rgba(255,255,255,0.85) !important; backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-color: rgba(255,255,255,0.6) !important; }
          html:not(.dark) body .bg-slate-100:not(.min-h-screen), html:not(.dark) body .bg-neutral-100:not(.min-h-screen) { background-color: rgba(0,0,0,0.06) !important; border-color: transparent !important; }
          html:not(.dark) body [class*="border-neutral-1"], html:not(.dark) body [class*="border-neutral-2"], html:not(.dark) body [class*="border-slate-1"], html:not(.dark) body [class*="border-slate-2"] { border-color: rgba(255,255,255,0.6) !important; }
          html:not(.dark) body [class*="divide-slate-1"] > :not([hidden]) ~ :not([hidden]), html:not(.dark) body [class*="divide-neutral-1"] > :not([hidden]) ~ :not([hidden]) { border-color: rgba(255,255,255,0.6) !important; }
          
          html:not(.dark) body header h2, html:not(.dark) body main > div:first-child > div > h2 { color: #ffffff !important; text-shadow: 0 1px 4px rgba(0,0,0,0.3); }
          html:not(.dark) body header p, html:not(.dark) body main > div:first-child > div > p { color: rgba(255,255,255,0.95) !important; text-shadow: 0 1px 3px rgba(0,0,0,0.3); }
          
          .dark body { color: #ffffff !important; }
          .dark .dark\\:bg-neutral-950:not(.min-h-screen), .dark .dark\\:bg-slate-800:not(.min-h-screen), .dark .dark\\:bg-slate-950:not(.min-h-screen) { background-color: rgba(0,0,0,0.5) !important; backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-color: rgba(255,255,255,0.1) !important; }
          .dark .dark\\:bg-neutral-900:not(.min-h-screen), .dark .dark\\:bg-slate-900:not(.min-h-screen) { background-color: rgba(18,18,18,0.5) !important; backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-color: rgba(255,255,255,0.1) !important; }
          .dark .dark\\:bg-neutral-800:not(.min-h-screen), .dark .dark\\:bg-slate-700:not(.min-h-screen) { background-color: rgba(38,38,38,0.5) !important; backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-color: rgba(255,255,255,0.15) !important; }
          .dark .dark\\:bg-black:not(.min-h-screen) { background-color: rgba(0,0,0,0.6) !important; border-color: rgba(255,255,255,0.1) !important; backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); }
          .dark [class*="border-neutral-7"], .dark [class*="border-neutral-8"], .dark [class*="border-slate-7"], .dark [class*="border-slate-8"] { border-color: rgba(255,255,255,0.1) !important; }
          .dark [class*="divide-neutral-7"] > :not([hidden]) ~ :not([hidden]), .dark [class*="divide-neutral-8"] > :not([hidden]) ~ :not([hidden]), .dark [class*="divide-slate-7"] > :not([hidden]) ~ :not([hidden]), .dark [class*="divide-slate-8"] > :not([hidden]) ~ :not([hidden]) { border-color: rgba(255,255,255,0.1) !important; }
          
          .dark .dark\\:text-slate-500, .dark .dark\\:text-slate-400, .dark .text-slate-500, .dark .text-neutral-500, .dark .text-neutral-400 { color: rgba(255,255,255,0.7) !important; }
          .dark .text-slate-800, .dark .dark\\:text-white, .dark .text-black { color: #ffffff !important; }
          
          .text-indigo-600, .dark .dark\\:text-indigo-400, .text-blue-600, .dark .dark\\:text-blue-400 { color: #f09433 !important; }
          .bg-indigo-600, .bg-blue-600, .bg-black.text-white, .dark .dark\\:bg-white.dark\\:text-black { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%) !important; color: #ffffff !important; border: none !important; }
          .bg-indigo-600:hover, .bg-blue-600:hover, .bg-black.text-white:hover, .dark .dark\\:bg-white.dark\\:text-black:hover { opacity: 0.9 !important; box-shadow: 0 4px 15px rgba(220,39,67,0.4); }
          .bg-indigo-50, .dark .dark\\:bg-indigo-900\\/30, .bg-blue-50, .dark .dark\\:bg-blue-900\\/30 { background-color: rgba(255, 255, 255, 0.2) !important; border-color: rgba(255, 255, 255, 0.3) !important; }
          
          /* Fix for Analytics cards */
          html:not(.dark) body .summary-card { background-color: #ffffff !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; border-color: #e5e5e5 !important; box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important; }
          .dark body .summary-card { background-color: #1a1a1a !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; border-color: #333333 !important; box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important; }
        `}</style>
      )}

      {appTheme === 'hacker' && (
        <style>{`
          /* Hacker (Sublime/Monokai) Dark Mode Overrides */
          .font-sans, input, textarea, select, button { font-family: 'Consolas', 'Courier New', 'Monaco', 'Menlo', monospace !important; letter-spacing: -0.02em; }
          .rounded-xl, .rounded-2xl, .rounded-3xl, .rounded-full, .rounded-lg, .rounded-md { border-radius: 4px !important; }
          .shadow-sm, .shadow-md, .shadow-lg, .shadow-2xl { box-shadow: none !important; }
          html:not(.dark) body { background-color: #F8F8F2 !important; color: #272822 !important; }
          html:not(.dark) body .bg-neutral-50, html:not(.dark) body .bg-slate-50, html:not(.dark) body .bg-neutral-100\\/50 { background-color: #E6E6E6 !important; border-color: #d1d1d1 !important; }
          html:not(.dark) body .bg-white { background-color: #FFFFFF !important; }
          html:not(.dark) body .bg-slate-100, html:not(.dark) body .bg-neutral-100 { background-color: #e5e5e5 !important; border-color: transparent !important; }
          .dark body { background-color: #373c44 !important; color: #d8dee9 !important; }
          .dark .dark\\:bg-neutral-950, .dark .dark\\:bg-slate-800, .dark .dark\\:bg-slate-950 { background-color: #2e323a !important; }
          .dark .dark\\:bg-neutral-900, .dark .dark\\:bg-slate-900 { background-color: #373c44 !important; }
          .dark .dark\\:bg-black { background-color: #21252b !important; }
          .dark .text-indigo-600, .dark .dark\\:text-indigo-400, .dark .text-blue-600, .dark .dark\\:text-blue-400 { color: #66D9EF !important; }
          .dark .bg-indigo-600, .dark .bg-blue-600, .dark .dark\\:bg-white.dark\\:text-black { background-color: #A6E22E !important; color: #272822 !important; border: 1px solid #82B414 !important; font-weight: bold !important; }
          .dark .bg-indigo-50, .dark .dark\\:bg-indigo-900\\/30 { background-color: rgba(102, 217, 239, 0.1) !important; border-color: rgba(102, 217, 239, 0.2) !important; }
        `}</style>
      )}

      {appTheme === 'chatapp' && (
        <style>{`
          /* Chat App (Discord) Dark Mode Overrides */
          .font-sans, input, textarea, select, button { font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif !important; }
          .rounded-xl, .rounded-2xl, .rounded-3xl, .rounded-lg { border-radius: 8px !important; }
          html:not(.dark) body { background-color: #ffffff !important; color: #313338 !important; }
          .dark body { background-color: #313338 !important; color: #dbdee1 !important; }
        `}</style>
      )}

      {appTheme === 'editor' && (
        <style>{`
          /* Monokai Pro Editor Aesthetics */
          .font-sans, input, textarea, select, button { font-family: 'Consolas', 'Courier New', 'Monaco', 'Menlo', monospace !important; letter-spacing: -0.02em; }
          .rounded-xl, .rounded-2xl, .rounded-3xl, .rounded-full, .rounded-lg, .rounded-md { border-radius: 6px !important; }
          
          /* Light Mode fallback */
          html:not(.dark) body { background-color: #f7f1ff !important; color: #2D2A2E !important; }
          html:not(.dark) body .bg-white, html:not(.dark) body .bg-neutral-50 { background-color: #ffffff !important; border-color: #e3e0e8 !important; }
          
          /* Dark Mode Backgrounds */
          .dark body { background-color: #2D2A2E !important; color: #FCFCFA !important; }
          .dark .dark\\:bg-neutral-950, .dark .dark\\:bg-slate-950, .dark .dark\\:bg-black { background-color: #1E1C1F !important; border-color: #403E41 !important; }
          .dark .dark\\:bg-neutral-900, .dark .dark\\:bg-slate-900 { background-color: #221F22 !important; border-color: #403E41 !important; }
          .dark .dark\\:bg-neutral-800, .dark .dark\\:bg-slate-800, .dark .dark\\:bg-slate-700 { background-color: #403E41 !important; border-color: #5B595C !important; }
          
          /* Accents (Primary: Orange, Secondary: Pink) */
          .dark .text-indigo-600, .dark .dark\\:text-indigo-400, .dark .text-blue-600, .dark .dark\\:text-blue-400 { color: #FC9867 !important; }
          .dark .bg-indigo-600, .dark .bg-blue-600, .dark .bg-black.text-white, .dark .dark\\:bg-white.dark\\:text-black { background-color: #FC9867 !important; color: #2D2A2E !important; border: 1px solid #FC9867 !important; box-shadow: none !important; font-weight: bold !important; }
          .dark .bg-indigo-600:hover, .dark .bg-black.text-white:hover, .dark .dark\\:bg-white.dark\\:text-black:hover { background-color: #FF6188 !important; border-color: #FF6188 !important; }
          .dark .bg-indigo-50, .dark .dark\\:bg-indigo-900\\/30, .dark .bg-blue-50, .dark .dark\\:bg-blue-900\\/30 { background-color: rgba(252, 152, 103, 0.15) !important; border-color: rgba(252, 152, 103, 0.3) !important; }
          
          /* Accents (Monokai Green) */
          .dark .text-emerald-600, .dark .dark\\:text-emerald-400 { color: #A9DC76 !important; }
          .dark .bg-emerald-50, .dark .dark\\:bg-emerald-900\\/30 { background-color: rgba(169, 220, 118, 0.15) !important; border-color: rgba(169, 220, 118, 0.3) !important; }
          
          /* Accents (Monokai Yellow) */
          .dark .text-amber-600, .dark .dark\\:text-amber-400, .dark .text-yellow-600, .dark .dark\\:text-yellow-400 { color: #FFD866 !important; }
          .dark .bg-amber-50, .dark .dark\\:bg-amber-900\\/30, .dark .bg-yellow-50, .dark .dark\\:bg-yellow-900\\/30 { background-color: rgba(255, 216, 102, 0.15) !important; border-color: rgba(255, 216, 102, 0.3) !important; }
          
          /* Accents (Secondary: Pink/Rose) */
          .dark .text-red-600, .dark .dark\\:text-red-400, .dark .text-rose-600, .dark .dark\\:text-rose-400 { color: #FF6188 !important; }
          .dark .bg-red-50, .dark .dark\\:bg-red-900\\/30, .dark .bg-rose-50, .dark .dark\\:bg-rose-900\\/30 { background-color: rgba(255, 97, 136, 0.15) !important; border-color: rgba(255, 97, 136, 0.3) !important; }
          
          /* Accents (Monokai Cyan) */
          .dark .text-sky-600, .dark .dark\\:text-sky-400, .dark .text-cyan-600, .dark .dark\\:text-cyan-400 { color: #78DCE8 !important; }
          .dark .bg-sky-50, .dark .dark\\:bg-sky-900\\/30, .dark .bg-cyan-50, .dark .dark\\:bg-cyan-900\\/30 { background-color: rgba(120, 220, 232, 0.15) !important; border-color: rgba(120, 220, 232, 0.3) !important; }
          
          /* Generic text and borders */
          .dark .dark\\:text-slate-500, .dark .dark\\:text-slate-400, .dark .text-neutral-500, .dark .text-neutral-400 { color: #939293 !important; }
          .dark [class*="border-neutral-7"], .dark [class*="border-neutral-8"], .dark [class*="border-slate-7"], .dark [class*="border-slate-8"] { border-color: #403E41 !important; }
          .dark [class*="divide-neutral-7"] > :not([hidden]) ~ :not([hidden]), .dark [class*="divide-slate-7"] > :not([hidden]) ~ :not([hidden]) { border-color: #403E41 !important; }
        `}</style>
      )}

      {appTheme === 'cupertino' && (
        <style>{`
          /* Cupertino (Apple) Glassmorphism Overrides */
          .font-sans, input, textarea, select, button { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; }
          
          /* Cupertino Light Mode Glassmorphism */
          html:not(.dark) body { background-color: #F5F5F7 !important; color: #1D1D1F !important; }
          html:not(.dark) body .bg-neutral-50:not(.min-h-screen), html:not(.dark) body .bg-slate-50:not(.min-h-screen), html:not(.dark) body .bg-neutral-100\\/50:not(.min-h-screen) { background-color: rgba(245, 245, 247, 0.7) !important; backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-color: rgba(0, 0, 0, 0.05) !important; }
          html:not(.dark) body .bg-white:not(.min-h-screen) { background-color: rgba(255, 255, 255, 0.75) !important; backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-color: rgba(0, 0, 0, 0.05) !important; }
          html:not(.dark) body .bg-slate-100:not(.min-h-screen), html:not(.dark) body .bg-neutral-100:not(.min-h-screen) { background-color: rgba(0, 0, 0, 0.06) !important; border-color: transparent !important; }
          html:not(.dark) body [class*="border-neutral-1"], html:not(.dark) body [class*="border-neutral-2"], html:not(.dark) body [class*="border-slate-1"], html:not(.dark) body [class*="border-slate-2"] { border-color: rgba(0, 0, 0, 0.08) !important; }
          html:not(.dark) body [class*="divide-slate-1"] > :not([hidden]) ~ :not([hidden]), html:not(.dark) body [class*="divide-neutral-1"] > :not([hidden]) ~ :not([hidden]) { border-color: rgba(0, 0, 0, 0.08) !important; }

          /* Cupertino Dark Mode Glassmorphism */
          .dark body { background-color: #000000 !important; color: #F5F5F7 !important; }
          .dark .dark\\:bg-neutral-950:not(.min-h-screen), .dark .dark\\:bg-slate-800:not(.min-h-screen), .dark .dark\\:bg-slate-950:not(.min-h-screen) { background-color: rgba(28, 28, 30, 0.7) !important; backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-color: rgba(255, 255, 255, 0.1) !important; }
          .dark .dark\\:bg-neutral-900:not(.min-h-screen), .dark .dark\\:bg-slate-900:not(.min-h-screen) { background-color: rgba(44, 44, 46, 0.7) !important; backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-color: rgba(255, 255, 255, 0.1) !important; }
          .dark .dark\\:bg-neutral-800:not(.min-h-screen), .dark .dark\\:bg-slate-700:not(.min-h-screen) { background-color: rgba(58, 58, 60, 0.7) !important; backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-color: rgba(255, 255, 255, 0.15) !important; }
          .dark .dark\\:bg-black:not(.min-h-screen) { background-color: rgba(0, 0, 0, 0.7) !important; backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-color: rgba(255, 255, 255, 0.1) !important; }
          .dark [class*="border-neutral-7"], .dark [class*="border-neutral-8"], .dark [class*="border-slate-7"], .dark [class*="border-slate-8"] { border-color: rgba(255,255,255,0.1) !important; }
          .dark [class*="divide-neutral-7"] > :not([hidden]) ~ :not([hidden]), .dark [class*="divide-neutral-8"] > :not([hidden]) ~ :not([hidden]), .dark [class*="divide-slate-7"] > :not([hidden]) ~ :not([hidden]), .dark [class*="divide-slate-8"] > :not([hidden]) ~ :not([hidden]) { border-color: rgba(255,255,255,0.1) !important; }

          /* Card fixes */
          html:not(.dark) body .summary-card { background-color: rgba(255,255,255,0.75) !important; backdrop-filter: blur(20px) saturate(180%) !important; -webkit-backdrop-filter: blur(20px) saturate(180%) !important; border-color: rgba(0,0,0,0.05) !important; box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important; }
          .dark body .summary-card { background-color: rgba(28,28,30,0.7) !important; backdrop-filter: blur(20px) saturate(180%) !important; -webkit-backdrop-filter: blur(20px) saturate(180%) !important; border-color: rgba(255,255,255,0.1) !important; box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important; }

          /* Cupertino List View Row Hover Highlight */
          html:not(.dark) body tr.cursor-pointer:hover, html:not(.dark) body tr.cursor-pointer:hover > td { background-color: transparent !important; }
          .dark body table tbody tr.cursor-pointer:hover, .dark body table tbody tr.cursor-pointer:hover > td { background-color: transparent !important; }

          /* NEW: Support for div-based list in TableList.jsx */
          html:not(.dark) body div[class*="space-y-"] > div.cursor-pointer.group:hover { background-color: transparent !important; box-shadow: 0 0 0 2px #007AFF !important; transition: box-shadow 0.2s ease-in-out; }
          .dark body div[class*="space-y-"] > div.cursor-pointer.group:hover { background-color: transparent !important; box-shadow: 0 0 0 2px #0A84FF !important; transition: box-shadow 0.2s ease-in-out; }

          /* Overdue Task Hover Override for Cupertino */
          html:not(.dark) body div[class*="space-y-"] > div.cursor-pointer.group[class*="bg-red-50\\/40"]:hover { box-shadow: 0 0 0 2px #ef4444 !important; }
          .dark body div[class*="space-y-"] > div.cursor-pointer.group[class*="dark\\:bg-red-900\\/10"]:hover { box-shadow: 0 0 0 2px #f87171 !important; }
        `}</style>
      )}

      {appTheme === 'social' && (
        <style>{`
          /* Social (Facebook/Meta) Light Mode Overrides */
          .font-sans, input, textarea, select, button { font-family: Segoe UI, Helvetica, Arial, sans-serif !important; }
          .rounded-xl, .rounded-2xl, .rounded-3xl, .rounded-lg { border-radius: 8px !important; }

          html:not(.dark) body { background-color: #F0F2F5 !important; color: #050505 !important; }
          html:not(.dark) body .bg-white, html:not(.dark) body .bg-neutral-50, html:not(.dark) body .bg-slate-50 { background-color: #ffffff !important; border-color: #CED0D4 !important; }
          html:not(.dark) body .bg-neutral-100, html:not(.dark) body .bg-slate-100 { background-color: #E4E6EB !important; border-color: #CED0D4 !important; }
          html:not(.dark) body [class*="border-neutral-2"], html:not(.dark) body [class*="border-slate-2"] { border-color: #CED0D4 !important; }
          html:not(.dark) body [class*="divide-slate-1"], html:not(.dark) body [class*="divide-neutral-1"] { border-color: #CED0D4 !important; }

          html:not(.dark) body .text-indigo-600, html:not(.dark) body .text-blue-600 { color: #1877F2 !important; }
          html:not(.dark) body .bg-indigo-600, html:not(.dark) body .bg-blue-600, html:not(.dark) body .bg-black.text-white { background-color: #1877F2 !important; color: #ffffff !important; border: none !important; }
          html:not(.dark) body .bg-indigo-600:hover, html:not(.dark) body .bg-blue-600:hover, html:not(.dark) body .bg-black.text-white:hover { background-color: #166FE5 !important; }
          html:not(.dark) body .bg-indigo-50, html:not(.dark) body .bg-blue-50 { background-color: #E7F3FF !important; border-color: #E7F3FF !important; }

          html:not(.dark) body .text-slate-800, html:not(.dark) body .text-black { color: #050505 !important; }
          html:not(.dark) body .text-slate-500, html:not(.dark) body .text-neutral-500, html:not(.dark) body .text-neutral-400 { color: #65676B !important; }

          /* Dark mode fallback to default */
          .dark body { background-color: #18191A !important; color: #E4E6EB !important; }
        `}</style>
      )}

      {appTheme === 'retail' && (
        <style>{`
          .font-sans, input, textarea, select, button { font-family: "Amazon Ember", Arial, sans-serif !important; }
          
          /* Retail (Amazon) Light Mode Overrides */
          html:not(.dark) body { background-color: #e4e6e6 !important; color: #0F1111 !important; }
          html:not(.dark) body .bg-neutral-50, html:not(.dark) body .bg-slate-50 { background-color: #e4e6e6 !important; border-color: #d5d9d9 !important; }
          html:not(.dark) body .bg-white { background-color: #FFFFFF !important; border-color: #d5d9d9 !important; }
          html:not(.dark) body .bg-slate-100, html:not(.dark) body .bg-neutral-100 { background-color: #f0f2f2 !important; border-color: #d5d9d9 !important; }
          
          /* Buttons & Accents */
          html:not(.dark) body .text-indigo-600, html:not(.dark) body .text-blue-600 { color: #007185 !important; }
          html:not(.dark) body .bg-indigo-600, html:not(.dark) body .bg-blue-600, html:not(.dark) body .bg-black.text-white { 
            background: linear-gradient(to bottom, #f8e3ad, #f2bc71) !important; 
            color: #0F1111 !important; 
            border: 1px solid #a88734 !important; 
            border-radius: 8px !important;
            box-shadow: 0 2px 5px 0 rgba(213,217,217,.5) !important;
          }
          html:not(.dark) body .bg-indigo-600:hover, html:not(.dark) body .bg-blue-600:hover, html:not(.dark) body .bg-black.text-white:hover {
            background: linear-gradient(to bottom, #f5d78e, #eeb056) !important;
          }
          html:not(.dark) body .bg-indigo-50, html:not(.dark) body .bg-blue-50 { background-color: #f0f8fa !important; border-color: #d5d9d9 !important; }
          
          /* Header & Footer Branding */
          html:not(.dark) body nav.bg-white, html:not(.dark) body header.bg-white, html:not(.dark) body header.bg-neutral-50 { background-color: #141921 !important; border-color: #141921 !important; }
          html:not(.dark) body nav.bg-white .text-black, html:not(.dark) body nav.bg-white .text-slate-800, html:not(.dark) body header.bg-white .text-black, html:not(.dark) body header.bg-neutral-50 .text-black { color: #ffffff !important; }
          html:not(.dark) body nav.bg-white .text-slate-700, html:not(.dark) body nav.bg-white .text-slate-500, html:not(.dark) body nav.bg-white .text-neutral-500, html:not(.dark) body nav.bg-white .text-neutral-400 { color: #cccccc !important; }
          html:not(.dark) body nav.bg-white .bg-slate-100, html:not(.dark) body nav.bg-white .bg-slate-200, html:not(.dark) body nav.bg-white .bg-white { background-color: #262f3d !important; border-color: #262f3d !important; color: #ffffff !important; }
          html:not(.dark) body nav.bg-white input { background-color: #ffffff !important; border-color: #ffffff !important; color: #0F1111 !important; }
          html:not(.dark) body nav.bg-white input::placeholder { color: #555555 !important; }
          html:not(.dark) body nav.bg-white input:focus { border-color: #f2bc71 !important; box-shadow: 0 0 0 2px rgba(242,188,113,0.5) !important; }
          
          /* Fix Dropdowns (Search Results, Menus) inside Nav */
          html:not(.dark) body nav.bg-white .z-50, html:not(.dark) body nav.bg-white .z-50 .bg-white\\/95, html:not(.dark) body nav.bg-white .z-50 .bg-white, html:not(.dark) body nav.bg-white .z-50 .bg-slate-100, html:not(.dark) body nav.bg-white .z-50 .bg-neutral-50 { background-color: #ffffff !important; border-color: #e4e6e6 !important; }
          html:not(.dark) body nav.bg-white .z-50 .text-black, html:not(.dark) body nav.bg-white .z-50 .text-slate-800, html:not(.dark) body nav.bg-white .z-50 .text-slate-700 { color: #0F1111 !important; }
          html:not(.dark) body nav.bg-white .z-50 .text-slate-500, html:not(.dark) body nav.bg-white .z-50 .text-neutral-500, html:not(.dark) body nav.bg-white .z-50 .text-neutral-400 { color: #555555 !important; }
          html:not(.dark) body nav.bg-white .z-50 .hover\\:bg-neutral-50:hover, html:not(.dark) body nav.bg-white .z-50 .hover\\:bg-neutral-100:hover, html:not(.dark) body nav.bg-white .z-50 .hover\\:bg-slate-100:hover, html:not(.dark) body nav.bg-white .z-50 .hover\\:bg-slate-200:hover { background-color: #f3f3f3 !important; }
          
          html:not(.dark) body footer.bg-white { background-color: #262f3d !important; border-color: #262f3d !important; color: #ffffff !important; }
          html:not(.dark) body footer.bg-white a, html:not(.dark) body footer.bg-white button, html:not(.dark) body footer.bg-white p, html:not(.dark) body footer.bg-white .text-neutral-400, html:not(.dark) body footer.bg-white .text-neutral-500 { color: #dddddd !important; }
          html:not(.dark) body footer.bg-white a:hover, html:not(.dark) body footer.bg-white button:hover { color: #ffffff !important; }

          /* Retail (Amazon) Dark Mode Overrides */
          .dark body { background-color: #131921 !important; color: #FFFFFF !important; }
          .dark .dark\\:bg-neutral-950, .dark .dark\\:bg-slate-800, .dark .dark\\:bg-slate-950 { background-color: #131921 !important; border-color: #232F3E !important; }
          .dark .dark\\:bg-neutral-900, .dark .dark\\:bg-slate-900 { background-color: #232F3E !important; border-color: #37475A !important; }
          .dark .dark\\:bg-neutral-800, .dark .dark\\:bg-slate-700 { background-color: #37475A !important; border-color: #4A5B70 !important; }
          .dark .dark\\:bg-black { background-color: #0F1111 !important; border-color: #232F3E !important; }
          
          .dark .text-indigo-600, .dark .dark\\:text-indigo-400, .dark .text-blue-600, .dark .dark\\:text-blue-400 { color: #00A8E1 !important; }
          .dark .bg-indigo-600, .dark .bg-blue-600, .dark .bg-black.text-white, .dark .dark\\:bg-white.dark\\:text-black { 
            background: linear-gradient(to bottom, #FFD814, #F0B800) !important; 
            color: #0F1111 !important; 
            border: 1px solid #F0B800 !important; 
            border-radius: 8px !important;
            box-shadow: 0 2px 5px 0 rgba(213,217,217,.5) !important;
          }
          .dark .bg-indigo-600:hover, .dark .bg-blue-600:hover, .dark .bg-black.text-white:hover, .dark .dark\\:bg-white.dark\\:text-black:hover {
            background: linear-gradient(to bottom, #F7CA00, #F0B800) !important;
          }
          .dark .bg-indigo-50, .dark .dark\\:bg-indigo-900\\/30, .dark .bg-blue-50, .dark .dark\\:bg-blue-900\\/30 { background-color: rgba(0, 168, 225, 0.1) !important; border-color: rgba(0, 168, 225, 0.2) !important; }
          
          .dark .dark\\:text-white, .dark .dark\\:text-slate-200, .dark .dark\\:text-slate-100 { color: #FFFFFF !important; }
          .dark .dark\\:text-slate-300, .dark .dark\\:text-slate-400, .dark .text-neutral-500, .dark .text-neutral-400 { color: #DDDDDD !important; }
          
          .dark [class*="border-neutral-7"], .dark [class*="border-neutral-8"], .dark [class*="border-slate-7"], .dark [class*="border-slate-8"] { border-color: #37475A !important; }
          .dark [class*="divide-neutral-7"] > :not([hidden]) ~ :not([hidden]), .dark [class*="divide-neutral-8"] > :not([hidden]) ~ :not([hidden]), .dark [class*="divide-slate-7"] > :not([hidden]) ~ :not([hidden]), .dark [class*="divide-slate-8"] > :not([hidden]) ~ :not([hidden]) { border-color: #37475A !important; }
        `}</style>
      )}
    </>
  );
}
