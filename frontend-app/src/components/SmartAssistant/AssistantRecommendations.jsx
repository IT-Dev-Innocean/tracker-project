import React from 'react';
import { Icon } from '../icons/Icon';

export default function AssistantRecommendations({ recommendations = [], onSelect }) {
  if (!recommendations.length) return null;

  return (
    <div className="mb-3">
      {recommendations.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.prompt)}
          className={`w-full flex items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-xl ${
            index < recommendations.length - 1 ? 'border-b border-neutral-200 dark:border-neutral-800' : ''
          }`}
        >
          <span className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Icon name={item.icon} className="w-4 h-4" />
          </span>
          <span className="text-sm font-medium text-black dark:text-white leading-snug">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
