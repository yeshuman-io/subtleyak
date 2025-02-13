import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

export const GetVehicleBodySchema = createFindParams();

export const PostAdminCreateVehicleBody = z.object({
  name: z.string(),
  models_ids: z.array(z.string().min(1)),
});

export const PostAdminUpdateVehicleBody = z.object({
  name: z.string().optional(),
  models_ids: z.array(z.string().min(1)).optional(),
});

export type AdminCreateVehicleBodyReq = z.infer<typeof PostAdminCreateVehicleBody>;
export type AdminUpdateVehicleBodyReq = z.infer<typeof PostAdminUpdateVehicleBody>;

export type AdminListRes = {
  items: any[];
  count: number;
  limit: number;
  offset: number;
}; 