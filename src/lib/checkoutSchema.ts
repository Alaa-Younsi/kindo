import { z } from "zod";

export const checkoutSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().regex(/^0[5-7][0-9]{8}$/, "invalid phone"),
  wilaya: z.string().min(1),
  city: z.string().trim().min(1).max(80),
  delivery_type: z.enum(["home", "office"]),
  website: z.string().optional(), // honeypot field, real users never fill it
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
