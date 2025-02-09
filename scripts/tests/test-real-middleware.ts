// This file is auto-generated and will be overwritten by subsequent generations
// Manual changes should be made to the generator templates instead

import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from '@medusajs/framework/http';
import { createFindParams } from '@medusajs/medusa/api/utils/validators';
import { z } from 'zod';
import {
  PostAdminCreatevehicle,
  PostAdminUpdatevehicle,
  PostAdminCreateVehicleSeries,
  PostAdminUpdateVehicleSeries,
} from './admin/vehicles/series/validators';
import {
  PostAdminCreatewiper,
  PostAdminUpdatewiper,
  PostAdminCreateWiperKit,
  PostAdminUpdateWiperKit,
} from './admin/wipers/kits/validators';
import {
  PostAdminCreatewiper,
  PostAdminCreateWiper,
  PostAdminUpdatewiper,
  PostAdminUpdateWiper,
} from './admin/wipers/validators';
import {
  PostAdminCreateWiper,
  PostAdminUpdateWiper,
} from './admin/wipers/wipers/validators';

export const Getvehiclemodelsschema = createFindParams().extend({
  make_id: z.string().optional(),
});

export const Getvehicleseriesschema = createFindParams();

export const Getvehiclesschema = createFindParams();

export const Getvehicletestschema = createFindParams().extend({
  test: z.string().optional(),
});

export const Getwiperkitschema = createFindParams();

export const Getwiperschema = createFindParams();

export default defineMiddlewares({
  routes: [
    // GET routes - specific first
    {
      matcher: '/admin/vehicles/test',
      method: 'GET',
      middlewares: [
        validateAndTransformQuery(Getvehiclesschema, {
          defaults: ['id', 'name'],
          isList: true,
        }),
      ],
    },
  ],
});
