"use client";

interface HamburgerButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

const HamburgerButton = ({ isOpen, onToggle }: HamburgerButtonProps) => {
  return (
    <button
      onClick={onToggle}
      data-state={isOpen ? "open" : "closed"}
      className="relative flex h-8 w-8 flex-col items-center justify-center focus:outline-none group cursor-pointer"
      aria-label="Toggle mobile menu"
    >
      <div
        className="
        mb-1 h-[3px] w-6 origin-center bg-[var(--color-text)] transition-transform duration-200
        group-data-[state=open]:translate-y-[5px] group-data-[state=open]:-rotate-45 transform
      "
      />

      <div
        className="
        mt-1 h-[3px] w-6 origin-center bg-[var(--color-text)] transition-transform duration-200
        group-data-[state=open]:-translate-y-[5px] group-data-[state=open]:rotate-45 transform
      "
      />
    </button>
  );
};

export default HamburgerButton;
