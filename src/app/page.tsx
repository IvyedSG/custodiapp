"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    const sessionId = localStorage.getItem("sessionId");

    if (jwt && sessionId) {
      router.push("/lockers");
    }
  }, [router]);

  return (
    <div className="min-h-[100dvh] w-full bg-background">
      <BackgroundBeamsWithCollision className="h-full min-h-[100dvh]">
        <div className="relative z-10 flex min-h-[100dvh] w-full items-center justify-center px-4 py-6 sm:py-10">
          <div className="mx-auto w-full max-w-[85vw] sm:max-w-md">
            <div className="mb-6 sm:mb-8 text-center">
              <TypewriterEffect
                words={[
                  { text: "Bienvenid@", className: "bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent" },
                  { text: "a", className: "bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent" },
                  { text: "Custodia", className: "bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent" }
                ]}
                className="text-3xl sm:text-4xl font-bold tracking-tight whitespace-nowrap"
                cursorClassName="bg-purple-600"
              />
              <p className="text-sm sm:text-base text-muted-foreground">Inicia sesión para continuar</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </BackgroundBeamsWithCollision>
    </div>
  );
}
