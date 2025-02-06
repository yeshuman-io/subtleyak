import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../modules/vehicles";
import VehiclesModuleService from "../modules/vehicles/service";

export type UpdateVehicleMakeStepInput = {
  id: string;
  name?: string;
};

export const updateVehicleMakeStep = createStep(
  "update-vehicle-make-step",
  async (input: UpdateVehicleMakeStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);

    const make = await vehiclesModuleService.updateVehicleMakes(input);

    return new StepResponse(make, make.id);
  },
  async (id: string, { container }) => {
    // Rollback logic if needed
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);
  }
);

type UpdateVehicleMakeWorkflowInput = {
  id: string;
  name?: string;
};

export const updateVehicleMakeWorkflow = createWorkflow(
  "update-vehicle-make-workflow",
  (input: UpdateVehicleMakeWorkflowInput) => {
    const make = updateVehicleMakeStep(input);

    return new WorkflowResponse(make);
  }
);