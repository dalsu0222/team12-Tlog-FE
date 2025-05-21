export {};

declare global {
  interface Window {
    handleGoogleLogin: (response: { credential: string }) => Promise<void>;
    google?: {
      accounts?: {
        id?: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialize: (config: any) => void;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          renderButton: (element: HTMLElement | null, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}
