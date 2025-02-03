import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../modules/vehicles";
import VehiclesModuleService from "../modules/vehicles/service";

export type UpdateVehicleModelStepInput = {
  id: string;
  name: string;
  make_id: string;
};

export const updateVehicleModelStep = createStep(
  "update-vehicle-model-step",
  async (input: UpdateVehicleModelStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);

    const model = await vehiclesModuleService.updateVehicleModels(input);

    return new StepResponse(model, model.id);
  },
  async (id: string, { container }) => {
    // Rollback logic if needed
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);

    // Could restore previous state if needed
  }
);

type UpdateVehicleModelWorkflowInput = {
  id: string;
  name: string;
  make_id: string;
};

export const updateVehicleModelWorkflow = createWorkflow(
  "update-vehicle-model-workflow",
  (input: UpdateVehicleModelWorkflowInput) => {
    const model = updateVehicleModelStep(input);

    return new WorkflowResponse(model);
  }
);
