
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Hammer, ShieldCheck, BrainCircuit, ArrowRight, Calculator, Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


export default function LandingPage() {
    const { setTheme } = useTheme();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/login/admin" className="flex items-center gap-2 font-bold text-xl">
            <Rocket className="w-7 h-7 text-primary" />
            <span>Buildora</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/login/customer" className="text-sm font-medium hover:underline underline-offset-4">
              Login
            </Link>
             <Link href="/signup" className="text-sm font-medium hover:underline underline-offset-4">
              Register
            </Link>
            <Link href="#about" className="text-sm font-medium hover:underline underline-offset-4">
              About
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
           <Button asChild className="md:hidden">
              <Link href="/login/customer">Login</Link>
            </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="w-full pt-8 pb-12 md:pt-12 md:pb-24 lg:pt-16 lg:pb-32">
            <div className="container px-4 md:px-6 grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
                <div className="space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
                        Construction Logistics, Reimagined.
                    </h1>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-200">
                        Buildora revolutionizes supply delivery with autonomous drones and AI-powered logistics, ensuring you get the right materials, right when you need them.
                    </p>
                    <div className="flex flex-col gap-4 sm:flex-row animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-300">
                        <Button size="lg" asChild>
                            <Link href="/signup">
                                Get Started
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                             <Link href="#features">
                                Learn More
                            </Link>
                        </Button>
                    </div>
                </div>
                 <div className="relative h-80 w-full lg:h-[400px] animate-in fade-in slide-in-from-right duration-500">
                    <Image
                        src="https://placehold.co/1200x800.png"
                        alt="Drone delivering a package to a construction site"
                        fill
                        className="rounded-xl object-cover transition-transform duration-300 hover:scale-105"
                        data-ai-hint="drone delivery construction"
                        priority
                    />
                </div>
            </div>
        </section>

        <section id="features" className="bg-muted py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight md:text-4xl">The Future of Construction is Here</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Streamline your supply chain with our intelligent, automated platform.
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                    <Card className="transition-transform duration-300 hover:scale-105 hover:-translate-y-2">
                        <CardHeader className="items-center text-center">
                            <div className="rounded-full bg-primary/10 p-4 text-primary">
                                <Rocket className="h-8 w-8" />
                            </div>
                            <CardTitle className="mt-4">Autonomous Drone & Truck Fleet</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-center">
                                Get lightweight materials delivered in minutes via drone, and heavy goods scheduled perfectly with our trucks. Less site traffic, more productivity.
                            </CardDescription>
                        </CardContent>
                    </Card>
                     <Card className="transition-transform duration-300 hover:scale-105 hover:-translate-y-2">
                        <CardHeader className="items-center text-center">
                            <div className="rounded-full bg-primary/10 p-4 text-primary">
                                <Calculator className="h-8 w-8" />
                            </div>
                            <CardTitle className="mt-4">AI-Powered Material Estimator</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-center">
                                Input your project dimensions and let our AI calculate the exact amount of materials needed. Reduce waste and save on costs.
                            </CardDescription>
                        </CardContent>
                    </Card>
                     <Card className="transition-transform duration-300 hover:scale-105 hover:-translate-y-2">
                        <CardHeader className="items-center text-center">
                            <div className="rounded-full bg-primary/10 p-4 text-primary">
                                <BrainCircuit className="h-8 w-8" />
                            </div>
                            <CardTitle className="mt-4">Predictive Logistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-center">
                                Our AI analyzes your project progress and vehicle data to anticipate needs and prevent downtime, ensuring your crew is never left waiting.
                            </CardDescription>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        <section id="about" className="py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-4">
                         <h2 className="text-3xl font-bold tracking-tight md:text-4xl">About Buildora</h2>
                         <p className="text-muted-foreground">
                            Founded by a team of construction veterans and tech innovators, Buildora was born from a simple observation: construction projects are consistently plagued by logistical inefficiencies. Waiting for materials, incorrect orders, and cluttered sites cost time and money.
                         </p>
                         <p className="text-muted-foreground">
                            We envisioned a future where the supply chain is as smart and automated as the buildings we construct. By integrating AI-powered logistics with a dual fleet of drones and trucks, we're not just delivering materials; we're delivering confidence, predictability, and a new standard of efficiency to the construction industry.
                         </p>
                    </div>
                    <div className="relative h-80 w-full">
                        <Image
                            src="https://placehold.co/600x400.png"
                            alt="A team of construction workers and engineers collaborating"
                            fill
                            className="object-cover rounded-lg transition-transform duration-300 hover:scale-105"
                            data-ai-hint="construction team"
                        />
                    </div>
                </div>
            </div>
        </section>

      </main>

      <footer className="bg-muted">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row md:px-6">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Buildora. All rights reserved.
          </p>
          <nav className="flex gap-4">
            <Link href="#" className="text-sm hover:underline">Terms of Service</Link>
            <Link href="#" className="text-sm hover:underline">Privacy Policy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
