import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../modules/vehicles";
import VehiclesModuleService from "../modules/vehicles/service";

export type UpdateVehicleStepInput = {
  id: string;
  make_id?: string;
  model_id?: string;
  start_year?: number;
  end_year?: number;
};

export const updateVehicleStep = createStep(
  "update-vehicle-step",
  async (input: UpdateVehicleStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);

    const vehicle = await vehiclesModuleService.updateVehicles(input);

    return new StepResponse(vehicle, vehicle.id);
  },
  async (id: string, { container }) => {
    // Rollback logic if needed
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);
  }
);

type UpdateVehicleWorkflowInput = {
  id: string;
  make_id?: string;
  model_id?: string;
  start_year?: number;
  end_year?: number;
};

export const updateVehicleWorkflow = createWorkflow(
  "update-vehicle-workflow",
  (input: UpdateVehicleWorkflowInput) => {
    const vehicle = updateVehicleStep(input);

    return new WorkflowResponse(vehicle);
  }
); 