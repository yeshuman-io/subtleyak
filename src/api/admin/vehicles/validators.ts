import { z } from "zod";

export const PostAdminCreateVehicle = z.object({
  make_id: z.string().min(1),
  model_id: z.string().min(1),
  start_year: z.number().min(1),
  end_year: z.number().min(1),
});
