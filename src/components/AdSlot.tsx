export default function AdSlot({ className = "" }: { className?: string }) {
  return (
    <div className={`wrap ad ${className}`}>
      <div className="slot">Advertise here</div>
      <small>Sponsored</small>
    </div>
  );
}
