import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../../modules/vehicles";
import VehiclesModuleService from "../../modules/vehicles/service";

export type DeleteVehicleSeriesStepInput = {
  id: string;
};

export const deleteVehicleSeriesStep = createStep(
  "delete-vehicle-series-step",
  async (input: DeleteVehicleSeriesStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    const original = await vehiclesModuleService.retrieveVehicleSeries(input.id);
    await vehiclesModuleService.deleteVehicleSeriess(input.id);

    return new StepResponse(true, { id: input.id, original });
  },
  async (context: { id: string; original: Record<string, any> }, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    await vehiclesModuleService.createVehicleSeriess(context.original);
  }
);

type DeleteVehicleSeriesWorkflowInput = DeleteVehicleSeriesStepInput;

export const deleteVehicleSeriesWorkflow = createWorkflow(
  "delete-vehicle-series-workflow",
  (input: DeleteVehicleSeriesWorkflowInput) => {
    const result = deleteVehicleSeriesStep(input);

    return new WorkflowResponse(result);
  }
);