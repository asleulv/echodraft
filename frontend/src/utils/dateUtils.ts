/**
 * Format a date to show "Today" if the date is today, otherwise show the date in the locale format
 * @param date The date to format (Date object or ISO string)
 * @param includeTime Whether to include the time in the output
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, includeTime: boolean = false): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  // Check if the date is today
  const isToday = 
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear();
  
  if (isToday) {
    if (includeTime) {
      return `Today, ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return 'Today';
  }
  
  // Not today, format normally
  if (includeTime) {
    return `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return dateObj.toLocaleDateString();
};
