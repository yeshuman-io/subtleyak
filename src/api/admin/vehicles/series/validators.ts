import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import VehicleSeries from "../../../../modules/vehicles/models/vehicle-series";

export const GetVehicleSeriesSchema = createFindParams();

export const PostAdminCreateVehicleSeries = z.object({
  start_year: z.number(),
  end_year: z.number(),
  vehicle_id: z.string().min(1),
  model_id: z.string().min(1),
});

export const PostAdminUpdateVehicleSeries = z.object({
  start_year: z.number().optional(),
  end_year: z.number().optional(),
  vehicle_id: z.string().min(1).optional(),
  model_id: z.string().min(1).optional(),
});

export type AdminCreateVehicleSeriesReq = z.infer<typeof PostAdminCreateVehicleSeries>;
export type AdminUpdateVehicleSeriesReq = z.infer<typeof PostAdminUpdateVehicleSeries>;

export type VehicleSeriesAdminListRes = {
  items: typeof VehicleSeries;
  count: number;
  limit: number;
  offset: number;
};