
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { QrCode } from "lucide-react"

export default function QrPage() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold flex items-center gap-2"><QrCode className="h-8 w-8" /> QR Management</h1>
        <p className="text-muted-foreground">Manage your QR codes for payments and tracking.</p>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>QR Code Generator</CardTitle>
            <CardDescription>
              This feature is coming soon. You will be able to generate QR codes for various purposes here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">QR code generation and management functionality will be available in a future update.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
