import { LoginForm } from "@/components/auth/login-form"

export default function Home() {
  return (
    <div className="container flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Bienvenid@ a Custodia
          </h1>
          <p className="text-muted-foreground">
            Inicia sesión para continuar
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

