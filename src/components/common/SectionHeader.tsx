import clsx from 'clsx';

type Props = {
  title: string;
  subtitle?: string;
  className?: string;
};

export const SectionHeader = ({ title, subtitle, className }: Props) => (
  <div className={clsx("max-w-6xl mx-auto px-4 md:px-6 lg:px-8", className)}>
    <div className="text-center space-y-2">
      <h2
        className="text-2xl md:text-3xl font-semibold tracking-tight"
        style={{ color: 'var(--surface-fg)' }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto">{subtitle}</p>
      )}
    </div>
  </div>
);

export default SectionHeader;
