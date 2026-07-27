import { Icon as IconifyIcon } from '@iconify/react';
import { emojiToIcon, lucideMap } from './lucideMap';

/**
 * Unified icon component — Lucide (default) or Iconify.
 *
 * @example
 * <Icon name="search" className="w-4 h-4" />
 * <Icon emoji="🔍" className="w-4 h-4" />
 * <Icon iconify="mdi:google" className="w-5 h-5" />
 */
export function Icon({ name, emoji, iconify, className = 'w-4 h-4', strokeWidth = 2, ...props }) {
  if (iconify) {
    return <IconifyIcon icon={iconify} className={className} {...props} />;
  }

  const resolvedName = name || (emoji ? emojiToIcon[emoji] : null);
  if (!resolvedName) {
    return emoji ? <span aria-hidden="true">{emoji}</span> : null;
  }

  const LucideComponent = lucideMap[resolvedName];
  if (LucideComponent) {
    return <LucideComponent className={className} strokeWidth={strokeWidth} {...props} />;
  }

  return <IconifyIcon icon={`lucide:${resolvedName}`} className={className} {...props} />;
}

export { lucideMap, emojiToIcon };
