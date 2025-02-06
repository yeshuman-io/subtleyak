import { z } from "zod";

export const PostAdminCreateVehicleModel = z.object({
  name: z.string().min(1),
  make_id: z.string().min(1),
});

export const PostAdminUpdateVehicleModel = z.object({
  name: z.string().min(1).optional(),
  make_id: z.string().min(1).optional(),
});