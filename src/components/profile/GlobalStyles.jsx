"use client";

export function GlobalStyles() {
  return (
    <style jsx>{`
      @keyframes blob {
        0% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(30px, -50px) scale(1.1); }
        66% { transform: translate(-20px, 20px) scale(0.9); }
        100% { transform: translate(0px, 0px) scale(1); }
      }
      
      @keyframes pulse-slow {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      
      @keyframes count-up {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      
      .animate-blob {
        animation: blob 7s infinite;
      }
      
      .animation-delay-2000 {
        animation-delay: 2s;
      }
      
      .animation-delay-4000 {
        animation-delay: 4s;
      }
      
      .animate-pulse-slow {
        animation: pulse-slow 3s ease-in-out infinite;
      }
      
      .animate-count-up {
        animation: count-up 0.6s ease-out;
      }

      @media (max-width: 640px) {
        .animate-blob {
          display: none;
        }
      }
    `}</style>
  );
}
