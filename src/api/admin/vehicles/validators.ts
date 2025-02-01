import { z } from "zod";

export const PostAdminCreateVehicle = z.object({
  name: z.string().min(1),
  makeId: z.string().min(1),
  modelId: z.string().min(1),
});
