import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createVehicleModelWorkflow } from "../../../../workflows/create-vehicle-model";
import { PostAdminCreateVehicleModel } from "./validators";

type QueryResponse = {
  data: any[];
  metadata: {
    count: number;
    take: number;
    skip: number;
  };
};

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query");

  const queryOptions = {
    entity: "vehicle_model",
    ...req.queryConfig,
    filters: {
      ...req.queryConfig?.filters,
      ...(req.query.make_id ? { make_id: req.query.make_id } : {}),
    },
  };

  const { data: vehicle_models, metadata } = (await query.graph(
    queryOptions
  )) as QueryResponse;

  res.json({
    vehicle_models,
    count: metadata.count,
    limit: metadata.take,
    offset: metadata.skip,
  });
};

type PostAdminCreateVehicleModelType = z.infer<
  typeof PostAdminCreateVehicleModel
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateVehicleModelType>,
  res: MedusaResponse
) => {
  const { result } = await createVehicleModelWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ vehicleModel: result });
};
