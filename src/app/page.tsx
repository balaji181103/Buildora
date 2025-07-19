import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Hammer, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
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
        <section className="container mx-auto grid grid-cols-1 items-center gap-8 px-4 py-16 text-center md:grid-cols-2 md:px-6 md:py-24 md:text-left">
          <div className="space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              Drone-Powered Delivery for the Modern Construction Site
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Buildora revolutionizes construction logistics with autonomous drone and truck deliveries, ensuring you get the right materials, right when you need them.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start">
              <Button size="lg" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#">Learn More</Link>
              </Button>
            </div>
          </div>
          <div className="relative h-64 w-full md:h-auto md:aspect-square">
            <Image
              src="https://placehold.co/600x600.png"
              alt="Drone delivering a package to a construction site"
              fill
              className="rounded-lg object-cover shadow-xl"
              data-ai-hint="drone delivery construction"
            />
          </div>
        </section>

        <section className="bg-muted py-16 md:py-24">
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
                                <Hammer className="h-8 w-8" />
                            </div>
                            <CardTitle className="mt-4">Reduced Downtime</CardTitle>
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
