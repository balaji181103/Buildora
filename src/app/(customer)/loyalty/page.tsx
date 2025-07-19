
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { loyaltyData } from "@/lib/data"
import { Award, Star, Gift, ArrowRight } from "lucide-react"

export default function LoyaltyDashboardPage() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div className="flex items-center gap-4">
        <Award className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loyalty Dashboard</h1>
          <p className="text-muted-foreground">Track your points and redeem rewards.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Current Balance Card */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{loyaltyData.currentPoints}</div>
            <p className="text-xs text-muted-foreground">points available to spend</p>
          </CardContent>
        </Card>

        {/* Available Offers Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Available Offers</CardTitle>
            <CardDescription>Use your points to claim these rewards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loyaltyData.availableOffers.map((offer, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-4">
                  <Gift className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold">{offer.title}</p>
                    <p className="text-sm text-muted-foreground">{offer.points} points</p>
                  </div>
                </div>
                <Button>Redeem <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Points History Card */}
      <Card>
        <CardHeader>
          <CardTitle>Points History</CardTitle>
          <CardDescription>A log of your points earned and redeemed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loyaltyData.history.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className={`text-right font-medium ${item.type === 'earned' ? 'text-green-500' : 'text-destructive'}`}>
                    {item.type === 'earned' ? '+' : '-'}{item.points}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
