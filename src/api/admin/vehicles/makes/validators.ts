import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import VehicleMake from "../../../../modules/vehicles/models/vehicle-make";

export const GetVehicleMakeSchema = createFindParams();

export const PostAdminCreateVehicleMake = z.object({
  name: z.string(),
  models_ids: z.array(z.string().min(1)),
  vehicles_ids: z.array(z.string().min(1)),
});

export const PostAdminUpdateVehicleMake = z.object({
  name: z.string().optional(),
  models_ids: z.array(z.string().min(1)).optional(),
  vehicles_ids: z.array(z.string().min(1)).optional(),
});

export type AdminCreateVehicleMakeReq = z.infer<typeof PostAdminCreateVehicleMake>;
export type AdminUpdateVehicleMakeReq = z.infer<typeof PostAdminUpdateVehicleMake>;

export type VehicleMakeAdminListRes = {
  items: typeof VehicleMake;
  count: number;
  limit: number;
  offset: number;
};