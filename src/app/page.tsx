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

  // Detectar dispositivos móviles/tablets y activar pantalla completa
  useEffect(() => {
    // Función para detectar si es un dispositivo móvil o tablet
    const isMobileOrTablet = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/g.test(userAgent);
      const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/g.test(userAgent);
      
      return isMobile || isTablet;
    };

    // Función para activar pantalla completa
    const enableFullscreen = async () => {
      try {
        const docElement = document.documentElement;
        if (docElement.requestFullscreen) {
          await docElement.requestFullscreen();
        } else if ((docElement as any).webkitRequestFullscreen) { // Safari
          await (docElement as any).webkitRequestFullscreen();
        } else if ((docElement as any).msRequestFullscreen) { // IE11
          await (docElement as any).msRequestFullscreen();
        }
      } catch (error) {
        console.log("No se pudo activar el modo pantalla completa:", error);
      }
    };

    // Si es móvil o tablet, intentar activar pantalla completa
    if (isMobileOrTablet()) {
      // Esperar a que el usuario interactúe con la página
      const handleUserInteraction = () => {
        enableFullscreen();
        // Eliminar los event listeners después de la primera interacción
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      };

      // Agregar event listeners para detectar la interacción del usuario
      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('touchstart', handleUserInteraction);
    }
  }, []);

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
