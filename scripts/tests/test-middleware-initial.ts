/*This file is auto-generated and will be overwritten by subsequent generations
Manual changes should be made to the generator templates instead*/ import {
  PostAdminCreateVehicleBody,
  PostAdminUpdateVehicleBody,
} from './admin/vehicles/bodies/validators';
import {
  PostAdminCreateVehicleMake,
  PostAdminUpdateVehicleMake,
} from './admin/vehicles/makes/validators';
import {
  PostAdminCreateVehicleModel,
  PostAdminUpdateVehicleModel,
} from './admin/vehicles/models/validators';
import {
  PostAdminCreateVehicle,
  PostAdminUpdateVehicle,
} from './admin/vehicles/validators';
import {
  PostAdminCreateWiperKit,
  PostAdminUpdateWiperKit,
} from './admin/wipers/kits/validators';
import {
  PostAdminCreateWiper,
  PostAdminUpdateWiper,
} from './admin/wipers/validators';
import {
  defineMiddlewares,
  unlessPath,
  validateAndTransformBody,
  validateAndTransformQuery,
} from '@medusajs/framework/http';
import { createFindParams } from '@medusajs/medusa/api/utils/validators';
import { z } from 'zod';
export default defineMiddlewares({
  routes: [
    // GET routes - specific first
    {
      matcher: '/admin/wipers/kits',
      method: 'GET',
      middlewares: [
        validateAndTransformQuery(GetWiperKitSchema, {
          defaults: ['id', 'name', 'code', 'wiper'],
          select: ['id', 'name', 'code', 'wiper'],
          relations: ['wiper'],
          isList: true,
        }),
      ],
    },
    {
      matcher: '/admin/wipers',
      method: 'GET',
      middlewares: [
        validateAndTransformQuery(GetWiperSchema, {
          defaults: ['id', 'name', 'code', 'kits'],
          select: ['id', 'name', 'code', 'kits'],
          relations: ['kits'],
          isList: true,
        }),
      ],
    },

    // UPDATE routes - specific first
    {
      matcher: '/admin/wipers/kits/:id',
      method: 'POST',
      middlewares: [validateAndTransformBody(PostAdminUpdateWiperKit)],
    },
    {
      matcher: '/admin/wipers/:id',
      method: 'POST',
      middlewares: [validateAndTransformBody(PostAdminUpdateWiper)],
    }, // CREATE routes - specific first
    {
      matcher: '/admin/wipers/kits',
      method: 'POST',
      middlewares: [validateAndTransformBody(PostAdminCreateWiperKit)],
    },
    {
      matcher: '/admin/wipers',
      method: 'POST',
      middlewares: [validateAndTransformBody(PostAdminCreateWiper)],
    },
  ],
});
