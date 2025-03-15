import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
//asdf
export const GetSchema = createFindParams();

export const PostAdminCreateVehicle = z.object({
  make_id: z.string().min(1),
  model_id: z.string().min(1),
});

export const PostAdminUpdateVehicle = z.object({
  make_id: z.string().min(1).optional(),
  model_id: z.string().min(1).optional(),
});

export type VehicleAdminListRes = {
  vehicles: any[];
  count: number;
  limit: number;
  offset: number;
};
