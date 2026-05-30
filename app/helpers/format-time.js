import { helper } from '@ember/component/helper';

export default helper(function formatTime([isoString]) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) {
    return `Today at ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  if (date.getFullYear() !== now.getFullYear()) {
    const yearStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    return `${yearStr} at ${timeStr}`;
  }

  return `${dateStr} at ${timeStr}`;
});
