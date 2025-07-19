
'use server';

import { z } from 'zod';
import { suppliers } from '@/lib/data';
import type { Supplier } from '@/lib/types';

const AddSupplierSchema = z.object({
    name: z.string(),
    contactPerson: z.string(),
    email: z.string().email(),
    phone: z.string(),
});

type AddSupplierInput = z.infer<typeof AddSupplierSchema>;

// This is a simulation. In a real app, you would write to a database.
export async function addSupplier(input: AddSupplierInput) {
  try {
    const newSupplier: Supplier = {
        id: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
        name: input.name,
        contactPerson: input.contactPerson,
        email: input.email,
        phone: input.phone,
        productCount: 0, // Initially, they supply 0 products
    };

    // In a real app, you'd insert this into your database.
    // For now, we push to the mock data array.
    suppliers.push(newSupplier);
    
    // We re-sort to keep a consistent order, though a database would handle this.
    suppliers.sort((a, b) => a.id.localeCompare(b.id));

    return { success: true, supplier: newSupplier };
  } catch (e) {
    console.error('Error adding supplier:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}
