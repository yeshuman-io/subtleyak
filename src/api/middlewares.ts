/**
 * This file is auto-generated and will be overwritten by subsequent generations.
 * Manual changes should be made to the generator templates instead.
 */

import { defineMiddlewares } from "@medusajs/framework/http"

// Vehicles module
import vehiclesMiddlewares from "./admin/vehicles/middlewares"
import seriesMiddlewares from "./admin/vehicles/series/middlewares"
import makesMiddlewares from "./admin/vehicles/makes/middlewares"
import modelsMiddlewares from "./admin/vehicles/models/middlewares"
import bodiesMiddlewares from "./admin/vehicles/bodies/middlewares"
// Wipers module
import wipersMiddlewares from "./admin/wipers/middlewares"
import kitsMiddlewares from "./admin/wipers/kits/middlewares"
import lengthsMiddlewares from "./admin/wipers/lengths/middlewares"
import connectorsMiddlewares from "./admin/wipers/connectors/middlewares"
import armsMiddlewares from "./admin/wipers/arms/middlewares"
// Fitments module
import fitmentsMiddlewares from "./admin/fitments/middlewares"
//asfdasdfasdadsf
export default defineMiddlewares({
  routes: [
    // Vehicles routes
    ...(vehiclesMiddlewares.routes || []),
    ...(seriesMiddlewares.routes || []),
    ...(makesMiddlewares.routes || []),
    ...(modelsMiddlewares.routes || []),
    ...(bodiesMiddlewares.routes || [])
    ,
    // Wipers routes
    ...(wipersMiddlewares.routes || []),
    ...(kitsMiddlewares.routes || []),
    ...(lengthsMiddlewares.routes || []),
    ...(connectorsMiddlewares.routes || []),
    ...(armsMiddlewares.routes || [])
    ,
    // Fitments routes
    ...(fitmentsMiddlewares.routes || []),
    
  ] as const
})