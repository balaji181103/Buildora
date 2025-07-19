
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Hammer, ShieldCheck, BrainCircuit } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";


const slides = [
  {
    image: {
      src: "https://placehold.co/1200x800.png",
      alt: "Drone delivering a package to a construction site",
      hint: "drone delivery construction"
    },
    title: "Welcome to Buildora",
    description: "Buildora revolutionizes construction logistics with autonomous drone and truck deliveries, ensuring you get the right materials, right when you need them.",
    buttons: [
      { text: "Get Started", href: "/signup", variant: "default" },
      { text: "Learn More", href: "#features", variant: "outline" }
    ]
  },
  {
    image: {
      src: "https://placehold.co/1200x800.png",
      alt: "AI interface showing logistics and estimations",
      hint: "AI logistics"
    },
    title: "AI-Powered Material Estimation & Logistics",
    description: "Our intelligent platform uses AI to estimate your material needs with precision and optimizes delivery schedules to prevent project delays.",
    buttons: [
      { text: "Try the Estimator", href: "/login/customer", variant: "default" },
      { text: "Explore AI Features", href: "#features", variant: "outline" }
    ]
  },
  {
    image: {
      src: "https://placehold.co/1200x800.png",
      alt: "A drone and a truck moving in sync",
      hint: "drone truck logistics"
    },
    title: "Dual-Fleet for Ultimate Flexibility",
    description: "From lightweight tools delivered in minutes by drones to heavy materials by truck, our integrated fleet handles all your needs efficiently and safely.",
    buttons: [
      { text: "View Our Fleet", href: "/login/admin", variant: "default" },
      { text: "How It Works", href: "#features", variant: "outline" }
    ]
  }
];

export default function LandingPage() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Rocket className="w-7 h-7 text-primary" />
            <span>Buildora</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login/customer">Customer Login</Link>
            </Button>
            <Button asChild>
              <Link href="/login/admin">Admin Login</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full h-[70vh] md:h-[80vh]">
            <Carousel
              plugins={[plugin.current]}
              className="w-full h-full"
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
              opts={{ loop: true }}
            >
              <CarouselContent className="h-full">
                {slides.map((slide, index) => (
                  <CarouselItem key={index} className="h-full">
                    <div className="relative w-full h-full">
                       <Image
                          src={slide.image.src}
                          alt={slide.image.alt}
                          fill
                          className="object-cover brightness-50"
                          data-ai-hint={slide.image.hint}
                          priority={index === 0}
                      />
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center text-white p-4">
                        <div className="max-w-4xl space-y-6">
                           <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
                              {slide.title}
                            </h1>
                            <p className="max-w-2xl mx-auto text-lg text-primary-foreground/80 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-200">
                              {slide.description}
                            </p>
                            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-300">
                                {slide.buttons.map((button, btnIndex) => (
                                    <Button key={btnIndex} size="lg" variant={button.variant as any} asChild>
                                        <Link href={button.href}>{button.text}</Link>
                                    </Button>
                                ))}
                            </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white bg-black/30 hover:bg-black/50 border-none"/>
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white bg-black/30 hover:bg-black/50 border-none"/>
            </Carousel>
        </section>

        <section id="features" className="bg-muted py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Why Choose Buildora?</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Streamline your supply chain with our intelligent logistics platform.
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                    <Card>
                        <CardHeader className="items-center text-center">
                            <div className="rounded-full bg-primary/10 p-4 text-primary">
                                <Rocket className="h-8 w-8" />
                            </div>
                            <CardTitle className="mt-4">Speed & Efficiency</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-center">
                                Get lightweight materials delivered in minutes via our drone fleet, and heavy goods scheduled perfectly with our trucks.
                            </CardDescription>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="items-center text-center">
                            <div className="rounded-full bg-primary/10 p-4 text-primary">
                                <BrainCircuit className="h-8 w-8" />
                            </div>
                            <CardTitle className="mt-4">AI-Powered Logistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-center">
                                Avoid costly delays. Our predictive AI and real-time tracking ensure your crew is never waiting for supplies.
                            </CardDescription>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="items-center text-center">
                            <div className="rounded-full bg-primary/10 p-4 text-primary">
                                <ShieldCheck className="h-8 w-8" />
                            </div>
                            <CardTitle className="mt-4">Safety & Reliability</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-center">
                                Our robust system minimizes on-site traffic and ensures secure, confirmed deliveries every time.
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
                            className="object-cover rounded-lg"
                            data-ai-hint="team collaboration"
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
