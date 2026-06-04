declare module "canvas-confetti" {
  interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
  }
  function confetti(options?: ConfettiOptions): void;
  export default confetti;
}
