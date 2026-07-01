import React from 'react';

export function SectionTitle({
  icon,
  title,
  tone
}: {
  icon: React.ReactNode;
  title: string;
  tone: "teal" | "blue" | "amber";
}) {
  return (
    <div className={`section-title tone-${tone}`}>
      <span>{icon}</span>
      <h2>{title}</h2>
    </div>
  );
}
