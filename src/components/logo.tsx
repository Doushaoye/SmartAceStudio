import Image from 'next/image';

export function Logo() {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center rounded-lg text-primary-foreground">
      <Image 
        src="https://free.picui.cn/free/2025/11/25/692495e34d1bf.png"
        alt="智装侠 Logo"
        fill
        className="object-contain rounded-md"
      />
    </div>
  );
}
