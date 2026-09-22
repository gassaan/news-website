import logoMask from "@/assets/hulhangu-logo-mask.png";

export default function Logo({ className = "h-10" }: { className?: string }) {
  return (
    <span
      className={`block ${className}`}
      style={{
        aspectRatio: "420/197",
        backgroundColor: "var(--logo)",
        maskImage: `url(${logoMask.src})`,
        maskRepeat: "no-repeat",
        maskPosition: "center",
        maskSize: "contain",
        WebkitMaskImage: `url(${logoMask.src})`,
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        WebkitMaskSize: "contain",
      }}
    />
  );
}
