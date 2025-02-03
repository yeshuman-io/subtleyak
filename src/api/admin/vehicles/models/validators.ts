import { z } from "zod";

export const PostAdminCreateVehicleModel = z.object({
  name: z.string().min(1),
  make_id: z.string().min(1),
});

export const PutAdminUpdateVehicleModel = z.object({
  name: z.string(),
  make_id: z.string(),
});