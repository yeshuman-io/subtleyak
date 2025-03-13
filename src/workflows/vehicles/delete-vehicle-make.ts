import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../../modules/vehicles";
import VehiclesModuleService from "../../modules/vehicles/service";

export type DeleteVehicleMakeStepInput = {
  id: string;
};

export const deleteVehicleMakeStep = createStep(
  "delete-vehicle-make-step",
  async (input: DeleteVehicleMakeStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    const original = await vehiclesModuleService.retrieveVehicleMake(input.id);
    await vehiclesModuleService.deleteVehicleMakes(input.id);

    return new StepResponse(true, { id: input.id, original });
  },
  async (context: { id: string; original: Record<string, any> }, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    await vehiclesModuleService.createVehicleMakes(context.original);
  }
);

type DeleteVehicleMakeWorkflowInput = DeleteVehicleMakeStepInput;

export const deleteVehicleMakeWorkflow = createWorkflow(
  "delete-vehicle-make-workflow",
  (input: DeleteVehicleMakeWorkflowInput) => {
    const result = deleteVehicleMakeStep(input);

    return new WorkflowResponse(result);
  }
);