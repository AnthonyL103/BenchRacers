"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "./ui/button"
import { Car, Compass, User, Home, Trophy, Users } from "lucide-react"
import { cn } from "./lib/utils"

export function Navbar() {
  const pathname = usePathname()

  const routes = [
    { name: "Home", path: "/", icon: Home },
    { name: "Explore", path: "/explore", icon: Compass },
    { name: "Rankings", path: "/rankings", icon: Trophy },
    { name: "Following", path: "/following", icon: Users },
    { name: "My Garage", path: "/garage", icon: User },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-sm border-b border-gray-800">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Bench Racers</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {routes.map((route) => {
              const Icon = route.icon
              return (
                <Link key={route.path} href={route.path}>
                  <Button
                    variant="ghost"
                    className={cn("flex items-center gap-1", pathname === route.path && "bg-secondary text-white")}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{route.name}</span>
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/auth">
            <Button variant="outline" className="hidden sm:flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" x2="3" y1="12" y2="12" />
              </svg>
              <span>Login</span>
            </Button>
          </Link>
          <Link href="/auth?signup=true">
            <Button className="hidden sm:inline-flex">Sign Up</Button>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </Button>
        </div>
      </div>
    </nav>
  )
}
