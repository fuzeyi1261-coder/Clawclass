interface FloatingScoreProps {
  id: string;
  value: number;
  name: string;
}

export default function FloatingScore({ value, name }: FloatingScoreProps) {
  const isPositive = value > 0;

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      <div
        className={`score-float text-6xl font-bold ${
          isPositive ? 'text-success' : 'text-danger'
        }`}
        style={{
          textShadow: isPositive
            ? '0 0 30px rgba(16, 185, 129, 0.6)'
            : '0 0 30px rgba(239, 68, 68, 0.6)',
        }}
      >
        {isPositive ? '+' : '-'}{Math.abs(value)}
      </div>
    </div>
  );
}
