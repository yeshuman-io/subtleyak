import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { updateVehicleSeriesWorkflow } from "../../../../../workflows/vehicles/update-vehicle-series";
import { PostAdminUpdateVehicleSeries } from "../validators";

type PostAdminUpdateVehicleSeriesType = z.infer<
  typeof PostAdminUpdateVehicleSeries
>;

export const POST = async (
  req: MedusaRequest<PostAdminUpdateVehicleSeriesType>,
  res: MedusaResponse
) => {
  const { result } = await updateVehicleSeriesWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  });

  res.json({ vehicle_series: result });
};