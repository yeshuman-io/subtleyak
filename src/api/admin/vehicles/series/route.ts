import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createVehicleSeriesWorkflow } from "../../../../workflows/create-vehicle-series";
import { PostAdminCreateVehicleSeries } from "./validators";


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
    entity: "vehicle_series",
    ...req.queryConfig,
    filters: {
      ...req.queryConfig?.filters,
      ...(req.query.vehicle_id ? { vehicle_id: req.query.vehicle_id } : {}),
      ...(req.query.model_id ? { model_id: req.query.model_id } : {}),
    },
  };

  const { data: series, metadata } = (await query.graph(
    queryOptions
  )) as QueryResponse;

  res.json({
    series,
    count: metadata.count,
    limit: metadata.take,
    offset: metadata.skip,
  });
};

type PostAdminCreateVehicleSeriesType = z.infer<
  typeof PostAdminCreateVehicleSeries
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateVehicleSeriesType>,
  res: MedusaResponse
) => {
  const { result } = await createVehicleSeriesWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ vehicleSeries: result });
}; 