import { z } from "zod";

export const PostAdminCreateVehicleMake = z.object({
  name: z.string().min(1),
});
