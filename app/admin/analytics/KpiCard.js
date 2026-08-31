export default function KpiCard({ label, value, sub }) {
  return (
    <div className="bg-white p-6 rounded-[24px] border border-[var(--color-light-beige)] shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-medium-brown)] mb-3">
        {label}
      </p>
      <p className="text-2xl font-bold text-[var(--color-dark-brown)] break-words">{value}</p>
      {sub ? (
        <p className="text-[10px] text-[var(--color-medium-brown)] mt-2 leading-snug">{sub}</p>
      ) : null}
    </div>
  );
}