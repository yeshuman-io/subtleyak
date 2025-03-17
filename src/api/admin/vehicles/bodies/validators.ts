import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import VehicleBody from "../../../../modules/vehicles/models/vehicle-body";

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

export type VehicleBodyAdminListRes = {
  items: typeof VehicleBody;
  count: number;
  limit: number;
  offset: number;
};