import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createVehicleBodyWorkflow } from "../../../../workflows/create-vehicle-body";
import { PostAdminCreateVehicleBody } from "./validators";


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
    entity: "vehicle_body",
    ...req.queryConfig,
    filters: {
      ...req.queryConfig?.filters,
    },
  };

  const { data: bodies, metadata } = (await query.graph(
    queryOptions
  )) as QueryResponse;

  res.json({
    bodies,
    count: metadata.count,
    limit: metadata.take,
    offset: metadata.skip,
  });
};

type PostAdminCreateVehicleBodyType = z.infer<
  typeof PostAdminCreateVehicleBody
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateVehicleBodyType>,
  res: MedusaResponse
) => {
  const { result } = await createVehicleBodyWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ vehicleBody: result });
}; 