import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createVehicleMakeWorkflow } from "../../../../workflows/create-vehicle-make";
import { PostAdminCreateVehicleMake } from "./validators";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query");

  const {
    data: vehicle_makes,
    metadata: { count, take, skip },
  } = await query.graph({
    entity: "vehicle_make",
    ...req.queryConfig,
  });

  res.json({
    vehicle_makes,
    count,
    limit: take,
    offset: skip,
  });
};

type PostAdminCreateVehicleMakeType = z.infer<
  typeof PostAdminCreateVehicleMake
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateVehicleMakeType>,
  res: MedusaResponse
) => {
  const { result } = await createVehicleMakeWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ vehicleMake: result });
};
