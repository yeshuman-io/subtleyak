import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createVehicleWorkflow } from "../../../workflows/create-vehicle";
import { PostAdminCreateVehicle } from "./validators";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query");

  const {
    data: vehicles,
    metadata: { count, take, skip },
  } = await query.graph({
    entity: "vehicle",
    ...req.queryConfig,
  });

  res.json({
    vehicles,
    count,
    limit: take,
    offset: skip,
  });
};

type PostAdminCreateVehicleType = z.infer<typeof PostAdminCreateVehicle>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateVehicleType>,
  res: MedusaResponse
) => {
  const { result } = await createVehicleWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ vehicle: result });
};
