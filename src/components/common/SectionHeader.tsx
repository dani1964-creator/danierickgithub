import clsx from 'clsx';

type Props = {
  title: string;
  subtitle?: string;
  className?: string;
};

export const SectionHeader = ({ title, subtitle, className }: Props) => (
  <div className={clsx("max-w-6xl mx-auto px-4 md:px-6 lg:px-8", className)}>
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2
          className="text-2xl md:text-3xl font-extrabold tracking-tight"
          style={{ color: 'var(--surface-fg)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm md:text-base text-slate-500">{subtitle}</p>
        )}
      </div>
      <div className="h-[2px] flex-1 rounded-full"
           style={{ background: 'linear-gradient(90deg, var(--color-primary), transparent)' }} />
    </div>
  </div>
);

export default SectionHeader;
