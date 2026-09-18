import React from 'react';

export default function AIUsageMeter({ usage, tMsg, compact = false }) {
  if (!usage) return null;
  const used = Number(usage.used || 0);
  const limit = Number(usage.limit || 0);
  const remaining = Number(usage.remaining ?? Math.max(0, limit - used));
  const atLimit = Boolean(usage.at_limit) || remaining <= 0;
  const approaching = Boolean(usage.approaching) || (remaining > 0 && remaining <= 3);

  if (compact) {
    return (
      <p
        className={`text-[10px] font-black uppercase tracking-widest ${
          atLimit
            ? 'text-amber-600'
            : approaching
              ? 'text-amber-600'
              : 'text-neutral-400'
        }`}
        title={tMsg('AI usage today', 'Pemakaian AI hari ini')}
      >
        {used}/{limit}
      </p>
    );
  }

  return (
    <div className="px-3 py-3 border-t border-neutral-200 dark:border-neutral-800">
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
        {tMsg('AI Usage', 'Pemakaian AI')}
      </p>
      <p className="mt-1 text-sm font-bold text-black dark:text-white">
        {used} / {limit} {tMsg('prompts used', 'prompt terpakai')}
      </p>
      <p
        className={`mt-1 text-[11px] leading-relaxed ${
          atLimit || approaching
            ? 'text-amber-700 dark:text-amber-400'
            : 'text-neutral-500 dark:text-neutral-400'
        }`}
      >
        {atLimit
          ? tMsg(
              'Daily AI limit reached. Your AI usage will reset tomorrow.',
              'Batas AI harian tercapai. Pemakaian AI akan direset besok.'
            )
          : remaining <= 3
            ? tMsg(
                `You have ${remaining} AI prompts remaining today.`,
                `Anda memiliki ${remaining} prompt AI tersisa hari ini.`
              )
            : tMsg(
                `${remaining} prompts remaining today`,
                `${remaining} prompt tersisa hari ini`
              )}
      </p>
    </div>
  );
}
