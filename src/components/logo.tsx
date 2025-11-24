import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex size-28 items-center justify-center rounded-lg text-primary-foreground">
      <Image 
        src="https://free.picui.cn/free/2025/11/25/692494766a07f.png"
        alt="智装侠 Logo"
        width={112}
        height={112}
        className="object-contain rounded-md"
      />
    </div>
  );
}
