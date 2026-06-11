'use client';
export function DetailPanels({ detail, events }: { detail: any; events: any[] }) {
  if (!detail && events.length === 0) return null;
  return (
    <div className="space-y-4">
      {events.length > 0 && (
