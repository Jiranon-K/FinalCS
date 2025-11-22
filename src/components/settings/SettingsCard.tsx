'use client';

interface SettingsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function SettingsCard({
  title,
  description,
  children,
}: SettingsCardProps) {
  return (
    <div className="card bg-base-100">
      <div className="card-body">
        <h2 className="card-title text-xl">{title}</h2>
        {description && (
          <p className="text-sm text-base-content/70 mb-4">{description}</p>
        )}
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}
