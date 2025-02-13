import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createVehicleMakeWorkflow } from "../../../../workflows/create-vehicle-make";
import { PostAdminCreateVehicleMake } from "./validators";


//asdfsadfs
type QueryResponse = {
  data: any[];
  metadata: {
    count: number;
    take: number;
    skip: number;
  };//asdf
};
//asdfasdfasdfd
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query");

  const queryOptions = {
    entity: "vehicle_make",
    ...req.queryConfig,
    filters: {
      ...req.queryConfig?.filters,
    },
  };

  const { data: makes, metadata } = (await query.graph(
    queryOptions
  )) as QueryResponse;

  res.json({
    makes,
    count: metadata.count,
    limit: metadata.take,
    offset: metadata.skip,
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