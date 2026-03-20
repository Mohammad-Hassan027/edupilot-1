"use client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox" 

function LoginForm(){

  const router = useRouter()
  const searchParams = useSearchParams()

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [error,setError] = useState("")
  const [isLoading,setIsLoading] = useState(false)
  const [showPassword,setShowPassword] = useState(false)

  async function handleSubmit(e:React.FormEvent){

    e.preventDefault()

    setIsLoading(true)
    setError("")

    try{

      const res = await fetch("/api/auth/login",{

        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({
          email,
          password
        })

      })

      const data = await res.json()

      if(!res.ok){

        setError(
          data.error || "Login failed"
        )

        setIsLoading(false)

        return
      }

      router.push("/dashboard")

    }
    catch(err){

      setError(
        "Something went wrong"
      )

      setIsLoading(false)

    }

  }

  async function handleGoogleLogin(){

    window.location.href =
    "/api/auth/google"

  }

  return (

    <div className="min-h-screen flex">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 items-center justify-center p-12">

        <div className="max-w-md">

          <div className="flex items-center gap-3 mb-8">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">

              <GraduationCap className="h-6 w-6 text-primary-foreground"/>

            </div>

            <div className="flex items-center gap-1">

              <span className="text-2xl font-bold">
                Edu
              </span>

              <span className="text-2xl font-bold text-primary">
                Pilot
              </span>

            </div>

          </div>

          <h1 className="text-3xl font-bold mb-4">
            Welcome back
          </h1>

          <p className="text-muted-foreground">
            Continue your AI powered learning journey.
          </p>

        </div>

      </div>

      {/* RIGHT PANEL */}

      <div className="flex-1 flex items-center justify-center p-8">

        <div className="w-full max-w-md">

          <h2 className="text-2xl font-bold mb-6">
            Sign in
          </h2>

          {error && (

            <div className="mb-4 text-red-500 text-sm flex gap-2">

              <AlertCircle className="h-4 w-4"/>

              {error}

            </div>

          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>

              <Input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e)=>
                  setEmail(e.target.value)
                }
              />

            </div>

            <div className="relative">

              <Input
                type={
                  showPassword
                  ? "text"
                  : "password"
                }

                placeholder="Password"

                required

                value={password}

                onChange={(e)=>
                  setPassword(e.target.value)
                }

              />

              <button

                type="button"

                onClick={()=>
                  setShowPassword(
                    !showPassword
                  )
                }

                className="absolute right-3 top-3"

              >

                {showPassword
                  ? <EyeOff size={16}/>
                  : <Eye size={16}/>
                }

              </button>

            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >

              {isLoading
                ? "Signing in..."
                : "Sign in"
              }

            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
            >

              Continue with Google

            </Button>

          </form>

          <p className="mt-6 text-sm text-center">

            Don't have account?

            <Link
              href="/register"
              className="text-primary ml-1"
            >

              Register

            </Link>

          </p>

        </div>

      </div>

    </div>

  )

}

export default function Page(){

  return(

    <Suspense fallback={null}>

      <LoginForm/>

    </Suspense>

  )

}