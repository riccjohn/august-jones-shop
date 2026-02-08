import Image from "next/image";

const InstagramIcon = ({
  className,
  variant = "black",
}: {
  className?: string;
  variant?: "black" | "white";
}) => {
  const whiteLogoSrc = "/logos/Instagram_Glyph_White.svg";
  const blackLogoSrc = "/logos/Instagram_Glyph_Black.svg";
  const logoSrc = variant === "white" ? whiteLogoSrc : blackLogoSrc;
  return (
    <Image
      src={logoSrc}
      alt=""
      width={20}
      height={20}
      className={className}
      aria-hidden="true"
    />
  );
};

export default InstagramIcon;
