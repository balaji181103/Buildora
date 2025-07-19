
'use server';

import { z } from 'zod';
import { customers } from '@/lib/data';
import type { Customer } from '@/lib/types';

const AddCustomerSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
});

type AddCustomerInput = z.infer<typeof AddCustomerSchema>;

// This is a simulation. In a real app, you would write to a database.
export async function addCustomer(input: AddCustomerInput) {
  try {
    const newCustomer: Customer = {
        id: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        status: 'Active',
        loyaltyPoints: 0,
        orderCount: 0,
    };

    // In a real app, you'd insert this into your MongoDB collection.
    // For now, we push to the mock data array.
    customers.push(newCustomer);
    
    // We re-sort to keep a consistent order, though a database would handle this.
    customers.sort((a, b) => a.id.localeCompare(b.id));

    return { success: true, customer: newCustomer };
  } catch (e) {
    console.error('Error adding customer:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}
