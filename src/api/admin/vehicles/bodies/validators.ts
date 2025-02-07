import { z } from "zod";

export const PostAdminCreateVehicleBody = z.object({
  name: z.string().min(1),
  model_ids: z.array(z.string()).optional(),
});

export const PostAdminUpdateVehicleBody = z.object({
  name: z.string().min(1).optional(),
  model_ids: z.array(z.string()).optional(),
}); 