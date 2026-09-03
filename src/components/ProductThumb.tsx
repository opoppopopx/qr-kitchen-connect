import { isImageUrl } from "@/lib/menuImage";
import { cn } from "@/lib/utils";

interface Props {
  image: string;
  name: string;
  className?: string;
  emojiClassName?: string;
}

export function ProductThumb({ image, name, className, emojiClassName }: Props) {
  if (isImageUrl(image)) {
    return (
      <img
        src={image}
        alt={`รูปเมนู ${name}`}
        loading="lazy"
        className={cn("rounded-md object-cover border shrink-0", className ?? "h-14 w-14")}
      />
    );
  }
  return <span className={emojiClassName ?? "text-3xl"}>{image}</span>;
}
