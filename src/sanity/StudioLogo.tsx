import logoMask from "@/assets/hulhangu-logo-mask.png";

// The site's logo for the dashboard's top bar, on the purple tile.
export default function StudioLogo() {
  return (
    <span
      style={{
        display: "grid",
        placeItems: "center",
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        background: "#3e2180",
      }}
    >
      <span
        style={{
          width: "78%",
          aspectRatio: "420/197",
          backgroundColor: "#fafafa",
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
    </span>
  );
}
