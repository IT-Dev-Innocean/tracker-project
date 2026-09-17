import React from 'react';
import { Icon } from '../icons/Icon';

export default function AssistantWelcome({ currentUser, tMsg, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-10'}`}>
      <Icon
        iconify="carbon:ai-agent"
        className={`${compact ? 'w-14 h-14' : 'w-16 h-16'} text-indigo-600 dark:text-indigo-400 mb-5`}
      />
      <h2
        className={`${compact ? 'text-xl' : 'text-2xl'} font-black text-black dark:text-white mb-2 tracking-tight`}
      >
        {tMsg(`Hello ${currentUser}`, `Halo ${currentUser}`)}
      </h2>
      <p className="text-sm text-neutral-500 font-medium">
        {tMsg('How can I help you?', 'Ada yang bisa saya bantu?')}
      </p>
    </div>
  );
}
