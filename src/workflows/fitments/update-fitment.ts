import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { FITMENTS_MODULE } from "../../modules/fitments";
import FitmentsModuleService from "../../modules/fitments/service";

export type UpdateFitmentStepInput = {
  id: string;
  code?: false;
};

export const updateFitmentStep = createStep(
  "update-fitment-step",
  async (input: UpdateFitmentStepInput, { container }) => {
    const fitmentsModuleService: FitmentsModuleService = 
      container.resolve(FITMENTS_MODULE);

    const fitment = await fitmentsModuleService.updateFitments(input);

    return new StepResponse(fitment, fitment.id);
  },
  async (id: string, { container }) => {
    const fitmentsModuleService: FitmentsModuleService = 
      container.resolve(FITMENTS_MODULE);

      // TODO: Rollback logic
  }
);

type UpdateFitmentWorkflowInput = {
  id: string;
  code?: false;
};

export const updateFitmentWorkflow = createWorkflow(
  "update-fitment-workflow",
  (input: UpdateFitmentWorkflowInput) => {
    const fitment = updateFitmentStep(input);

    return new WorkflowResponse(fitment);
  }
);