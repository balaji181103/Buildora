
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, Database, Brush, Bot, Cloud, Film } from 'lucide-react';
import * as React from 'react';

const technologySections = [
    {
        title: 'Frontend Development',
        icon: <Brush className="h-8 w-8 text-primary" />,
        items: [
            { name: 'Next.js', description: 'The core React framework providing server-side rendering, routing, and a full-stack application structure.' },
            { name: 'React', description: 'The fundamental UI library for building interactive and stateful user interfaces.' },
            { name: 'TypeScript', description: 'Adds static typing to JavaScript to improve code quality, maintainability, and developer experience.' }
        ]
    },
    {
        title: 'UI / UX Frameworks',
        icon: <Cpu className="h-8 w-8 text-primary" />,
        items: [
            { name: 'Tailwind CSS', description: 'A utility-first CSS framework for rapidly building modern, responsive designs directly in the markup.' },
            { name: 'ShadCN UI', description: 'A collection of re-usable UI components built on top of Tailwind CSS and Radix UI for accessibility.' },
            { name: 'Lucide React', description: 'Provides a comprehensive and consistent set of icons used throughout the application.' }
        ]
    },
    {
        title: 'Backend & Database',
        icon: <Database className="h-8 w-8 text-primary" />,
        items: [
            { name: 'Firebase', description: 'A comprehensive backend-as-a-service (BaaS) platform from Google.' },
            { name: 'Firestore', description: 'A flexible, scalable NoSQL document database for storing all application data like orders and products.' },
            { name: 'Next.js API Routes', description: 'Used for creating serverless API endpoints for specific backend tasks, such as image uploads.' }
        ]
    },
    {
        title: 'Artificial Intelligence',
        icon: <Bot className="h-8 w-8 text-primary" />,
        items: [
            { name: 'Google AI (Gemini)', description: 'The underlying large language model used for generative AI tasks.' },
            { name: 'Genkit', description: 'A framework that structures and simplifies calls to the Gemini API for reliable AI-powered features.' }
        ]
    },
    {
        title: 'Deployment & Hosting',
        icon: <Cloud className="h-8 w-8 text-primary" />,
        items: [
            { name: 'Firebase App Hosting', description: 'A secure, fast, and reliable hosting service specifically for modern web applications like Next.js.' }
        ]
    },
     {
        title: 'Media Management',
        icon: <Film className="h-8 w-8 text-primary" />,
        items: [
            { name: 'Cloudinary', description: 'An end-to-end cloud service for managing all images and media assets, handling storage, optimization, and delivery.' }
        ]
    }
];

export default function ToolsPage() {
    return (
        <div className="mx-auto grid w-full max-w-6xl gap-6">
            <div className="grid gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Tools & Technology Used</h1>
                <p className="text-muted-foreground">
                    An overview of the modern technology stack that powers the Buildora application.
                </p>
            </div>
            <div className="grid gap-6">
                {technologySections.map(section => (
                    <Card key={section.title}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                {section.icon}
                                {section.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y">
                                {section.items.map(item => (
                                    <div key={item.name} className="py-4 first:pt-0 last:pb-0">
                                        <h4 className="font-semibold">{item.name}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
