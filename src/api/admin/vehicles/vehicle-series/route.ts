import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { PostAdminCreateVehicleSeries } from "./validators";

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
    entity: "vehicle_series",
    ...req.queryConfig,
  };

  const { data: vehicle_series_items, metadata } = (await query.graph(
    queryOptions,
  )) as QueryResponse;

  res.json({
    vehicle_series_items,
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
  res: MedusaResponse,
) => {
  const { result } = await createVehicleSeriesWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ vehicle_series: result });
};
