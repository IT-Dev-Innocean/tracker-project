import React from 'react';
import { Icon } from '../icons/Icon';
import { renderRichText } from '../../Utils';

export default function TaskDetailActivity({ activityLogs, tMsg, formatDateMMM }) {
  return (
    <div className="space-y-4">
      {activityLogs.map((a) => {
        const msg = a.text.replace('[ACTIVITY] ', '');
        let iconName = 'pin';
        if (msg.toLowerCase().includes('created')) iconName = 'sparkles';
        else if (msg.toLowerCase().includes('transferred')) iconName = 'rocket';
        else if (msg.toLowerCase().includes('status')) iconName = 'refresh-cw';
        else if (msg.toLowerCase().includes('sub-task')) iconName = 'clipboard-list';
        else if (msg.toLowerCase().includes('updated')) iconName = 'pencil';
        else if (msg.toLowerCase().includes('deleted')) iconName = 'trash';
        return (
          <div
            key={a.id}
            className="flex gap-3 items-start p-3 bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-2xl shadow-sm"
          >
            <div className="shrink-0 mt-0.5 text-neutral-500 dark:text-neutral-400">
              <Icon name={iconName} className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {renderRichText(msg)}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mt-1">
                {formatDateMMM(a.timestamp)}
              </div>
            </div>
          </div>
        );
      })}
      {activityLogs.length === 0 && (
        <p className="text-center text-[10px] uppercase tracking-widest text-neutral-400 font-bold mt-10">
          {tMsg('No activities recorded yet.', 'Belum ada aktivitas terekam.')}
        </p>
      )}
    </div>
  );
}
