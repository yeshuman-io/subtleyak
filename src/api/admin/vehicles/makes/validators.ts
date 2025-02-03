import { z } from "zod";

export const PostAdminCreateVehicleMake = z.object({
  name: z.string().min(1),
});

// export const PutAdminUpdateVehicleMake = z.object({
//   name: z.string().min(1),
// });
