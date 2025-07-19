
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { Calculator } from "lucide-react"

export default function MaterialEstimatorPage() {
  return (
    <div className="flex flex-col gap-4">
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                    <Link href="/home">Home</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>Material Estimator</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-6 w-6"/>
                        AI Material Estimator
                    </CardTitle>
                    <CardDescription>
                        Fill in the details below to get an AI-powered material estimate for your project.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                            <Label htmlFor="length">Length (m)</Label>
                            <Input id="length" type="number" placeholder="e.g., 5" />
                        </div>
                        <div>
                            <Label htmlFor="width">Width (m)</Label>
                            <Input id="width" type="number" placeholder="e.g., 4" />
                        </div>
                        <div>
                            <Label htmlFor="height">Height (m)</Label>
                            <Input id="height" type="number" placeholder="e.g., 2.4" />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="project-type">Project Type</Label>
                        <Select>
                            <SelectTrigger id="project-type">
                                <SelectValue placeholder="Select project type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="painting">Painting</SelectItem>
                                <SelectItem value="drywall">Drywall Installation</SelectItem>
                                <SelectItem value="flooring">Flooring</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button className="w-full">Calculate Estimate</Button>
                </CardContent>
            </Card>

            <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle>Estimated Materials</CardTitle>
                    <CardDescription>
                        Your calculated materials will appear here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-20">
                        Awaiting calculation...
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
