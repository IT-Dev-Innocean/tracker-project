export default function TableColumnHeader({
  label,
  align = 'left',
  className = '',
}) {
  const alignClass =
    align === 'right'
      ? 'text-right'
      : align === 'center'
        ? 'text-center'
        : 'text-left';

  return (
    <th
      className={`px-6 py-4 font-bold text-xs uppercase tracking-wide border-b border-neutral-200 dark:border-neutral-700 whitespace-nowrap ${alignClass} ${className}`}>
      {label}
    </th>
  );
}
