// This file is auto-generated and will be overwritten by subsequent generations
// Manual changes should be made to the generator templates instead

import { z } from 'zod';

export default defineMiddlewares({
  routes: [
    // CREATE routes - specific first
    {
      matcher: '/admin/vehicles',
      method: 'POST',
      middlewares: [
        unlessPath(
          /.*\/(models|makes)/,
          validateAndTransformBody(PostAdminCreateVehicle)
        ),
      ],
    },
  ],
});
