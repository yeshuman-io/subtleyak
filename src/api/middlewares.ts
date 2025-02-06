import { z } from "zod";
import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import {
  PostAdminCreateVehicle,
  PostAdminUpdateVehicle,
} from "./admin/vehicles/validators";
import {
  PostAdminCreateVehicleMake,
  PostAdminUpdateVehicleMake,
} from "./admin/vehicles/makes/validators";
import {
  PostAdminCreateVehicleModel,
  PostAdminUpdateVehicleModel,
} from "./admin/vehicles/models/validators";

export const GetVehiclesSchema = createFindParams();
export const GetVehicleModelsSchema = createFindParams().extend({
  make_id: z.string().optional(),
});

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/vehicles",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetVehiclesSchema, {
          defaults: ["id", "start_year", "end_year", "make.*", "model.*"],
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/vehicles/makes",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetVehiclesSchema, {
          defaults: ["id", "name", "models.*"],
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/vehicles/models",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetVehicleModelsSchema, {
          defaults: ["id", "name", "make.*"],
          isList: true,
        }),
      ],
    },
    // CREATE
    {
      matcher: "/admin/vehicles",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateVehicle)],
    },
    {
      matcher: "/admin/vehicles/makes",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateVehicleMake)],
    },
    {
      matcher: "/admin/vehicles/models",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateVehicleModel)],
    },
    // UPDATE
    {
      matcher: "/admin/vehicles/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminUpdateVehicle)],
    },
    {
      matcher: "/admin/vehicles/makes/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminUpdateVehicleMake)],
    },
    {
      matcher: "/admin/vehicles/models/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminUpdateVehicleModel)],
    },
  ],
});
