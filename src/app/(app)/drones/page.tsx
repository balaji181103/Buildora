import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { drones } from "@/lib/data"
import { MoreHorizontal, PlusCircle, Battery, BatteryFull, BatteryMedium, BatteryLow, Bot } from "lucide-react"
import Link from "next/link"

function BatteryIcon({ level }: { level: number }) {
  if (level > 70) return <BatteryFull className="h-4 w-4 text-green-500" />;
  if (level > 30) return <BatteryMedium className="h-4 w-4 text-yellow-500" />;
  return <BatteryLow className="h-4 w-4 text-red-500" />;
}

export default function DronesPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Drones</CardTitle>
            <CardDescription>Manage your fleet of delivery drones.</CardDescription>
          </div>
          <Button asChild size="sm" className="gap-1">
            <Link href="#">
              <PlusCircle className="h-4 w-4" />
              Add Drone
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Drone ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Battery</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drones.map((drone) => (
              <TableRow key={drone.id}>
                <TableCell className="font-medium">{drone.id}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      drone.status === 'Idle' ? 'secondary' :
                      drone.status === 'Maintenance' ? 'destructive' : 'default'
                    }
                    className={
                      drone.status === 'Idle' ? 'bg-gray-500/20 text-gray-700 dark:text-gray-300' :
                      drone.status === 'Maintenance' ? 'bg-red-500/20 text-red-700' :
                      drone.status === 'Delivering' ? 'bg-blue-500/20 text-blue-700' :
                      'bg-yellow-500/20 text-yellow-700'
                    }
                  >
                    {drone.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <BatteryIcon level={drone.battery} />
                    {drone.battery}%
                  </div>
                </TableCell>
                <TableCell>{drone.location}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View Live Feed</DropdownMenuItem>
                      <DropdownMenuItem>Assign Delivery</DropdownMenuItem>
                      <DropdownMenuItem>Recall Drone</DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={{ pathname: '/ai-tool', query: { droneId: drone.id } }}>
                          Maintenance Log
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
