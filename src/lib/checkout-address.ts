import { z } from 'zod';

// Server-side shape of orders.shipping_address. Mirrors the checkout form rules;
// unknown keys are stripped, every field has a max length.
const optional = (max: number) => z.string().trim().max(max).optional();

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().regex(/^01\d{9}$/),
  secondaryPhone: z.string().trim().regex(/^(01\d{9})?$/).optional(),
  addressLine1: z.string().trim().min(3).max(200),
  addressLine2: optional(200),
  landmark: z.string().trim().min(2).max(200),
  city: z.string().trim().min(2).max(100),
  stateOrRegion: z.string().trim().min(2).max(100),
  postalCode: optional(20),
  country: optional(60),
  preferredDeliveryTime: optional(100),
  deliveryNotes: optional(500),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
