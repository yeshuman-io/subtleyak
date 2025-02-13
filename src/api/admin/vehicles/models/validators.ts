import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

export const GetVehicleModelSchema = createFindParams();

export const PostAdminCreateVehicleModel = z.object({
  name: z.string(),
  make_id: z.string().min(1),
  vehicles_ids: z.array(z.string().min(1)),
  bodies_ids: z.array(z.string().min(1)),
});

export const PostAdminUpdateVehicleModel = z.object({
  name: z.string().optional(),
  make_id: z.string().min(1).optional(),
  vehicles_ids: z.array(z.string().min(1)).optional(),
  bodies_ids: z.array(z.string().min(1)).optional(),
});

export type AdminCreateVehicleModelReq = z.infer<typeof PostAdminCreateVehicleModel>;
export type AdminUpdateVehicleModelReq = z.infer<typeof PostAdminUpdateVehicleModel>;

export type AdminListRes = {
  items: any[];
  count: number;
  limit: number;
  offset: number;
}; 