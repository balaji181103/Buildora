
'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight, Calculator } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
    return (
        <div className="w-full bg-muted rounded-lg overflow-hidden">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-8 px-4 py-12 md:px-6 md:py-16">
                <div className="space-y-6">
                    <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
                        Your Construction Supplies, Delivered Faster.
                    </h1>
                    <p className="max-w-xl text-lg text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-200">
                        From AI-powered material estimation to rapid drone delivery, Buildora is your partner in building the future.
                    </p>
                    <div className="flex flex-col gap-4 sm:flex-row animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-300">
                        <Button size="lg" asChild>
                            <Link href="#products">
                                Explore Products
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                             <Link href="#estimator">
                                AI Estimator
                                <Calculator className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className="relative h-64 w-full md:h-auto md:aspect-square animate-in fade-in slide-in-from-right duration-500">
                     <Image
                        src="https://placehold.co/600x600.png"
                        alt="A drone carrying a package over a stylized blueprint background"
                        fill
                        className="rounded-lg object-cover"
                        data-ai-hint="construction drone blueprint"
                    />
                </div>
            </div>
        </div>
    );
}
