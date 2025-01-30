'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation'
import postgres from 'postgres';
 
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
 
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });
 
export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

try{   
  await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
`;
} catch (error) {
    //We will log the error
    console.log(error);
} 
revalidatePath('/dashboard/invoices');
redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
   
    const amountInCents = amount * 100;
   
try {    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
} catch(error) {
    console.log(error);
} 
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }

/*
UpdateInvoice:
Similarly to the createInvoice action, here you are:

Extracting the data from formData.
Validating the types with Zod.
Converting the amount to cents.
Passing the variables to your SQL query.
Calling revalidatePath to clear the client cache and make a new server request.
Calling redirect to redirect the user to the invoice's page.
Test it out by editing an invoice. After submitting the form, you should be redirected to the invoices page, and the invoice should be updated.
  */

export async function deleteInvoice(id: string) {
    throw new Error('Failed to Delete Invoice');
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
}